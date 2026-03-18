# resources/issuing.py
from flask_restful import Resource, reqparse, marshal_with, fields
from models import db, Issuing, Book, Member, Transaction, Overdue
from datetime import datetime, timedelta

issuing_fields = {
    'id': fields.Integer,
    'member_id': fields.Integer,
    'book_id': fields.Integer,
    'issue_date': fields.DateTime,
    'return_date': fields.DateTime,
    'charge': fields.Float,
    'is_cleared': fields.Boolean,
    'email': fields.String(attribute=lambda issuing: issuing.member.email),
    'image_url': fields.String(attribute=lambda issuing: issuing.book.image_url),
    'book_name': fields.String(attribute=lambda issuing: issuing.book.title),
    'member_name': fields.String(attribute=lambda issuing: issuing.member.name)
}


class IssuingResource(Resource):
    @marshal_with(issuing_fields)
    def get(self):
        return Issuing.query.all()

    def post(self):
        """
        Issue a book.
        Required args:
            - email (member)
            - book_name (title)
            - days (integer >= 1): loan period in days
        Charge is days * 100.
        Validations:
            - Book in stock
            - Member exists and outstanding_debt + charge <= 500
        Creates Issuing and an Overdue row with status '-' (book currently on loan).
        """
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=str, required=True)
        parser.add_argument('book_name', type=str, required=True)
        parser.add_argument('days', type=int, required=True)
        args = parser.parse_args()

        if args['days'] is None or args['days'] < 1:
            return {'message': 'Days must be at least 1'}, 400

        member = Member.query.filter_by(email=args['email']).first()
        book = Book.query.filter_by(title=args['book_name']).first()

        if not book or not member:
            return {'message': 'Book or Member not found'}, 404

        if book.stock <= 0:
            return {'message': 'Book out of stock'}, 400

        days = args['days']
        per_day_charge = 100.0
        total_charge = days * per_day_charge

        if member.outstanding_debt + total_charge > 500:
            return {'message': 'Outstanding debt would exceed Kes.500 with this charge'}, 400

        issue_date = datetime.utcnow()
        expected_return_date = issue_date + timedelta(days=days)

        issue = Issuing(
            member_id=member.id,
            book_id=book.id,
            issue_date=issue_date,
            return_date=expected_return_date,
            charge=total_charge,
            is_cleared=False
        )

        book.stock -= 1
        member.outstanding_debt += total_charge

        db.session.add(issue)
        db.session.flush()  # get issue.id before commit

        # Create Overdue record for tracking.
        # overdue_days, status and fine are stored as initial defaults here.
        # The GET in overdue.py will compute them LIVE as long as actual_return_date is None.
        overdue = Overdue(
            member_id=member.id,
            member_name=member.name,
            book_id=book.id,
            book_title=book.title,
            book_author=book.author,
            issue_id=issue.id,
            issued_at=issue_date,
            expected_return_date=expected_return_date,
            actual_return_date=None,
            overdue_days=0,
            status='-',
            fine=0.0
        )

        db.session.add(overdue)
        db.session.commit()
        return {'message': 'Book issued successfully', 'issue_id': issue.id}, 201

    def put(self):
        """
        Return a book.
        Required args:
            - email
            - book_name
        Finds active Issuing (is_cleared=False) for the member/book and marks it as returned.
        Writes final overdue_days, fine and status to the Overdue record.
        Creates a Transaction record.
        Once actual_return_date is set, overdue.py GET will use these stored values.
        """
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=str, required=True)
        parser.add_argument('book_name', type=str, required=True)
        args = parser.parse_args()

        member = Member.query.filter_by(email=args['email']).first()
        book = Book.query.filter_by(title=args['book_name']).first()

        if not member or not book:
            return {'message': 'Invalid email or book title'}, 404

        issue = Issuing.query.filter_by(
            member_id=member.id,
            book_id=book.id,
            is_cleared=False
        ).first()

        if not issue:
            return {'message': 'No active issuing record found'}, 404

        actual_return_date = datetime.utcnow()
        issue.is_cleared = True
        expected_return_date = issue.return_date

        # Restore stock
        book.stock += 1

        # Compute final overdue days (positive only)
        overdue_days = 0
        if expected_return_date:
            delta = actual_return_date.date() - expected_return_date.date()
            overdue_days = max(0, delta.days)

        # Fine: Kes.120 per overdue day
        fine_per_day = 120.0
        fine_amount = overdue_days * fine_per_day

        # Write final values to the Overdue record created at issue time.
        # After this commit, overdue.py GET will read these stored values
        # instead of calculating live (because actual_return_date is now set).
        overdue_record = Overdue.query.filter_by(
            member_id=member.id,
            book_id=book.id,
            actual_return_date=None
        ).order_by(Overdue.created_at.desc()).first()

        if overdue_record:
            overdue_record.actual_return_date = actual_return_date
            overdue_record.overdue_days = overdue_days
            overdue_record.fine = fine_amount
            overdue_record.status = 'Returned late' if overdue_days > 0 else 'Returned'
        else:
            # Overdue record missing — create it now as a fallback
            overdue_record = Overdue(
                member_id=member.id,
                member_name=member.name,
                book_id=book.id,
                book_title=book.title,
                book_author=book.author,
                issue_id=issue.id,
                issued_at=issue.issue_date,
                expected_return_date=expected_return_date or issue.issue_date,
                actual_return_date=actual_return_date,
                overdue_days=overdue_days,
                status='Returned late' if overdue_days > 0 else 'Returned',
                fine=fine_amount
            )
            db.session.add(overdue_record)

        # Create a Transaction record
        transaction = Transaction(
            member_id=issue.member_id,
            book_id=issue.book_id,
            issue_date=issue.issue_date,
            return_date=actual_return_date,
            fee_charged=issue.charge
        )

        # Add fine to outstanding debt if applicable
        if fine_amount > 0:
            member.outstanding_debt += fine_amount

        db.session.add(transaction)
        db.session.commit()

        return {
            'message': 'Book returned successfully and transaction recorded',
            'overdue_days': overdue_days,
            'fine': fine_amount
        }, 200
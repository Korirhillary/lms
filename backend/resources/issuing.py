from flask_restful import Resource, reqparse, marshal_with, fields
from models import db, Issuing, Book, Member, Transaction
from datetime import datetime


issuing_fields = {
    'id': fields.Integer,
    'member_id': fields.Integer,
    'book_id': fields.Integer,
    'issue_date': fields.DateTime,
    'return_date': fields.DateTime,
    'charge': fields.Float,
    'is_cleared': fields.Boolean,
    'email': fields.String(attribute=lambda issuing: issuing.member.email),
    'book_name': fields.String(attribute=lambda issuing: issuing.book.title),
    'member_name': fields.String(attribute=lambda issuing: issuing.member.name) 
}



class IssuingResource(Resource):
    @marshal_with(issuing_fields)
    def get(self):
        return Issuing.query.all()

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=str, required=True)
        parser.add_argument('book_name', type=str, required=True)
        args = parser.parse_args()

        member = Member.query.filter_by(email=args['email']).first()
        book = Book.query.filter_by(title=args['book_name']).first()

        if not book or not member:
            return {'message': 'Book or Member not found'}, 404

        if book.stock <= 0:
            return {'message': 'Book out of stock'}, 400

        if member.outstanding_debt + 50 > 500:
            return {'message': 'Outstanding debt exceeds Kes.500'}, 400

        issue = Issuing(member_id=member.id, book_id=book.id, charge=50.0)
        book.stock -= 1
        member.outstanding_debt += 50

        db.session.add(issue)
        db.session.commit()
        return {'message': 'Book issued successfully'}, 201

    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=str, required=True)
        parser.add_argument('book_name', type=str, required=True)
        args = parser.parse_args()

        member = Member.query.filter_by(email=args['email']).first()
        book = Book.query.filter_by(title=args['book_name']).first()

        if not member or not book:
            return {'message': 'Invalid email or book title'}, 404

        issue = Issuing.query.filter_by(member_id=member.id, book_id=book.id, is_cleared=False).first()

        if not issue:
            return {'message': 'No active issuing record found'}, 404

        issue.return_date = datetime.utcnow()
        issue.is_cleared = True
        book.stock += 1

        transaction = Transaction(
            member_id=issue.member_id,
            book_id=issue.book_id,
            issue_date=issue.issue_date,
            return_date=issue.return_date,
            fee_charged=issue.charge
        )

        # Reset outstanding debt upon return
        member.outstanding_debt = max(member.outstanding_debt - issue.charge, 0)

        db.session.add(transaction)
        db.session.commit()
        return {'message': 'Book returned successfully and transaction recorded'}, 200
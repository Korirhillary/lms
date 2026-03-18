from flask_restful import Resource
from flask import jsonify
from models import Overdue
from datetime import datetime


class OverdueResource(Resource):
    def get(self):
        records = Overdue.query.order_by(Overdue.created_at.desc()).all()
        now = datetime.utcnow()
        result = []

        for record in records:
            # Dynamically compute overdue_days, status and fine on every request
            if record.actual_return_date is None:
                # Book has NOT been returned yet
                if record.expected_return_date and now.date() > record.expected_return_date.date():
                    # Past the due date — calculate live overdue days
                    overdue_days = (now.date() - record.expected_return_date.date()).days
                    status = "Overdue"
                    fine = overdue_days * 120.0  # Kes.120 per overdue day
                else:
                    # Still within the loan period
                    overdue_days = 0
                    status = "-"
                    fine = 0.0
            else:
                # Book has been returned — use the stored values written by issuing.py PUT
                overdue_days = record.overdue_days
                fine = record.fine
                status = "Returned late" if record.overdue_days > 0 else "Returned"

            result.append({
                "id": record.id,
                "member_id": record.member_id,
                "member_name": record.member_name,
                "book_id": record.book_id,
                "book_title": record.book_title,
                "book_author": record.book_author,
                "issued_at": record.issued_at.strftime("%a, %d %b %Y %H:%M:%S -0000") if record.issued_at else None,
                "expected_return_date": record.expected_return_date.strftime("%a, %d %b %Y %H:%M:%S -0000") if record.expected_return_date else None,
                "actual_return_date": record.actual_return_date.strftime("%a, %d %b %Y %H:%M:%S -0000") if record.actual_return_date else None,
                "overdue_days": overdue_days,
                "status": status,
                "fine": fine
            })

        return jsonify(result)
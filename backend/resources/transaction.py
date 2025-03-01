from flask_restful import Resource,marshal_with, fields
from models import db, Transaction

transaction_fields = {
    'id': fields.Integer,
    'member_id': fields.Integer,
    'book_id': fields.Integer,
    'issue_date': fields.DateTime,
    'return_date': fields.DateTime,
    'fee_charged': fields.Float,
    'book_name': fields.String(attribute=lambda issuing: issuing.book.title),
    'member_name': fields.String(attribute=lambda issuing: issuing.member.name)
}

class TransactionResource(Resource):
    @marshal_with(transaction_fields)
    def get(self):
        return Transaction.query.all()
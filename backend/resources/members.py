# resources/members.py
from flask_restful import Resource, reqparse, marshal_with, fields
from models import db, Member

member_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'email': fields.String,
    'outstanding_debt': fields.Float
}

class MemberResource(Resource):
    @marshal_with(member_fields)
    def get(self):
        return Member.query.all()

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, required=True)
        parser.add_argument('email', type=str, required=True)
        args = parser.parse_args()
        
        if Member.query.filter_by(email=args['email']).first():
            return {'message': 'Email already exists'}, 400
        
        member = Member(name=args['name'], email=args['email'])
        db.session.add(member)
        db.session.commit()
        return {'message': 'Member added successfully'}, 201
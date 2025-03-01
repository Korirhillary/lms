from flask_restful import Resource, reqparse, marshal_with, fields
from models import db, Book

book_fields = {
    'id': fields.Integer,
    'title': fields.String,
    'author': fields.String,
    'stock': fields.Integer,
    'image_url': fields.String  
}

class BookResource(Resource):
    @marshal_with(book_fields)
    def get(self):
        return Book.query.all()

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('title', type=str, required=True)
        parser.add_argument('author', type=str, required=True)
        parser.add_argument('stock', type=int, required=True)
        parser.add_argument('image_url', type=str, required=False) 
        args = parser.parse_args()

        book = Book(
            title=args['title'], 
            author=args['author'], 
            stock=args['stock'], 
            image_url=args.get('image_url')  
        )
        db.session.add(book)
        db.session.commit()
        return {'message': 'Book added successfully'}, 201
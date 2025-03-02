from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_restful import Api
from flask_migrate import Migrate 
from models import db
from resources.transaction import TransactionResource
from resources.books import BookResource
from resources.members import MemberResource
from resources.issuing import IssuingResource  

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///library.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'supersecretkey'

db.init_app(app)
migrate = Migrate(app, db) 
api = Api(app)
CORS(app)
JWTManager(app)

api.add_resource(TransactionResource, '/transactions')
api.add_resource(BookResource, '/books')
api.add_resource(MemberResource, '/members')
api.add_resource(IssuingResource, '/issuing') 

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

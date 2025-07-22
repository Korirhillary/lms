import os
from flask import Flask , send_from_directory
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

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
CORS(app)  # To allow cross-origin requests (optional)

@app.route('/')
def index():
    return send_from_directory(os.path.join(app.static_folder, 'index.html'))

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(app.static_folder, path))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    image_url = db.Column(db.String(500), nullable=True)  
    transactions = db.relationship('Transaction', backref='book', lazy=True)
    issues = db.relationship('Issuing', backref='book', lazy=True)


class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    outstanding_debt = db.Column(db.Float, default=0.0)
    transactions = db.relationship('Transaction', backref='member', lazy=True)
    issues = db.relationship('Issuing', backref='member', lazy=True)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    issue_date = db.Column(db.DateTime, default=datetime.utcnow)
    return_date = db.Column(db.DateTime, nullable=True)
    fee_charged = db.Column(db.Float, default=0.0)

class Issuing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    issue_date = db.Column(db.DateTime, default=datetime.utcnow)
    return_date = db.Column(db.DateTime, nullable=True)
    charge = db.Column(db.Float, nullable=False, default=50.0)
    is_cleared = db.Column(db.Boolean, default=False)
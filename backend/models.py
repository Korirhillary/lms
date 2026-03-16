# models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    image_url = db.Column(db.String(500), nullable=True)  # New field for book image
    transactions = db.relationship('Transaction', backref='book', lazy=True)
    issues = db.relationship('Issuing', backref='book', lazy=True)
    overdues = db.relationship('Overdue', backref='book', lazy=True)


class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    outstanding_debt = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    transactions = db.relationship('Transaction', backref='member', lazy=True)
    issues = db.relationship('Issuing', backref='member', lazy=True)
    overdues = db.relationship('Overdue', backref='member', lazy=True)


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
    # expected return date (set at issue time; used to calculate overdue)
    return_date = db.Column(db.DateTime, nullable=True)
    # total charge for the whole loan (days * 100)
    charge = db.Column(db.Float, nullable=False, default=100.0)
    is_cleared = db.Column(db.Boolean, default=False)


class Overdue(db.Model):
    """
    Stores overdue / status information for every issuing.
    Includes a record even when returned on time (overdue_days=0, fine=0, status='Returned').
    """
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    # storing member_name redundantly for convenience / quick display
    member_name = db.Column(db.String(255), nullable=False)

    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    book_title = db.Column(db.String(255), nullable=False)
    book_author = db.Column(db.String(255), nullable=False)

    issue_id = db.Column(db.Integer, nullable=True)  # optional link back to Issuing.id

    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    expected_return_date = db.Column(db.DateTime, nullable=False)
    actual_return_date = db.Column(db.DateTime, nullable=True)

    overdue_days = db.Column(db.Integer, nullable=False, default=0)
    # status: 'delay' (still on loan), 'Returned' (returned on time), 'Returned late' (returned after due)
    status = db.Column(db.String(50), nullable=False, default='-')
    fine = db.Column(db.Float, nullable=False, default=0.0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
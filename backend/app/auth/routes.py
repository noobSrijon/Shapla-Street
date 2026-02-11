from flask import Blueprint, request, jsonify, current_app
from ..db import mongo
import bcrypt
import jwt
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    users = mongo.db.users
    if users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    users.insert_one({
        "email": email,
        "password": hashed_password,
        "name": name,
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    users = mongo.db.users
    user = users.find_one({"email": email})

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({"token": token, "user": {"email": user['email'], "name": user.get('name')}}), 200

    return jsonify({"error": "Invalid credentials"}), 401

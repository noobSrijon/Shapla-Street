from flask import Blueprint, jsonify, request
from ..db import mongo
import jwt
from functools import wraps
from flask import current_app

watchlist_bp = Blueprint('watchlist', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

@watchlist_bp.route('/', methods=['GET'])
@token_required
def get_watchlist(current_user_id):

    user = mongo.db.users.find_one({"_id": current_user_id}) 
   
    from bson.objectid import ObjectId
    try:
        uid = ObjectId(current_user_id)
    except:
        return jsonify({'message': 'Invalid User ID'}), 400
        
    user_doc = mongo.db.users.find_one({"_id": uid})
    if not user_doc:
        return jsonify({'message': 'User not found'}), 404
        
    watchlist_symbols = user_doc.get('watchlist', [])
    
    # Fetch details for these stocks
    stocks = list(mongo.db.stocks.find({"symbol": {"$in": watchlist_symbols}}))
    for s in stocks:
        s['_id'] = str(s['_id'])
        
    return jsonify(stocks)

@watchlist_bp.route('/', methods=['POST'])
@token_required
def add_to_watchlist(current_user_id):
    data = request.get_json()
    symbol = data.get('symbol')
    if not symbol:
        return jsonify({'message': 'Symbol required'}), 400
    
    from bson.objectid import ObjectId
    uid = ObjectId(current_user_id)
    
    mongo.db.users.update_one(
        {"_id": uid},
        {"$addToSet": {"watchlist": symbol.upper()}}
    )
    
    return jsonify({'message': 'Added to watchlist'})

@watchlist_bp.route('/<symbol>', methods=['DELETE'])
@token_required
def remove_from_watchlist(current_user_id, symbol):
    from bson.objectid import ObjectId
    uid = ObjectId(current_user_id)
    
    mongo.db.users.update_one(
        {"_id": uid},
        {"$pull": {"watchlist": symbol.upper()}}
    )
    
    return jsonify({'message': 'Removed from watchlist'})

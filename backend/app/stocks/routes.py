from flask import Blueprint, jsonify, request
from ..db import mongo
from datetime import datetime, timedelta, timezone
import os
import pandas as pd
from .ml_logic import get_lstm_prediction
from .scraper import scrape_latest_prices
from .scraper import scrape_company_details
from .scraper import scrape_historical_data, scrape_current_price

stocks_bp = Blueprint('stocks', __name__)

@stocks_bp.route('/', methods=['GET'])
def get_stocks():
    query = request.args.get('search')
    
    filter_q = {}
    if query:
        filter_q["symbol"] = {"$regex": query.upper(), "$options": "i"}

    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    skip = (page - 1) * limit
    
    sort_by = request.args.get('sort', 'volume')
    sort_order = -1 if request.args.get('order', 'desc') == 'desc' else 1
    
    stocks_cursor = mongo.db.stocks.find(filter_q).sort(sort_by, sort_order).skip(skip).limit(limit)
    total = mongo.db.stocks.count_documents(filter_q)
    
    stocks = []
    for stock in stocks_cursor:
        stock['_id'] = str(stock['_id'])
        stocks.append(stock)
        
    return jsonify({
        "stocks": stocks,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    })



@stocks_bp.route('/<symbol>', methods=['GET'])
def get_stock(symbol):
    stock = mongo.db.stocks.find_one({"symbol": symbol.upper()})
    if not stock:
        return jsonify({"error": "Stock not found"}), 404
        
    stock['_id'] = str(stock['_id'])
    
    # helper for dates
    if 'updated_at' in stock and not isinstance(stock['updated_at'], str):
        if isinstance(stock['updated_at'], dict) and '$date' in stock['updated_at']:
             stock['updated_at'] = stock['updated_at']['$date']
        else:
             try:
                stock['updated_at'] = stock['updated_at'].isoformat()
             except:
                pass

   
    needs_update = False
    if 'market_cap' not in stock:
        if 'open' not in stock:
             needs_update = True
        else:
             needs_update = True 
    elif 'details_updated_at' in stock:
        last_update = stock['details_updated_at']
        if isinstance(last_update, str): # legacy check
             try:
                 last_update = datetime.fromisoformat(last_update)
                 if (datetime.utcnow() - last_update) > timedelta(hours=24):
                     needs_update = True
             except:
                 needs_update = True
        elif isinstance(last_update, datetime):
             if (datetime.utcnow() - last_update) > timedelta(hours=24):
                 needs_update = True
    else:
        needs_update = True
        
    if needs_update:
        details = scrape_company_details(symbol.upper())
        if details:
            details['details_updated_at'] = datetime.utcnow()
            mongo.db.stocks.update_one(
                {"symbol": symbol.upper()},
                {"$set": details}
            )
            stock.update(details) 
            
            if 'details_updated_at' in stock and not isinstance(stock['details_updated_at'], str):
                stock['details_updated_at'] = stock['details_updated_at'].isoformat()
            if 'last_updated' in stock and not isinstance(stock['last_updated'], str):
                 stock['last_updated'] = stock['last_updated'].isoformat()
            
    return jsonify(stock)


@stocks_bp.route('/<symbol>/history', methods=['GET'])
def get_stock_history(symbol):
    range_param = request.args.get('range', '1M')
    
    # Map range to days
    days_map = {
        '1D': 1, 
        '5D': 7,
        '1M': 30,
        '6M': 180,
        '1Y': 365,
        '2Y': 730
    }
    
    
        
    if range_param == '1D':
        days = 3650  
        history = scrape_historical_data(symbol.upper(), days=days)
        
        try:
            current_price = scrape_current_price(symbol.upper())
            if current_price and history:
               
                today_str = datetime.now().strftime('%Y-%m-%d') 
                history = [h for h in history if not h['date'].startswith(today_str)]
                
                history.append({
                    "date": today_str,
                    "open": current_price.get('open', current_price['ltp']),
                    "high": current_price.get('high', current_price['ltp']),
                    "low": current_price.get('low', current_price['ltp']),
                    "close": current_price['ltp'],
                    "volume": current_price.get('volume', 0)
                })
        except Exception as e:
            print(f"Error adding current price to history: {e}")
        
        return jsonify(history)

    days = days_map.get(range_param, 30)
    history = scrape_historical_data(symbol.upper(), days=days)
    
    try:
        current_price = scrape_current_price(symbol.upper())
        if current_price and history:
            
            today_str = datetime.now().strftime('%Y-%m-%d')
            
            history = [h for h in history if not h['date'].startswith(today_str)]
            
            # Add current live data
            history.append({
                "date": datetime.now().isoformat(),
                "open": current_price.get('open', current_price['ltp']),
                "high": current_price.get('high', current_price['ltp']),
                "low": current_price.get('low', current_price['ltp']),
                "close": current_price['ltp'],
                "volume": current_price.get('volume', 0)
            })
    except Exception as e:
        print(f"Error adding current price to history: {e}")
    
    return jsonify(history)
    
@stocks_bp.route('/<symbol>/prediction', methods=['GET'])
def get_prediction(symbol):
  
    try:
        csv_path = os.path.join(os.path.dirname(__file__), 'DSE_Data.csv')
        
        if not os.path.exists(csv_path):
             csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'DSE_Data.csv')

        excel_data = []
        if os.path.exists(csv_path):
            df_all = pd.read_csv(csv_path)
            df_symbol = df_all[df_all['Trading_Code'] == symbol.upper()].copy()
            df_symbol['Date'] = pd.to_datetime(df_symbol['Date'])
            
            cutoff_date = pd.Timestamp('2025-04-15')
            df_excel = df_symbol[df_symbol['Date'] <= cutoff_date].copy()
            
            for _, row in df_excel.iterrows():
                excel_data.append({
                    "date": row['Date'].strftime('%Y-%m-%d'),
                    "close": float(row['Close'])
                })

        api_data_raw = scrape_historical_data(symbol.upper(), days=730)
        api_data = []
        for d in api_data_raw:
            if pd.Timestamp(d['date']) > pd.Timestamp('2025-04-15'):
                api_data.append({
                    "date": d['date'],
                    "close": d['close']
                })

        merged_data = excel_data + api_data
        df_merged = pd.DataFrame(merged_data)
        if df_merged.empty:
             return jsonify({"error": "No data available for prediction"}), 400
             
        df_merged['date'] = pd.to_datetime(df_merged['date'])
        df_merged = df_merged.drop_duplicates(subset=['date'], keep='last')
        df_merged = df_merged.sort_values('date')
        
        two_years_ago = pd.Timestamp.now() - pd.DateOffset(years=2)
        df_final = df_merged[df_merged['date'] >= two_years_ago].copy()
        
        historical_list = df_final.to_dict('records')
        for item in historical_list:
            item['date'] = item['date'].strftime('%Y-%m-%d')

        actual_hist, prediction_series, trend = get_lstm_prediction(symbol.upper(), historical_list)
        
        if not actual_hist:
            return jsonify({"error": "Insufficient data for prediction"}), 400
            
        return jsonify({
            "symbol": symbol.upper(),
            "actual": actual_hist,
            "prediction": prediction_series,
            "trend": trend
        })
    except Exception as e:
        print(f"Prediction route error: {e}")
        return jsonify({"error": str(e)}), 500

@stocks_bp.route('/indices', methods=['GET'])
def get_indices():
    try:
        from .scraper import scrape_market_indices
        
        cache = mongo.db.indices_cache.find_one({"type": "market_indices"})
        
        if cache and 'updated_at' in cache:
            cache_time = cache['updated_at']
            if isinstance(cache_time, str):
                cache_time = datetime.fromisoformat(cache_time)
            
            if (datetime.utcnow() - cache_time).seconds < 120:  # 2 minutes
                return jsonify(cache['data'])
        
        indices = scrape_market_indices()
        
        if indices:
            mongo.db.indices_cache.update_one(
                {"type": "market_indices"},
                {"$set": {
                    "data": indices,
                    "updated_at": datetime.utcnow()
                }},
                upsert=True
            )
            
            return jsonify(indices)
        else:
            if cache and 'data' in cache:
                return jsonify(cache['data'])
            return jsonify([])
            
    except Exception as e:
        print(f"Error in get_indices: {e}")
        return jsonify([])



@stocks_bp.route('/latest-prices', methods=['GET'])
def get_latest_prices():
    try:
        cache = mongo.db.latest_prices_cache.find_one({"type": "all_prices"})
    
        if cache and 'updated_at' in cache:
            cache_time = cache['updated_at']
            if isinstance(cache_time, str):
                cache_time = datetime.fromisoformat(cache_time)
            
            if (datetime.utcnow() - cache_time).seconds < 300:  # 5 minutes
                return jsonify(cache['data'])
        
        latest_prices = scrape_latest_prices()
        
        if latest_prices:
            mongo.db.latest_prices_cache.update_one(
                {"type": "all_prices"},
                {"$set": {"data": latest_prices, "updated_at": datetime.utcnow()}},
                upsert=True
            )
            
            for stock in latest_prices:
                mongo.db.stocks.update_one(
                    {"symbol": stock['symbol']},
                    {"$set": stock},
                    upsert=True
                )
        
        return jsonify(latest_prices)
        
    except Exception as e:
        print(f"Error getting latest prices: {e}")
        return jsonify({"error": str(e)}), 500


@stocks_bp.route('/keep-alive', methods=['GET'])
def keep_alive():
    return jsonify({"message": "Server is alive"})
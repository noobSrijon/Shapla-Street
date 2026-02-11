import os
import sys
import requests
import pandas as pd
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "bdshare"

import certifi

def get_db():
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    return client[DB_NAME]

def scrape_stock_prices():
    url = "https://dsebd.org/latest_share_price_scroll_l.php"
    print(f"Fetching data from {url}...")
    
    try:
        dfs = pd.read_html(url, header=0)
        
        target_df = None
        for df in dfs:
            if 'Trading Code' in df.columns or 'Trns Code' in df.columns or 'Scrip' in df.columns:
                target_df = df
                break
        
        if target_df is None:
            for df in dfs:
                 if len(df) > 50:
                     target_df = df
                     break
        
        if target_df is None:
            print("Failed to find stock price table.")
            return

        print("Columns found in target table:", target_df.columns.tolist())
        
        print(f"Found table with {len(target_df)} rows.")
        
        stocks = []
        timestamp = datetime.now()
        
        df.columns = df.columns.astype(str).str.upper().str.strip().str.replace(r'[^\w\s]', '', regex=True).str.replace(r'\s+', '_', regex=True)
        
        print("Normalized columns:", df.columns.tolist())
        
        for index, row in df.iterrows():
            try:
                code = str(row.get('TRADING_CODE', row.iloc[1])).strip()
                
                if not code or code == 'nan' or code == 'TRADING CODE': continue
                
                def parse_float(val):
                    try:
                        val = str(val).replace(',', '')
                        if val == '--' or val == '-': return 0.0
                        return float(val)
                    except:
                        return 0.0

                ltp = parse_float(row.get('LTP', row.iloc[2]))
                high = parse_float(row.get('HIGH', row.iloc[3]))
                low = parse_float(row.get('LOW', row.iloc[4]))
                close = parse_float(row.get('CLOSEP', row.get('CLOSE', row.iloc[5])))
                ycp = parse_float(row.get('YCP', row.iloc[6]))
                change = parse_float(row.get('CHANGE', row.iloc[7]))
                volume = parse_float(row.get('VOLUME', row.iloc[10]))
                
                percent_change = 0.0
                if ycp > 0:
                    percent_change = round((change / ycp) * 100, 2)
                
                stock_doc = {
                    "symbol": code,
                    "ltp": ltp,
                    "high": high,
                    "low": low,
                    "close": close,
                    "ycp": ycp,
                    "change": change,
                    "percent_change": percent_change,
                    "volume": volume,
                    "updated_at": timestamp
                }
                stocks.append(stock_doc)
            except Exception as e:
                continue
                
        if not stocks:
            print("No stocks parsed.")
            return

        print(f"Parsed {len(stocks)} stocks.")
    
        
        db = get_db()
        
        operations = []
        from pymongo import UpdateOne
        for stock in stocks:
            operations.append(
                UpdateOne(
                    {"symbol": stock["symbol"]},
                    {"$set": stock},
                    upsert=True
                )
            )
            
        if operations:
            result = db.stocks.bulk_write(operations)
            print(f"Upserted stocks: {result.upserted_count}, Modified: {result.modified_count}")
            
     
    except Exception as e:
        print(f"Error scraping stocks: {e}")

def scrape_indices():
    url = "https://dsebd.org/index.php"
    print(f"Fetching indices from {url}...")
    try:
        response = requests.get(url)
        dfs = pd.read_html(response.content)
        
        indices_data = []
        timestamp = datetime.now()
        targets = ["DSEX", "DS30", "DSES"]
        
        for df in dfs:
            s_df = df.astype(str)
            if s_df.apply(lambda x: x.str.contains('DSEX', case=False).any()).any():
                 for i, row in df.iterrows():
                    row_str = str(row.values)
                    for idx_name in targets:
                        if idx_name in row_str:
                            values = []
                            for cell in row:
                                try:
                                    v = str(cell).replace(',', '').replace('%', '')
                                    if v.replace('.', '', 1).replace('-', '', 1).isdigit():
                                        values.append(float(v))
                                except: pass
                            
                            if values:
                                val = values[0]
                                change = values[1] if len(values) > 1 else 0
                                p_change = values[2] if len(values) > 2 else 0
                                
                                indices_data.append({
                                    "name": idx_name,
                                    "value": val,
                                    "change": change,
                                    "percent_change": p_change,
                                    "updated_at": timestamp
                                })
        
        if not indices_data:
            print("No indices found via table scraping. Using fallback data.")
            indices_data = [
                {"name": "DSEX", "value": 0000, "change": 00.0, "percent_change": 0.0, "updated_at": timestamp},
                {"name": "DS30", "value": 0000, "change": 00.0, "percent_change": 0.0, "updated_at": timestamp},
                {"name": "DSES", "value": 0000, "change": 00.0, "percent_change": 0.0, "updated_at": timestamp}
            ]

        print(f"Found {len(indices_data)} indices: {[x['name'] for x in indices_data]}")
        
        db = get_db()
        ops = []
        from pymongo import UpdateOne
        for idx in indices_data:
            ops.append(
                UpdateOne(
                    {"name": idx["name"]},
                    {"$set": idx},
                    upsert=True
                )
            )
        if ops:
            db.indices.bulk_write(ops)
            print("Indices updated.")

    except Exception as e:
        print(f"Error scraping indices: {e}")

if __name__ == "__main__":
    scrape_stock_prices()
    scrape_indices()

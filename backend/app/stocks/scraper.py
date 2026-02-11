import pandas as pd
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re

def scrape_current_price(symbol):
    url = f"https://dsebd.org/displayCompany.php?name={symbol}"
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        tables = soup.find_all("table", {"class": "table table-bordered background-white"})
        if not tables:
            return None
        
        current_data = {}
        first_table = tables[0]
        rows = first_table.find_all("tr")
        
        def parse_key_value(key, value):
            key = key.strip()
            value = value.strip()
            if "Last Trading Price" in key:
                current_data['ltp'] = float(value.replace(',', ''))
            elif "Opening Price" in key and "Adjusted" not in key:
                current_data['open'] = float(value.replace(',', ''))
            elif "Day's Range" in key:
                range_parts = value.split('-')
                if len(range_parts) == 2:
                    current_data['low'] = float(range_parts[0].strip().replace(',', ''))
                    current_data['high'] = float(range_parts[1].strip().replace(',', ''))
            elif "52 Weeks' Moving Range" in key or "52 Week" in key:
                range_parts = value.split('-')
                if len(range_parts) == 2:
                    try:
                        current_data['week_52_low'] = float(range_parts[0].strip().replace(',', ''))
                        current_data['week_52_high'] = float(range_parts[1].strip().replace(',', ''))
                    except: pass
            elif "Day's Volume" in key or "Day's Volume (Nos.)" in key:
                current_data['volume'] = float(value.replace(',', ''))
            elif "Day's Trade" in key:
                try: current_data['trade'] = int(value.replace(',', ''))
                except: pass
            elif "Day's Value" in key:
                try: current_data['value'] = float(value.replace(',', ''))
                except: pass
            elif "Market Capitalization" in key:
                try: current_data['market_cap'] = float(value.replace(',', ''))
                except: pass
            elif "Change*" == key:
                change_text = value.split()
                if len(change_text) >= 1:
                    try:
                        current_data['change'] = float(change_text[0].replace(',', ''))
                        if len(change_text) >= 2:
                            current_data['percent_change'] = float(change_text[1].replace('%', ''))
                    except: pass
            elif "Yesterday's Closing Price" in key:
                current_data['ycp'] = float(value.replace(',', ''))
        
        for row in rows:
            cells = row.find_all(["th", "td"])
            if len(cells) >= 4:
                parse_key_value(cells[0].get_text(), cells[1].get_text())
                parse_key_value(cells[2].get_text(), cells[3].get_text())
            elif len(cells) >= 2:
                parse_key_value(cells[0].get_text(), cells[1].get_text())
        
        if len(tables) > 1:
            try:
                basic_table = tables[1]
                basic_rows = basic_table.find_all("tr")
                for row in basic_rows:
                    cells = row.find_all("td")
                    if len(cells) >= 2:
                        key = cells[0].get_text().strip()
                        value = cells[1].get_text().strip()
                        if "Sector" in key: current_data['sector'] = value
                        elif "Face/Par Value" in key or "Face Value" in key:
                            try: current_data['face_value'] = float(value.replace(',', '').replace('Tk.', '').replace('৳', '').strip())
                            except: current_data['face_value'] = value
                        elif "Market Lot" in key:
                            try: current_data['market_lot'] = int(value.replace(',', ''))
                            except: current_data['market_lot'] = value
                    if len(cells) >= 4:
                        key2 = cells[2].get_text().strip()
                        value2 = cells[3].get_text().strip()
                        if "Sector" in key2: current_data['sector'] = value2
                        elif "Category" in key2: current_data['category'] = value2
            except: pass
        
        if len(tables) > 2:
            try:
                dividend_table = tables[2]
                dividend_rows = dividend_table.find_all("tr")
                for row in dividend_rows:
                    cells = row.find_all("td")
                    if len(cells) >= 2:
                        key = cells[0].get_text().strip()
                        value = cells[1].get_text().strip()
                        if "Cash" in key and "Dividend" in key:
                            try:
                                if '%' in value:
                                    dividend_pct = value.split('%')[0].strip()
                                    current_data['dividend_yield'] = float(dividend_pct)
                            except: pass
            except: pass
        
        if len(tables) > 6:
            try:
                fin_table = tables[6]
                fin_rows = fin_table.find_all("tr")
                if len(fin_rows) > 1:
                    last_row = fin_rows[-1]
                    cells = last_row.find_all("td")
                    if len(cells) > 1:
                        for cell in cells[1:6]:
                            try:
                                value = cell.get_text().strip()
                                val_float = float(value.replace(',', ''))
                                if 'eps_basic' not in current_data and val_float != 0:
                                    current_data['eps_basic'] = val_float
                                    break
                            except: continue
                        for cell in cells[6:10]:
                            try:
                                value = cell.get_text().strip()
                                val_float = float(value.replace(',', ''))
                                if 'nav_original' not in current_data and val_float != 0:
                                    current_data['nav_original'] = val_float
                                    break
                            except: continue
            except: pass
        
        if len(tables) > 7:
            try:
                pe_table = tables[7]
                pe_rows = pe_table.find_all("tr")
                if len(pe_rows) > 1:
                    last_row = pe_rows[-1]
                    cells = last_row.find_all("td")
                    if len(cells) > 1:
                        for cell in cells[1:4]:
                            try:
                                value = cell.get_text().strip()
                                val_float = float(value.replace(',', ''))
                                if 'pe_basic' not in current_data and val_float != 0:
                                    current_data['pe_basic'] = val_float
                                    break
                            except: continue
            except: pass
        
        return current_data if current_data else None
    except Exception as e:
        print(f"Error scraping current price for {symbol}: {e}")
        return None

def scrape_latest_prices():
    url = 'https://www.dsebd.org/latest_share_price_scroll_by_value.php'
    try:
        response = requests.get(url, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find("table", {"class": "table table-bordered background-white shares-table fixedHeader"})
        if not table: return []
        
        stocks = []
        rows = table.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 11: continue
            try:
                stock_data = {
                    'symbol': cells[1].get_text().strip(),
                    'ltp': float(cells[2].get_text().strip().replace(',', '')),
                    'high': float(cells[3].get_text().strip().replace(',', '')),
                    'low': float(cells[4].get_text().strip().replace(',', '')),
                    'closep': float(cells[5].get_text().strip().replace(',', '')) if cells[5].get_text().strip() != '0' else None,
                    'ycp': float(cells[6].get_text().strip().replace(',', '')),
                    'change': float(cells[7].get_text().strip().replace(',', '')),
                    'trade': int(cells[8].get_text().strip().replace(',', '')),
                    'value': float(cells[9].get_text().strip().replace(',', '')),
                    'volume': int(cells[10].get_text().strip().replace(',', '')),
                    'updated_at': datetime.utcnow()
                }
                if stock_data['ycp'] > 0:
                    stock_data['percent_change'] = round((stock_data['change'] / stock_data['ycp']) * 100, 2)
                else: stock_data['percent_change'] = 0
                
                stock_data['open'] = stock_data['closep'] if stock_data['closep'] else stock_data['ycp']
                stocks.append(stock_data)
            except: continue
        return stocks
    except Exception as e:
        print(f"Error scraping latest prices: {e}")
        return []

def scrape_company_details(symbol):
    url = f"https://dsebd.org/displayCompany.php?name={symbol}"
    try:
        details = scrape_current_price(symbol) or {}
        details["last_updated"] = datetime.utcnow()
        dfs = pd.read_html(url)
        
        def find_value(df, key_col_idx, val_col_idx, key_name):
            try:
                mask = df[key_col_idx].astype(str).str.contains(key_name, case=False, na=False)
                if mask.any():
                    val = df.loc[mask, val_col_idx].values[0]
                    return str(val).strip()
            except: pass
            return None

        search_keys = {
            "authorized_capital": ["Authorized Capital"],
            "paid_up_capital": ["Paid-up Capital"],
            "face_value": ["Face Value"],
            "market_lot": ["Market Lot"],
            "outstanding_shares": ["Total Number of Securities", "Outstanding Securities"],
            "market_category": ["Market Category"],
            "listing_year": ["Listing Year"],
            "market_cap": ["Market Cap", "Market Capitalization"],
            "open": ["Opening Price", "Open Price"],
            "day_range": ["Day's Range", "Day Range"]
        }
        
        for df in dfs:
            if df.shape[1] >= 2:
                for key, patterns in search_keys.items():
                    if key in details: continue
                    for pattern in patterns:
                        val = find_value(df, 0, 1, pattern)
                        if val:
                            details[key] = val
                            break
                try:
                    cols = [str(c).upper().strip() for c in df.columns]
                    open_idx = next((i for i, c in enumerate(cols) if "OPENP" in c or "OPEN PRICE" in c), -1)
                    if open_idx != -1 and not df.empty:
                        details['open'] = str(df.iloc[0, open_idx]).replace(',', '')
                except: pass
                if df.astype(str)[0].str.contains("Share Holding Percentage", case=False, na=False).any():
                    val = find_value(df, 0, 1, "Share Holding Percentage")
                    if val: details["share_holding"] = val
                if df.astype(str)[0].str.contains("Current P/E", case=False, na=False).any():
                    pe_basic = find_value(df, 0, 6, "Basic EPS")
                    if pe_basic: details["pe_basic"] = pe_basic
        return details
    except Exception as e:
        print(f"Error scraping details: {e}")
        return details if details and len(details) > 1 else None

def scrape_historical_data(symbol, days=365):
    if days > 730: days = 730
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    ed_str = end_date.strftime("%Y-%m-%d")
    sd_str = start_date.strftime("%Y-%m-%d")
    url = f"https://www.dsebd.org/day_end_archive.php?startDate={sd_str}&endDate={ed_str}&inst={symbol}&archive=data"
    
    try:
        dfs = pd.read_html(url)
        history = []
        for df in dfs:
            df.columns = [str(c).upper().strip() for c in df.columns]
            cols = df.columns.tolist()
            if "DATE" in cols and "HIGH" in cols and "LOW" in cols and "VOLUME" in cols:
                open_col = next((c for c in cols if "OPEN" in c), None)
                close_col = next((c for c in cols if "CLOSE" in c), None)
                if open_col and close_col:
                    for _, row in df.iterrows():
                        try:
                            def parse_float(val): return float(str(val).replace(',', ''))
                            history.append({
                                "date": str(row['DATE']),
                                "open": parse_float(row[open_col]),
                                "high": parse_float(row['HIGH']),
                                "low": parse_float(row['LOW']),
                                "close": parse_float(row[close_col]),
                                "volume": parse_float(row['VOLUME'])
                            })
                        except: continue
                    break
        history.sort(key=lambda x: x['date'])
        return history
    except Exception as e:
        print(f"Error scraping history: {e}")
        return []

def scrape_market_indices():
    url = "https://dsebd.org/"
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        left_col = soup.find('div', class_='LeftColHome')
        if not left_col: return []
        row_section = left_col.find('div', class_='_row')
        if not row_section: return []
        
        indices = []
        midrows = row_section.find_all('div', class_='midrow')
        for row in midrows:
            cols = row.find_all('div', class_=re.compile(r'm_col-\d'))
            if len(cols) >= 4:
                name_col = cols[0].get_text(strip=True)
                if 'Index' in name_col:
                    if 'DSEX' in name_col: index_name = 'DSEX'
                    elif 'DSES' in name_col: index_name = 'DSES'
                    elif 'DS30' in name_col: index_name = 'DS30'
                    else: continue
                    try:
                        value = float(cols[1].get_text(strip=True).replace(',', ''))
                        change = float(cols[2].get_text(strip=True).replace(',', ''))
                        percent_change = float(cols[3].get_text(strip=True).replace('%', '').replace(',', ''))
                        indices.append({
                            'name': index_name,
                            'value': value,
                            'change': change,
                            'percent_change': percent_change,
                            'updated_at': datetime.now().isoformat()
                        })
                    except: continue
        return indices
    except Exception as e:
        print(f"Error scraping market indices: {e}")
        return []

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import os
from datetime import datetime, timedelta

def get_lstm_prediction(symbol, historical_data_list, prediction_days=7):
    """
    Trains an LSTM model on provided historical data and predicts future prices.
    Returns: (actual_history, prediction_data, trend)
    """
    try:
        # 1. Load data from provided list
        if not historical_data_list or len(historical_data_list) < 100:
            print(f"Insufficient data for {symbol}: {len(historical_data_list) if historical_data_list else 0} rows")
            return None, None, None
            
        df = pd.DataFrame(historical_data_list)
        df['date'] = pd.to_datetime(df['date'])
        df = df.drop_duplicates(subset=['date'], keep='last')
        df = df.sort_values('date')
        
        data = df['close'].values.reshape(-1, 1)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(data)
        
        lookback = 60
        X, y = [], []
        for i in range(lookback, len(scaled_data)):
            X.append(scaled_data[i-lookback:i, 0])
            y.append(scaled_data[i, 0])
            
        X, y = np.array(X), np.array(y)
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
        
        model = Sequential([
            LSTM(units=50, return_sequences=True, input_shape=(X.shape[1], 1)),
            Dropout(0.2),
            LSTM(units=50, return_sequences=False),
            Dropout(0.2),
            Dense(units=1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X, y, epochs=10, batch_size=32, verbose=0)
        predicted_scaled = model.predict(X, verbose=0)
        predicted_values = scaler.inverse_transform(predicted_scaled).flatten()
        
        prediction_series = []
        
        for i in range(lookback):
            curr_date = df['date'].iloc[i]
            prediction_series.append({
                "date": curr_date.strftime('%Y-%m-%d'),
                "value": float(df['close'].iloc[i])
            })
            
        predicted_scaled = model.predict(X, verbose=0)
        predicted_values = scaler.inverse_transform(predicted_scaled).flatten()
        
        for i in range(len(predicted_values)):
            curr_date = df['date'].iloc[i + lookback]
            prediction_series.append({
                "date": curr_date.strftime('%Y-%m-%d'),
                "value": float(predicted_values[i])
            })
            
        last_60_days = scaled_data[-lookback:]
        current_batch = last_60_days.reshape((1, lookback, 1))
        
        future_predictions = []
        for _ in range(prediction_days):
            current_pred = model.predict(current_batch, verbose=0)[0]
            future_predictions.append(current_pred)
            current_batch = np.append(current_batch[:, 1:, :], [[current_pred]], axis=1)
            
        rescaled_preds = scaler.inverse_transform(future_predictions).flatten()
        
        last_date = df['date'].iloc[-1]
        for i, val in enumerate(rescaled_preds):
            next_date = last_date + timedelta(days=i+1)
            prediction_series.append({
                "date": next_date.strftime('%Y-%m-%d'),
                "value": float(val)
            })
            
        last_actual = float(df['close'].iloc[-1])
        first_pred = float(rescaled_preds[0])
        trend = 'upward' if first_pred > last_actual else 'downward'
            
        actual_history = df[['date', 'close']].copy()
        actual_history['date'] = actual_history['date'].dt.strftime('%Y-%m-%d')
        actual_history_list = actual_history.to_dict('records')
        
        return actual_history_list, prediction_series, trend

    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None, None

if __name__ == "__main__":
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else 'GP'
    csv = "DSE_Data.csv"
    hist, pred, trend = get_lstm_prediction(symbol, csv)
    if hist:
        print(f"Trend for {symbol}: {trend}")
        print(f"Last 3 historical fit:")
        for p in [p for p in pred if p['date'] <= hist[-1]['date']][-3:]:
            print(f"{p['date']}: {p['value']:.2f}")
        print(f"Future predictions:")
        for p in [p for p in pred if p['date'] > hist[-1]['date']]:
            print(f"{p['date']}: {p['value']:.2f}")
    else:
        print("Prediction failed.")

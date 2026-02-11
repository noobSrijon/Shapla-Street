# Shapla Street - Dhaka Stock Exchange Analysis and Prediction Platform

Shapla Street is a comprehensive stock market application that scrapes live data from the Dhaka Stock Exchange (DSE). The platform integrates real-time market data with machine learning to provide price predictions and advanced visualization tools for investors.


<p align="center">
  <img src="https://i.imgur.com/p7gF9vG.png" width="49%" />
  <img src="https://i.imgur.com/ACMp0Vd.png" width="49%" />
  <img src="https://i.imgur.com/vJE8pSz.png" width="49%" />
</p>

## Features

- **Market Dashboard**: Real-time monitoring through live scraping of Dhaka Stock Exchange market indices and current stock prices.
- **Detailed Stock Analysis**: High-performance data visualization including candlestick, area, and line charts.
- **Market Price Prediction**: Future price forecasting using Long Short-Term Memory (LSTM) neural networks.
- **Unified Historical Timeline**: Continuous 2-year historical data merged from static archives and live market scraping.
- **User Watchlist**: Secure user accounts with personalized tools for monitoring favorite stocks.
- **Professional Terminal Interface**: State-of-the-art financial dashboard optimized for data density and clarity.

## Live Data Integration

Shapla Street utilizes a custom-built scraping engine to fetch real-time information from the Dhaka Stock Exchange (DSE). This includes:
- **Real-time Price Scraping**: Fetches the latest traded prices (LTP) and daily changes directly from the market.
- **Market Monitoring**: Captures live fluctuations in primary market indices.
- **Automated Data Merging**: Seamlessly combines scraped live data with historical archives to provide a continuous analysis timeline.

## Technology Stack

- **Frontend**: React, Vite, Lightweight Charts, Tailwind CSS, Axios.
- **Backend**: Python, Flask, MongoDB (PyMongo), TensorFlow, Scikit-learn, Pandas, BeautifulSoup4.

## Project Structure

- `backend/`: Flask API and machine learning logic.
- `frontend/`: React application and data visualization components.
- `backend/app/stocks/scraper.py`: Real-time data extraction engine for DSE.
- `backend/app/stocks/ml_logic.py`: LSTM model implementation for price forecasting.

## Setup Instructions

### Backend
1. Navigate to the `backend/` directory.
2. Install the required Python packages: `pip install -r requirements.txt`.
3. Configure the `.env` file with your database credentials.
4. Start the server: `python run.py`.
   - The API will be available at `http://127.0.0.1:5000`.

### Frontend
1. Navigate to the `frontend/` directory.
2. Install the dependencies: `npm install`.
3. Start the development server: `npm run dev`.
   - The application will be accessible at `http://localhost:5173`.

## Credits and Data Sources

- **Market Data**: Real-time stock prices and market indices are sourced from the [Dhaka Stock Exchange (DSE)](https://dsebd.org/).
- **Historical Dataset**: Long-term historical data is provided by the [Harvard Dataverse](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/XIFYT1).

This project is for educational and analytical purposes.

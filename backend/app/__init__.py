from flask import Flask
from flask_cors import CORS
from .db import init_db
from .auth.routes import auth_bp
from .stocks.routes import stocks_bp
from .watchlist.routes import watchlist_bp
import os

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    
    # Configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        MONGO_URI=os.environ.get('MONGO_URI'),
        MONGO_DBNAME='bdshare'
    )

    if test_config:
        app.config.update(test_config)

    # Initialize extensions
    CORS(app)
    init_db(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(stocks_bp, url_prefix='/api/stocks')
    app.register_blueprint(watchlist_bp, url_prefix='/api/watchlist')

    @app.route('/health')
    def health():
        return {"status": "ok"}

    return app

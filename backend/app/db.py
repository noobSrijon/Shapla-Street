from flask_pymongo import PyMongo
import os
import certifi

mongo = PyMongo()

def init_db(app):
    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    app.config["MONGO_DBNAME"] = 'bdshare'
    mongo.init_app(app, tlsCAFile=certifi.where())

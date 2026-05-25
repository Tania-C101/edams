import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load .env from project root
load_dotenv()  # Finds .env in current or parent directories

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)

# Access default database
db = client["edams"]

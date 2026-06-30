import os
import sys
from pymongo import MongoClient

# Use the hardcoded URI from migrate.cjs for the connection
uri = 'mongodb+srv://chetanupare1234:kavNQ8eFhCM3SOw0@cluster0.cfqelhy.mongodb.net/slcg_rms?retryWrites=true&w=majority&appName=Cluster0'

print("Connecting to MongoDB...")
try:
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    db = client['slcg_rms']

    # Collections related to customer data and repair jobs
    collections_to_clear = [
        'customers',
        'job_cards',
        'repairs',
        'billing'
    ]

    print("Clearing customer and repair data...")
    for coll in collections_to_clear:
        if coll in db.list_collection_names():
            result = db[coll].delete_many({})
            print(f"Deleted {result.deleted_count} documents from {coll}")
        else:
            print(f"Collection {coll} does not exist. Skipping.")

    # Reset sequence counters for IDs (jobId, customerId, invoiceNo)
    print("Resetting sequence counters...")
    if 'sequences' in db.list_collection_names():
        db['sequences'].update_many({}, {"$set": {"seq": 0}})
        print("Sequences reset to 0.")

    print("Cleanup complete. The system is ready for client handover.")
except Exception as e:
    print(f"An error occurred: {e}")

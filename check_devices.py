import os
from pymongo import MongoClient
import json

uri = 'mongodb+srv://chetanupare1234:kavNQ8eFhCM3SOw0@cluster0.cfqelhy.mongodb.net/slcg_rms?retryWrites=true&w=majority&appName=Cluster0'

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    db = client['slcg_rms']

    brands = list(db['brands'].find({}, {'_id': 0}))
    models = list(db['device_models'].find({}, {'_id': 0}))

    device_types = set([b.get('deviceType') for b in brands])

    summary = {
        'total_brands': len(brands),
        'total_models': len(models),
        'device_types': list(device_types),
        'brands_sample': brands[:10],
        'models_sample': models[:10]
    }

    print(json.dumps(summary, indent=2))

except Exception as e:
    print(f"Error: {e}")

import os, sys
from pymongo import MongoClient

uri = os.environ.get('MONGO_URI')
if not uri:
    print('MONGO_URI environment variable is required')
    sys.exit(1)

client = MongoClient(uri, serverSelectionTimeoutMS=10000)
db_names = client.list_database_names()

if 'slcg' not in db_names:
    print('Nothing to migrate — slcg database does not exist')
    sys.exit(0)

if 'slcg_rms' not in db_names:
    print('Target database slcg_rms does not exist')
    sys.exit(1)

source = client['slcg']
target = client['slcg_rms']

source_cols = source.list_collection_names()
target_cols = target.list_collection_names()

for name in source_cols:
    if name in target_cols:
        src_count = source[name].count_documents({})
        tgt_count = target[name].count_documents({})
        print(f'[{name}] skipped — already exists in target ({src_count} src / {tgt_count} tgt docs)')
        continue
    docs = list(source[name].find())
    if not docs:
        print(f'[{name}] skipped — empty')
        continue
    target[name].insert_many(docs)
    print(f'[{name}] copied {len(docs)} docs')

print('\nDropping slcg database...')
client.drop_database('slcg')
print('slcg database dropped')

print('\nMigration complete. Only slcg_rms remains.')

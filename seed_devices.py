import os
from pymongo import MongoClient

uri = 'mongodb+srv://chetanupare1234:kavNQ8eFhCM3SOw0@cluster0.cfqelhy.mongodb.net/slcg_rms?retryWrites=true&w=majority&appName=Cluster0'

client = MongoClient(uri, serverSelectionTimeoutMS=10000)
db = client['slcg_rms']

new_brands = [
    {"name": "Apple", "deviceType": "Tablet"},
    {"name": "Samsung", "deviceType": "Tablet"},
    {"name": "Lenovo", "deviceType": "Tablet"},
    {"name": "TP-Link", "deviceType": "Router"},
    {"name": "D-Link", "deviceType": "Router"},
    {"name": "Netgear", "deviceType": "Router"},
    {"name": "Asus", "deviceType": "Router"},
    {"name": "Western Digital", "deviceType": "Storage"},
    {"name": "Seagate", "deviceType": "Storage"},
    {"name": "SanDisk", "deviceType": "Storage"},
    {"name": "Samsung", "deviceType": "Storage"},
    {"name": "Corsair", "deviceType": "RAM"},
    {"name": "Kingston", "deviceType": "RAM"},
    {"name": "Crucial", "deviceType": "RAM"},
    {"name": "G.Skill", "deviceType": "RAM"}
]

new_models = [
    {"brand": "Apple", "deviceType": "Tablet", "modelName": "iPad Air"},
    {"brand": "Apple", "deviceType": "Tablet", "modelName": "iPad Pro 11-inch"},
    {"brand": "Apple", "deviceType": "Tablet", "modelName": "iPad Pro 12.9-inch"},
    {"brand": "Samsung", "deviceType": "Tablet", "modelName": "Galaxy Tab S8"},
    {"brand": "Samsung", "deviceType": "Tablet", "modelName": "Galaxy Tab S9"},
    {"brand": "Samsung", "deviceType": "Tablet", "modelName": "Galaxy Tab A8"},
    {"brand": "Lenovo", "deviceType": "Tablet", "modelName": "Tab M10"},
    {"brand": "Lenovo", "deviceType": "Tablet", "modelName": "Tab P11"},
    
    {"brand": "TP-Link", "deviceType": "Router", "modelName": "Archer C7"},
    {"brand": "TP-Link", "deviceType": "Router", "modelName": "Archer AX50"},
    {"brand": "TP-Link", "deviceType": "Router", "modelName": "Deco M5"},
    {"brand": "D-Link", "deviceType": "Router", "modelName": "DIR-822"},
    {"brand": "D-Link", "deviceType": "Router", "modelName": "DIR-X1560"},
    {"brand": "Netgear", "deviceType": "Router", "modelName": "Nighthawk R7000"},
    {"brand": "Netgear", "deviceType": "Router", "modelName": "Nighthawk AX4"},
    {"brand": "Asus", "deviceType": "Router", "modelName": "RT-AX86U"},
    {"brand": "Asus", "deviceType": "Router", "modelName": "RT-AC68U"},
    
    {"brand": "Western Digital", "deviceType": "Storage", "modelName": "WD Blue 1TB HDD"},
    {"brand": "Western Digital", "deviceType": "Storage", "modelName": "WD Black SN850 1TB NVMe"},
    {"brand": "Seagate", "deviceType": "Storage", "modelName": "Barracuda 2TB HDD"},
    {"brand": "Seagate", "deviceType": "Storage", "modelName": "FireCuda 530 1TB NVMe"},
    {"brand": "Samsung", "deviceType": "Storage", "modelName": "980 PRO 1TB NVMe"},
    {"brand": "Samsung", "deviceType": "Storage", "modelName": "970 EVO Plus 500GB NVMe"},
    {"brand": "Samsung", "deviceType": "Storage", "modelName": "T7 Portable SSD 1TB"},
    {"brand": "SanDisk", "deviceType": "Storage", "modelName": "Extreme Portable SSD 1TB"},
    
    {"brand": "Corsair", "deviceType": "RAM", "modelName": "Vengeance LPX 16GB (2x8GB) DDR4"},
    {"brand": "Corsair", "deviceType": "RAM", "modelName": "Vengeance RGB Pro 32GB DDR4"},
    {"brand": "Corsair", "deviceType": "RAM", "modelName": "Dominator Platinum 32GB DDR5"},
    {"brand": "Kingston", "deviceType": "RAM", "modelName": "FURY Beast 16GB DDR4"},
    {"brand": "Kingston", "deviceType": "RAM", "modelName": "FURY Impact 16GB DDR4 SODIMM"},
    {"brand": "Crucial", "deviceType": "RAM", "modelName": "Ballistix 16GB DDR4"},
    {"brand": "Crucial", "deviceType": "RAM", "modelName": "Crucial 16GB DDR5"},
    {"brand": "G.Skill", "deviceType": "RAM", "modelName": "Trident Z RGB 16GB DDR4"},
    {"brand": "G.Skill", "deviceType": "RAM", "modelName": "Ripjaws V 16GB DDR4"}
]

try:
    print("Inserting new brands...")
    # Using ignore errors for duplicates if any
    for brand in new_brands:
        if db['brands'].count_documents({"name": brand["name"], "deviceType": brand["deviceType"]}) == 0:
            db['brands'].insert_one(brand)
            print(f"Added brand: {brand['name']} ({brand['deviceType']})")

    print("\nInserting new models...")
    for model in new_models:
        if db['device_models'].count_documents({"brand": model["brand"], "deviceType": model["deviceType"], "modelName": model["modelName"]}) == 0:
            db['device_models'].insert_one(model)
            print(f"Added model: {model['brand']} {model['modelName']} ({model['deviceType']})")
    
    print("\nData expansion complete.")
except Exception as e:
    print(f"Error: {e}")

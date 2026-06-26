import bcrypt from 'bcryptjs';

export async function seedAdmin(db) {
  const users = db.collection('users');

  const adminHashed = await bcrypt.hash('admin@123', 10);
  const existing = await users.findOne({ username: 'admin' });
  if (existing) {
    await users.updateOne({ username: 'admin' }, { $set: { password: adminHashed } });
  } else {
    await users.insertOne({
      username: 'admin', password: adminHashed, role: 'Admin', branch: 'Wani', createdAt: new Date(),
    });
  }

  const techHashed = await bcrypt.hash('tech123', 10);
  const tech = await users.findOne({ username: 'tech' });
  if (!tech) {
    await users.insertOne({
      username: 'tech', password: techHashed, role: 'Technician', branch: 'Wani', createdAt: new Date(),
    });
  }
}

export async function seedIndexes(db) {
  await db.collection('job_cards').createIndex({ jobId: 1 }, { unique: true });
  await db.collection('job_cards').createIndex({ customerId: 1 });
  await db.collection('job_cards').createIndex({ createdAt: -1 });
  await db.collection('billing').createIndex({ invoiceNo: 1 }, { unique: true });
  await db.collection('billing').createIndex({ jobId: 1 });
  await db.collection('customers').createIndex({ customerId: 1 });
  await db.collection('customers').createIndex({ mobile: 1 });
  await db.collection('customers').createIndex({ name: 1 });
  try { await db.collection('customers').createIndex({ name: 'text', mobile: 'text' }); } catch {}
  await db.collection('repairs').createIndex({ jobId: 1 });
  await db.collection('repairs').createIndex({ updatedAt: -1 });
}

const BRANDS = [
  { name: 'HP', deviceType: 'Laptop' }, { name: 'Dell', deviceType: 'Laptop' },
  { name: 'Lenovo', deviceType: 'Laptop' }, { name: 'Apple', deviceType: 'Laptop' },
  { name: 'Acer', deviceType: 'Laptop' }, { name: 'Asus', deviceType: 'Laptop' },
  { name: 'Samsung', deviceType: 'Laptop' }, { name: 'Microsoft', deviceType: 'Laptop' },
  { name: 'HP', deviceType: 'Desktop' }, { name: 'Dell', deviceType: 'Desktop' },
  { name: 'Lenovo', deviceType: 'Desktop' }, { name: 'Apple', deviceType: 'Desktop' },
  { name: 'Canon', deviceType: 'Printer' }, { name: 'Epson', deviceType: 'Printer' },
  { name: 'Brother', deviceType: 'Printer' }, { name: 'HP', deviceType: 'Printer' },
  { name: 'Canon', deviceType: 'Scanner' }, { name: 'Epson', deviceType: 'Scanner' },
  { name: 'Samsung', deviceType: 'Monitor' }, { name: 'LG', deviceType: 'Monitor' },
  { name: 'Dell', deviceType: 'Monitor' }, { name: 'APC', deviceType: 'UPS' },
  { name: 'Seagate', deviceType: 'Storage' }, { name: 'Western Digital', deviceType: 'Storage' },
  { name: 'Kingston', deviceType: 'RAM' }, { name: 'Corsair', deviceType: 'RAM' },
  { name: 'TP-Link', deviceType: 'Router' }, { name: 'D-Link', deviceType: 'Router' },
  { name: 'Samsung', deviceType: 'Tablet' }, { name: 'Apple', deviceType: 'Tablet' },
  { name: 'Lenovo', deviceType: 'Tablet' }, { name: 'iBall', deviceType: 'Tablet' },
];

const MODELS = [
  // Laptops
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Pavilion 15' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Pavilion 14' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Laptop 15s' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Laptop 14s' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'ProBook 450 G8' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'ProBook 440 G8' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'EliteBook 840' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'EliteBook 830' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Spectre x360' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Envy 13' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Envy 15' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Omen 16' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Victus 15' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Stream 14' },
  { brand: 'HP', deviceType: 'Laptop', modelName: '250 G8' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Inspiron 3515' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Inspiron 3505' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Inspiron 5410' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Inspiron 7415' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Latitude 5420' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Latitude 3520' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Latitude 3420' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'XPS 13' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'XPS 15' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Vostro 3405' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Vostro 3500' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Alienware m15' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'G15 Gaming' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad E14' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad E15' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad X1 Carbon' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad T14' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad T15' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'IdeaPad 3' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'IdeaPad 5' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'IdeaPad Slim 5' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Legion 5' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Legion 7' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Yoga 7' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Yoga Slim 7' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Flex 5' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Air M1' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Air M2' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Air M3' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 13 M1' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 14 M2' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 16 M2' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 14 M3' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 16 M3' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Aspire 5' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Aspire 7' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Aspire 3' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Swift 3' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Swift 5' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Nitro 5' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Predator Helios 300' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'Vivobook 15' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'Vivobook 14' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'Vivobook S 15' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ZenBook 14' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ZenBook Pro' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ROG Zephyrus G14' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ROG Strix G15' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'TUF Gaming F15' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ExpertBook B1' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book 2' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book 3' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book Pro' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book Go' },
  { brand: 'Microsoft', deviceType: 'Laptop', modelName: 'Surface Laptop 4' },
  { brand: 'Microsoft', deviceType: 'Laptop', modelName: 'Surface Laptop 5' },
  { brand: 'Microsoft', deviceType: 'Laptop', modelName: 'Surface Laptop Studio' },
  { brand: 'Microsoft', deviceType: 'Laptop', modelName: 'Surface Pro 8' },
  { brand: 'Microsoft', deviceType: 'Laptop', modelName: 'Surface Pro 9' },
  // Desktops
  { brand: 'HP', deviceType: 'Desktop', modelName: 'Pavilion Desktop TP01' },
  { brand: 'HP', deviceType: 'Desktop', modelName: 'EliteDesk 800' },
  { brand: 'HP', deviceType: 'Desktop', modelName: 'ProDesk 400' },
  { brand: 'HP', deviceType: 'Desktop', modelName: 'All-in-One 24' },
  { brand: 'Dell', deviceType: 'Desktop', modelName: 'OptiPlex 3080' },
  { brand: 'Dell', deviceType: 'Desktop', modelName: 'OptiPlex 7080' },
  { brand: 'Dell', deviceType: 'Desktop', modelName: 'Inspiron 3891' },
  { brand: 'Dell', deviceType: 'Desktop', modelName: 'Precision 3630' },
  { brand: 'Dell', deviceType: 'Desktop', modelName: 'XPS Desktop' },
  { brand: 'Lenovo', deviceType: 'Desktop', modelName: 'IdeaCentre AIO 3' },
  { brand: 'Lenovo', deviceType: 'Desktop', modelName: 'IdeaCentre 5' },
  { brand: 'Lenovo', deviceType: 'Desktop', modelName: 'ThinkCentre M70q' },
  { brand: 'Apple', deviceType: 'Desktop', modelName: 'Mac Mini M1' },
  { brand: 'Apple', deviceType: 'Desktop', modelName: 'Mac Mini M2' },
  { brand: 'Apple', deviceType: 'Desktop', modelName: 'iMac 24 M1' },
  { brand: 'Apple', deviceType: 'Desktop', modelName: 'Mac Pro' },
  // Printers
  { brand: 'Canon', deviceType: 'Printer', modelName: 'PIXMA G3270' },
  { brand: 'Canon', deviceType: 'Printer', modelName: 'PIXMA G4270' },
  { brand: 'Canon', deviceType: 'Printer', modelName: 'imageCLASS MF244dw' },
  { brand: 'Canon', deviceType: 'Printer', modelName: 'imageCLASS LBP226dw' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'L3150' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'L3210' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'L3250' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'L5190' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'WorkForce WF-2830' },
  { brand: 'Brother', deviceType: 'Printer', modelName: 'DCP-T520W' },
  { brand: 'Brother', deviceType: 'Printer', modelName: 'DCP-T720DW' },
  { brand: 'Brother', deviceType: 'Printer', modelName: 'HL-L2370DW' },
  { brand: 'Brother', deviceType: 'Printer', modelName: 'MFC-J1205W' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'LaserJet M1005' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'LaserJet Pro M404' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'DeskJet 2331' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'DeskJet 4178' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'Smart Tank 580' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'Smart Tank 730' },
  // Monitors
  { brand: 'Samsung', deviceType: 'Monitor', modelName: '24F350' },
  { brand: 'Samsung', deviceType: 'Monitor', modelName: '27T350' },
  { brand: 'Samsung', deviceType: 'Monitor', modelName: 'Odyssey G7' },
  { brand: 'Samsung', deviceType: 'Monitor', modelName: 'Odyssey G5' },
  { brand: 'LG', deviceType: 'Monitor', modelName: '24MK600M' },
  { brand: 'LG', deviceType: 'Monitor', modelName: '27UL500' },
  { brand: 'LG', deviceType: 'Monitor', modelName: '32UN550' },
  { brand: 'LG', deviceType: 'Monitor', modelName: 'UltraGear 27GP850' },
  { brand: 'Dell', deviceType: 'Monitor', modelName: 'SE2422H' },
  { brand: 'Dell', deviceType: 'Monitor', modelName: 'S2721HS' },
  { brand: 'Dell', deviceType: 'Monitor', modelName: 'U2723QE' },
  { brand: 'Dell', deviceType: 'Monitor', modelName: 'P2422H' },
  // UPS
  { brand: 'APC', deviceType: 'UPS', modelName: 'Back-UPS BX1100C' },
  { brand: 'APC', deviceType: 'UPS', modelName: 'Back-UPS BX600C' },
  { brand: 'APC', deviceType: 'UPS', modelName: 'Smart-UPS 1500' },
  // Scanners
  { brand: 'Canon', deviceType: 'Scanner', modelName: 'CanoScan LiDE 400' },
  { brand: 'Canon', deviceType: 'Scanner', modelName: 'imageFORMULA R40' },
  { brand: 'Epson', deviceType: 'Scanner', modelName: 'Perfection V39' },
  { brand: 'Epson', deviceType: 'Scanner', modelName: 'WorkForce ES-50' },
  // Tablets
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab A8' },
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab A9+' },
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab S8' },
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab S9' },
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab S6 Lite' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad 9th Gen' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad 10th Gen' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad Air M1' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad Air M2' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad Pro 11 M2' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad Pro 12.9 M2' },
  { brand: 'Lenovo', deviceType: 'Tablet', modelName: 'Tab M8' },
  { brand: 'Lenovo', deviceType: 'Tablet', modelName: 'Tab M10' },
  { brand: 'Lenovo', deviceType: 'Tablet', modelName: 'Tab P11' },
  { brand: 'Lenovo', deviceType: 'Tablet', modelName: 'Tab P12' },
  // Storage
  { brand: 'Seagate', deviceType: 'Storage', modelName: 'Barracuda 1TB' },
  { brand: 'Seagate', deviceType: 'Storage', modelName: 'Barracuda 2TB' },
  { brand: 'Seagate', deviceType: 'Storage', modelName: 'One Touch 1TB' },
  { brand: 'Seagate', deviceType: 'Storage', modelName: 'Expansion 2TB' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'Blue 1TB' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'Blue 2TB' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'My Passport 1TB' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'My Passport 2TB' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'Elements 1TB' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'Elements 2TB' },
  // RAM
  { brand: 'Kingston', deviceType: 'RAM', modelName: 'FURY Beast 8GB' },
  { brand: 'Kingston', deviceType: 'RAM', modelName: 'FURY Beast 16GB' },
  { brand: 'Kingston', deviceType: 'RAM', modelName: 'FURY Renegade 8GB' },
  { brand: 'Kingston', deviceType: 'RAM', modelName: 'ValueRAM 4GB' },
  { brand: 'Kingston', deviceType: 'RAM', modelName: 'ValueRAM 8GB' },
  { brand: 'Corsair', deviceType: 'RAM', modelName: 'Vengeance LPX 8GB' },
  { brand: 'Corsair', deviceType: 'RAM', modelName: 'Vengeance LPX 16GB' },
  { brand: 'Corsair', deviceType: 'RAM', modelName: 'Dominator 16GB' },
  // Routers
  { brand: 'TP-Link', deviceType: 'Router', modelName: 'Archer A6' },
  { brand: 'TP-Link', deviceType: 'Router', modelName: 'Archer C6' },
  { brand: 'TP-Link', deviceType: 'Router', modelName: 'Archer AX10' },
  { brand: 'TP-Link', deviceType: 'Router', modelName: 'Archer AX50' },
  { brand: 'TP-Link', deviceType: 'Router', modelName: 'Deco M4' },
  { brand: 'D-Link', deviceType: 'Router', modelName: 'DIR-825' },
  { brand: 'D-Link', deviceType: 'Router', modelName: 'DIR-842' },
  { brand: 'D-Link', deviceType: 'Router', modelName: 'COVR-1102' },
];

export async function seedDeviceData(db) {
  const brandsCol = db.collection('brands');
  const brandsExisting = await brandsCol.countDocuments();
  if (brandsExisting === 0) {
    await brandsCol.insertMany(BRANDS);
  }

  const modelsCol = db.collection('device_models');
  const modelsExisting = await modelsCol.countDocuments();
  if (modelsExisting === 0) {
    await modelsCol.insertMany(MODELS);
  }
}

const SEED_PARTS = [
  { name: 'Laptop LCD Screen 15.6" HD', sku: 'LCD-156-HD', category: 'Screens', unit: 'pcs', stock: 8, threshold: 3, price: 2500 },
  { name: 'Laptop LCD Screen 14" HD', sku: 'LCD-14-HD', category: 'Screens', unit: 'pcs', stock: 5, threshold: 3, price: 2200 },
  { name: 'Laptop LCD Screen 13.3" HD', sku: 'LCD-133-HD', category: 'Screens', unit: 'pcs', stock: 3, threshold: 3, price: 2800 },
  { name: 'Dell Inspiron Battery 40Wh', sku: 'BAT-DELL-40', category: 'Batteries', unit: 'pcs', stock: 6, threshold: 3, price: 1800 },
  { name: 'HP Pavilion Battery 41Wh', sku: 'BAT-HP-41', category: 'Batteries', unit: 'pcs', stock: 4, threshold: 3, price: 1900 },
  { name: 'Lenovo ThinkPad Battery 45Wh', sku: 'BAT-LEN-45', category: 'Batteries', unit: 'pcs', stock: 5, threshold: 3, price: 2000 },
  { name: 'Samsung 8GB DDR4 Laptop RAM', sku: 'RAM-DDR4-8GB', category: 'RAM', unit: 'pcs', stock: 12, threshold: 5, price: 1200 },
  { name: 'Samsung 16GB DDR4 Laptop RAM', sku: 'RAM-DDR4-16GB', category: 'RAM', unit: 'pcs', stock: 8, threshold: 5, price: 2400 },
  { name: 'Crucial 8GB DDR5 Laptop RAM', sku: 'RAM-DDR5-8GB', category: 'RAM', unit: 'pcs', stock: 4, threshold: 3, price: 1600 },
  { name: 'WD Green 240GB SSD', sku: 'SSD-WD-240', category: 'Storage', unit: 'pcs', stock: 10, threshold: 5, price: 1500 },
  { name: 'WD Green 480GB SSD', sku: 'SSD-WD-480', category: 'Storage', unit: 'pcs', stock: 6, threshold: 5, price: 2800 },
  { name: 'Samsung 870 EVO 500GB SSD', sku: 'SSD-SAM-500', category: 'Storage', unit: 'pcs', stock: 2, threshold: 3, price: 3500 },
  { name: 'HP Laptop Charger 19V 3.42A', sku: 'CHR-HP-65W', category: 'Chargers', unit: 'pcs', stock: 7, threshold: 3, price: 800 },
  { name: 'Dell Laptop Charger 19.5V 3.34A', sku: 'CHR-DELL-65W', category: 'Chargers', unit: 'pcs', stock: 6, threshold: 3, price: 850 },
  { name: 'Lenovo Laptop Charger 20V 3.25A', sku: 'CHR-LEN-65W', category: 'Chargers', unit: 'pcs', stock: 2, threshold: 3, price: 900 },
  { name: 'Laptop Cooling Fan (Universal)', sku: 'FAN-LAP-UNV', category: 'Cooling', unit: 'pcs', stock: 10, threshold: 5, price: 350 },
  { name: 'Dell Laptop Keyboard (English)', sku: 'KBD-DELL-EN', category: 'Keyboards', unit: 'pcs', stock: 4, threshold: 3, price: 600 },
  { name: 'HP Laptop Keyboard (English)', sku: 'KBD-HP-EN', category: 'Keyboards', unit: 'pcs', stock: 3, threshold: 3, price: 650 },
  { name: 'Lenovo Laptop Keyboard (English)', sku: 'KBD-LEN-EN', category: 'Keyboards', unit: 'pcs', stock: 2, threshold: 3, price: 700 },
  { name: 'TP-Link WiFi Card N150', sku: 'WIFI-TPL-N150', category: 'Networking', unit: 'pcs', stock: 8, threshold: 3, price: 400 },
  { name: 'Intel WiFi 6 AX200', sku: 'WIFI-INT-AX200', category: 'Networking', unit: 'pcs', stock: 5, threshold: 3, price: 1200 },
  { name: 'Thermal Paste (10g Tube)', sku: 'THRM-PSTE-10G', category: 'Consumables', unit: 'pcs', stock: 3, threshold: 5, price: 150 },
  { name: 'USB-C to HDMI Adapter', sku: 'USBC-HDMI', category: 'Adapters', unit: 'pcs', stock: 6, threshold: 3, price: 350 },
  { name: 'SATA III Cable (50cm)', sku: 'CBL-SATA-50', category: 'Cables', unit: 'pcs', stock: 15, threshold: 10, price: 50 },
];

const SEED_SUPPLIERS = [
  { name: 'TechParts India', contact: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@techparts.in', address: '45, Lamington Road, Mumbai', gst: '27AABCU1234D1Z1' },
  { name: 'CompuSpares Nagpur', contact: 'Amit Sharma', phone: '9765432109', email: 'amit@compuspares.in', address: '12, Sitabuldi, Nagpur', gst: '27AACC1234D1Z1' },
  { name: 'ElectroWorld', contact: 'Sneha Patel', phone: '9654321098', email: 'sneha@electroworld.in', address: '8, M.G. Road, Pune', gst: '27AAAE5678D1Z1' },
];

export async function seedInventory(db) {
  const partsCol = db.collection('inventory_parts');
  if (await partsCol.countDocuments() === 0) {
    await partsCol.insertMany(SEED_PARTS.map((p) => ({ ...p, createdAt: new Date(), updatedAt: new Date() })));
  }
  const suppCol = db.collection('suppliers');
  if (await suppCol.countDocuments() === 0) {
    await suppCol.insertMany(SEED_SUPPLIERS);
  }
}

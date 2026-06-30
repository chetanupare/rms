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
  { name: 'Lenovo', deviceType: 'Laptop' }, { name: 'Asus', deviceType: 'Laptop' },
  { name: 'Acer', deviceType: 'Laptop' }, { name: 'Apple', deviceType: 'Laptop' },
  { name: 'MSI', deviceType: 'Laptop' }, { name: 'Samsung', deviceType: 'Laptop' },
  { name: 'HP', deviceType: 'Computer' }, { name: 'Dell', deviceType: 'Computer' },
  { name: 'Lenovo', deviceType: 'Computer' }, { name: 'Apple', deviceType: 'Computer' },
  { name: 'HP', deviceType: 'Printer' }, { name: 'Epson', deviceType: 'Printer' },
  { name: 'Canon', deviceType: 'Printer' }, { name: 'Brother', deviceType: 'Printer' },
  { name: 'Epson', deviceType: 'Scanner' }, { name: 'Canon', deviceType: 'Scanner' },
  { name: 'Apple', deviceType: 'Tablet' }, { name: 'Samsung', deviceType: 'Tablet' },
  { name: 'Lenovo', deviceType: 'Tablet' }, { name: 'Xiaomi', deviceType: 'Tablet' },
  { name: 'OnePlus', deviceType: 'Tablet' },
  { name: 'LG', deviceType: 'Monitor' }, { name: 'Samsung', deviceType: 'Monitor' },
  { name: 'Dell', deviceType: 'Monitor' },
  { name: 'APC', deviceType: 'UPS' },
  { name: 'TP-Link', deviceType: 'Router' }, { name: 'D-Link', deviceType: 'Router' },
  { name: 'Netgear', deviceType: 'Router' }, { name: 'Mercusys', deviceType: 'Router' },
  { name: 'Tenda', deviceType: 'Router' },
  { name: 'Crucial', deviceType: 'Storage' }, { name: 'Samsung', deviceType: 'Storage' },
  { name: 'Western Digital', deviceType: 'Storage' }, { name: 'Seagate', deviceType: 'Storage' },
  { name: 'Kingston', deviceType: 'Storage' },
  { name: 'Crucial', deviceType: 'RAM' }, { name: 'Corsair', deviceType: 'RAM' },
  { name: 'G.Skill', deviceType: 'RAM' }, { name: 'Kingston', deviceType: 'RAM' },
];

const MODELS = [
  // Laptops - HP
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Pavilion' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Envy' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Spectre x360' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Victus' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Omen' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'EliteBook' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'ProBook' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Chromebook' },
  { brand: 'HP', deviceType: 'Laptop', modelName: 'Essential 15' },
  // Laptops - Dell
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Inspiron 14' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Inspiron 15' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'XPS 13' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'XPS 15' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'XPS 16' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Vostro 3000' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Vostro 5000' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Latitude 5000' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Latitude 7000' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Alienware m16' },
  { brand: 'Dell', deviceType: 'Laptop', modelName: 'Alienware x16' },
  // Laptops - Lenovo
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'IdeaPad Slim 1' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'IdeaPad Slim 3' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'IdeaPad Slim 5' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'IdeaPad Flex 5' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad E14' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad L14' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad T14' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'ThinkPad X1 Carbon' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Yoga Slim 7' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Yoga Book 9i' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Legion Pro 5' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'Legion Pro 7' },
  { brand: 'Lenovo', deviceType: 'Laptop', modelName: 'LOQ 15' },
  // Laptops - Asus
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'VivoBook 14' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'VivoBook 15' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'VivoBook Pro' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ZenBook 13' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ZenBook 14 OLED' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ZenBook Pro' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ROG Strix G16' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'ROG Zephyrus G14' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'TUF Gaming A15' },
  { brand: 'Asus', deviceType: 'Laptop', modelName: 'TUF Gaming F15' },
  // Laptops - Acer
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Aspire 3' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Aspire 5' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Aspire 7' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Swift 3' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Swift Go' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Extensa 15' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Nitro 5' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Nitro V' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Predator Helios 16' },
  { brand: 'Acer', deviceType: 'Laptop', modelName: 'Predator Helios Neo' },
  // Laptops - Apple
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Air M1' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Air M2' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Air M3' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Air M4' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 14" M3' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 14" M4' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 16" M3' },
  { brand: 'Apple', deviceType: 'Laptop', modelName: 'MacBook Pro 16" M4' },
  // Laptops - MSI
  { brand: 'MSI', deviceType: 'Laptop', modelName: 'Thin GF63' },
  { brand: 'MSI', deviceType: 'Laptop', modelName: 'Cyborg 15' },
  { brand: 'MSI', deviceType: 'Laptop', modelName: 'Katana 15' },
  { brand: 'MSI', deviceType: 'Laptop', modelName: 'Sword 16' },
  { brand: 'MSI', deviceType: 'Laptop', modelName: 'Pulse 17' },
  { brand: 'MSI', deviceType: 'Laptop', modelName: 'Modern 14' },
  { brand: 'MSI', deviceType: 'Laptop', modelName: 'Modern 15' },
  // Laptops - Samsung
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book3' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book4' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book4 Pro' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book4 Ultra' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book 360' },
  { brand: 'Samsung', deviceType: 'Laptop', modelName: 'Galaxy Book Go' },
  // Computers - HP
  { brand: 'HP', deviceType: 'Computer', modelName: 'Pavilion Desktop' },
  { brand: 'HP', deviceType: 'Computer', modelName: 'Envy All-in-One' },
  { brand: 'HP', deviceType: 'Computer', modelName: 'Omen Desktop' },
  { brand: 'HP', deviceType: 'Computer', modelName: 'ProDesk Slim' },
  // Computers - Dell
  { brand: 'Dell', deviceType: 'Computer', modelName: 'Inspiron Desktop' },
  { brand: 'Dell', deviceType: 'Computer', modelName: 'OptiPlex SFF' },
  { brand: 'Dell', deviceType: 'Computer', modelName: 'Inspiron All-in-One' },
  { brand: 'Dell', deviceType: 'Computer', modelName: 'Alienware Aurora' },
  // Computers - Lenovo
  { brand: 'Lenovo', deviceType: 'Computer', modelName: 'IdeaCentre AIO 3' },
  { brand: 'Lenovo', deviceType: 'Computer', modelName: 'IdeaCentre AIO 5' },
  { brand: 'Lenovo', deviceType: 'Computer', modelName: 'ThinkCentre Neo' },
  { brand: 'Lenovo', deviceType: 'Computer', modelName: 'Legion Tower 5' },
  // Computers - Apple
  { brand: 'Apple', deviceType: 'Computer', modelName: 'iMac 24"' },
  { brand: 'Apple', deviceType: 'Computer', modelName: 'Mac mini M2' },
  { brand: 'Apple', deviceType: 'Computer', modelName: 'Mac mini M4' },
  { brand: 'Apple', deviceType: 'Computer', modelName: 'Mac Studio' },
  // Printers - HP
  { brand: 'HP', deviceType: 'Printer', modelName: 'Smart Tank 520' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'Smart Tank 580' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'Smart Tank 750' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'LaserJet Pro M126nw' },
  { brand: 'HP', deviceType: 'Printer', modelName: 'DeskJet 2331' },
  // Printers - Epson
  { brand: 'Epson', deviceType: 'Printer', modelName: 'EcoTank L3210' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'EcoTank L3250' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'EcoTank L4260' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'EcoTank L6270' },
  { brand: 'Epson', deviceType: 'Printer', modelName: 'Monochrome M100' },
  // Printers - Canon
  { brand: 'Canon', deviceType: 'Printer', modelName: 'PIXMA G2012' },
  { brand: 'Canon', deviceType: 'Printer', modelName: 'PIXMA G3012' },
  { brand: 'Canon', deviceType: 'Printer', modelName: 'PIXMA E4570' },
  { brand: 'Canon', deviceType: 'Printer', modelName: 'imageCLASS LBP6030w' },
  { brand: 'Canon', deviceType: 'Printer', modelName: 'imageCLASS MF3010' },
  // Printers - Brother
  { brand: 'Brother', deviceType: 'Printer', modelName: 'DCP-T426W' },
  { brand: 'Brother', deviceType: 'Printer', modelName: 'DCP-T820DW' },
  { brand: 'Brother', deviceType: 'Printer', modelName: 'HL-L2321D' },
  { brand: 'Brother', deviceType: 'Printer', modelName: 'MFC-L2701DW' },
  // Scanners
  { brand: 'Epson', deviceType: 'Scanner', modelName: 'Perfection V39 II' },
  { brand: 'Epson', deviceType: 'Scanner', modelName: 'WorkForce DS-410' },
  { brand: 'Canon', deviceType: 'Scanner', modelName: 'CanoScan LiDE 300' },
  { brand: 'Canon', deviceType: 'Scanner', modelName: 'CanoScan LiDE 400' },
  // Tablets - Apple
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad 10th Gen' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad Air M2' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad Pro M4' },
  { brand: 'Apple', deviceType: 'Tablet', modelName: 'iPad mini' },
  // Tablets - Samsung
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab A9' },
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab A9+' },
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab S9 FE' },
  { brand: 'Samsung', deviceType: 'Tablet', modelName: 'Galaxy Tab S9 Ultra' },
  // Tablets - Lenovo
  { brand: 'Lenovo', deviceType: 'Tablet', modelName: 'Tab M10 Gen 3' },
  { brand: 'Lenovo', deviceType: 'Tablet', modelName: 'Tab P12' },
  { brand: 'Lenovo', deviceType: 'Tablet', modelName: 'Yoga Tab 11' },
  // Tablets - Xiaomi/OnePlus
  { brand: 'Xiaomi', deviceType: 'Tablet', modelName: 'Pad 6' },
  { brand: 'Xiaomi', deviceType: 'Tablet', modelName: 'Redmi Pad SE' },
  { brand: 'OnePlus', deviceType: 'Tablet', modelName: 'Pad Go' },
  { brand: 'OnePlus', deviceType: 'Tablet', modelName: 'Pad 2' },
  // Monitors
  { brand: 'LG', deviceType: 'Monitor', modelName: 'UltraGear 24GN650' },
  { brand: 'LG', deviceType: 'Monitor', modelName: 'UltraGear 27GN800' },
  { brand: 'LG', deviceType: 'Monitor', modelName: 'UltraWide 29WP500' },
  { brand: 'LG', deviceType: 'Monitor', modelName: 'Business Monitor 22MP410' },
  { brand: 'Samsung', deviceType: 'Monitor', modelName: 'Odyssey G3' },
  { brand: 'Samsung', deviceType: 'Monitor', modelName: 'Odyssey G5' },
  { brand: 'Samsung', deviceType: 'Monitor', modelName: 'Smart Monitor M5' },
  { brand: 'Samsung', deviceType: 'Monitor', modelName: 'Essential Monitor S3' },
  { brand: 'Dell', deviceType: 'Monitor', modelName: 'S2421H Home Monitor' },
  { brand: 'Dell', deviceType: 'Monitor', modelName: 'S2721HNM' },
  { brand: 'Dell', deviceType: 'Monitor', modelName: 'UltraSharp U2422H' },
  { brand: 'Dell', deviceType: 'Monitor', modelName: 'SE2222H' },
  // UPS
  { brand: 'APC', deviceType: 'UPS', modelName: 'Back-UPS BX600C-IN' },
  { brand: 'APC', deviceType: 'UPS', modelName: 'Back-UPS BX1100C-IN' },
  { brand: 'APC', deviceType: 'UPS', modelName: 'Back-UPS Pro BR1500G-IN' },
  // Routers
  { brand: 'TP-Link', deviceType: 'Router', modelName: 'Archer C6' },
  { brand: 'TP-Link', deviceType: 'Router', modelName: 'Archer AX23 Wi-Fi 6' },
  { brand: 'TP-Link', deviceType: 'Router', modelName: 'TL-WR841N' },
  { brand: 'D-Link', deviceType: 'Router', modelName: 'DIR-615' },
  { brand: 'D-Link', deviceType: 'Router', modelName: 'DIR-X1560 Wi-Fi 6' },
  { brand: 'Netgear', deviceType: 'Router', modelName: 'Nighthawk R7000' },
  { brand: 'Mercusys', deviceType: 'Router', modelName: 'AC1200' },
  { brand: 'Tenda', deviceType: 'Router', modelName: 'N301' },
  // Storage
  { brand: 'Crucial', deviceType: 'Storage', modelName: 'BX500 2.5" SATA SSD' },
  { brand: 'Crucial', deviceType: 'Storage', modelName: 'P3 M.2 NVMe SSD' },
  { brand: 'Samsung', deviceType: 'Storage', modelName: '970 EVO Plus M.2' },
  { brand: 'Samsung', deviceType: 'Storage', modelName: '980 Pro NVMe' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'WD Blue 1TB HDD' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'WD Green SATA SSD' },
  { brand: 'Western Digital', deviceType: 'Storage', modelName: 'WD Blue SN580 NVMe' },
  { brand: 'Seagate', deviceType: 'Storage', modelName: 'Barracuda 1TB HDD' },
  { brand: 'Seagate', deviceType: 'Storage', modelName: 'Expansion Portable External' },
  { brand: 'Kingston', deviceType: 'Storage', modelName: 'A400 SATA SSD' },
  // RAM
  { brand: 'Crucial', deviceType: 'RAM', modelName: '8GB DDR4 3200MHz Laptop' },
  { brand: 'Crucial', deviceType: 'RAM', modelName: '16GB DDR5 4800MHz Desktop' },
  { brand: 'Corsair', deviceType: 'RAM', modelName: 'Vengeance LPX 8GB DDR4' },
  { brand: 'Corsair', deviceType: 'RAM', modelName: 'Vengeance RGB 16GB DDR5' },
  { brand: 'G.Skill', deviceType: 'RAM', modelName: 'Ripjaws V 16GB DDR4' },
  { brand: 'G.Skill', deviceType: 'RAM', modelName: 'Flare X5 DDR5' },
  { brand: 'Kingston', deviceType: 'RAM', modelName: 'FURY Beast 8GB DDR4' },
  { brand: 'Kingston', deviceType: 'RAM', modelName: 'ValueRAM 4GB DDR4' },
];

export async function seedDeviceData(db) {
  const brandsCol = db.collection('brands');
  const modelsCol = db.collection('device_models');
  
  // Always re-seed with latest data
  await brandsCol.deleteMany({});
  await modelsCol.deleteMany({});
  await brandsCol.insertMany(BRANDS);
  await modelsCol.insertMany(MODELS);
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

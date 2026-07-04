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
  await db.collection('billing').createIndex({ jobId: 1 }, { unique: true });
  await db.collection('customers').createIndex({ customerId: 1 });
  await db.collection('customers').createIndex({ mobile: 1 });
  await db.collection('customers').createIndex({ name: 1 });
  try { await db.collection('customers').createIndex({ name: 'text', mobile: 'text' }); } catch {}
  await db.collection('repairs').createIndex({ jobId: 1 });
  await db.collection('repairs').createIndex({ updatedAt: -1 });
}

export async function seedInventory(db) {}

export async function seedServiceCenters(db) {
  const collection = db.collection('service_centers');
  const count = await collection.countDocuments();
  if (count > 0) return;

  const centers = [
    // ===== HP =====
    { brand: 'HP', deviceType: 'Laptop', location: 'Regenersis India Pvt Ltd, Plot No 18, MIDC Industrial Area, Chandrapur', city: 'Chandrapur', contact: '07172-255888' },
    { brand: 'HP', deviceType: 'Laptop', location: 'Accel Frontline Ltd, 1st Floor, Above SBI, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2244567' },
    { brand: 'HP', deviceType: 'Laptop', location: 'F1 Info Solutions, Wardhaman Nagar, Nagpur', city: 'Nagpur', contact: '0712-2761234' },
    { brand: 'HP', deviceType: 'Printer', location: 'Dev Vani Building, Nagpur Road, Chandrapur', city: 'Chandrapur', contact: '07770012802' },
    { brand: 'HP', deviceType: 'Printer', location: 'Regenersis India, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2525678' },
    { brand: 'HP', deviceType: 'Printer', location: 'HP Authorized Service Center, Dharampeth, Nagpur', city: 'Nagpur', contact: '0712-2551234' },
    { brand: 'HP', deviceType: 'Desktop', location: 'Accel Frontline Ltd, 1st Floor, Above SBI, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2244567' },
    { brand: 'HP', deviceType: 'Monitor', location: 'Regenersis India Pvt Ltd, MIDC, Nagpur', city: 'Nagpur', contact: '0712-2558880' },

    // ===== DELL =====
    { brand: 'Dell', deviceType: 'Laptop', location: 'Amar Jyoti Palace, Dhantoli, Nagpur', city: 'Nagpur', contact: '7770012802' },
    { brand: 'Dell', deviceType: 'Laptop', location: 'Unicorn Infosolutions Pvt Ltd, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2521234' },
    { brand: 'Dell', deviceType: 'Laptop', location: 'Dell Exclusive Store, Dharampeth, Nagpur', city: 'Nagpur', contact: '0712-2555678' },
    { brand: 'Dell', deviceType: 'Desktop', location: 'Unicorn Infosolutions Pvt Ltd, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2521234' },
    { brand: 'Dell', deviceType: 'Monitor', location: 'Amar Jyoti Palace, Dhantoli, Nagpur', city: 'Nagpur', contact: '7770012802' },
    { brand: 'Dell', deviceType: 'Server', location: 'Dell Technologies, MIHAN, Nagpur', city: 'Nagpur', contact: '1800-425-4026' },

    // ===== LENOVO =====
    { brand: 'Lenovo', deviceType: 'Laptop', location: 'Dev Vani Building, Bapat Nagar, Chandrapur', city: 'Chandrapur', contact: '9730225525' },
    { brand: 'Lenovo', deviceType: 'Laptop', location: 'Accel Frontline Ltd, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2244890' },
    { brand: 'Lenovo', deviceType: 'Laptop', location: 'F1 Info Solutions, Sadar, Nagpur', city: 'Nagpur', contact: '0712-2534567' },
    { brand: 'Lenovo', deviceType: 'Desktop', location: 'Accel Frontline Ltd, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2244890' },
    { brand: 'Lenovo', deviceType: 'Tablet', location: 'Lenovo Authorized Service, Sitabuldi, Nagpur', city: 'Nagpur', contact: '1800-419-7777' },

    // ===== ASUS =====
    { brand: 'Asus', deviceType: 'Laptop', location: 'Dev Vani Building, Bapat Nagar, Chandrapur', city: 'Chandrapur', contact: '9730225525' },
    { brand: 'Asus', deviceType: 'Laptop', location: 'Rashi Peripherals Pvt Ltd, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2245678' },
    { brand: 'Asus', deviceType: 'Laptop', location: 'Kaizen Infoserve, Dharampeth, Nagpur', city: 'Nagpur', contact: '0712-2558901' },
    { brand: 'Asus', deviceType: 'Router', location: 'Dev Vani Building, Bapat Nagar, Chandrapur', city: 'Chandrapur', contact: '9730225525' },
    { brand: 'Asus', deviceType: 'Desktop', location: 'Rashi Peripherals Pvt Ltd, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2245678' },

    // ===== ACER =====
    { brand: 'Acer', deviceType: 'Laptop', location: 'Dev Vani Building, Bapat Nagar, Chandrapur', city: 'Chandrapur', contact: '9511692583' },
    { brand: 'Acer', deviceType: 'Laptop', location: 'Acer Authorized Service Center, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2526789' },
    { brand: 'Acer', deviceType: 'Laptop', location: 'F1 Info Solutions, Wardhaman Nagar, Nagpur', city: 'Nagpur', contact: '0712-2765432' },
    { brand: 'Acer', deviceType: 'Desktop', location: 'Acer Authorized Service Center, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2526789' },
    { brand: 'Acer', deviceType: 'Monitor', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2245678' },

    // ===== APPLE =====
    { brand: 'Apple', deviceType: 'Laptop', location: 'Dev Vani Building, Bapat Nagar, Chandrapur', city: 'Chandrapur', contact: '9545666166' },
    { brand: 'Apple', deviceType: 'Laptop', location: 'iCare - Apple Authorized, Dharampeth, Nagpur', city: 'Nagpur', contact: '0712-2553456' },
    { brand: 'Apple', deviceType: 'Laptop', location: 'iPlanet - Apple Authorized, Empress Mall, Nagpur', city: 'Nagpur', contact: '0712-2767890' },
    { brand: 'Apple', deviceType: 'Phone', location: 'iCare - Apple Authorized, Dharampeth, Nagpur', city: 'Nagpur', contact: '0712-2553456' },
    { brand: 'Apple', deviceType: 'Tablet', location: 'iPlanet - Apple Authorized, Empress Mall, Nagpur', city: 'Nagpur', contact: '0712-2767890' },

    // ===== SAMSUNG =====
    { brand: 'Samsung', deviceType: 'Laptop', location: 'Dev Vani Building, Bapat Nagar, Chandrapur', city: 'Chandrapur', contact: '9730446500' },
    { brand: 'Samsung', deviceType: 'Laptop', location: 'Samsung Service Center, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2523456' },
    { brand: 'Samsung', deviceType: 'Phone', location: 'Samsung SmartCafe, Dharampeth, Nagpur', city: 'Nagpur', contact: '1800-407-267-848' },
    { brand: 'Samsung', deviceType: 'Storage', location: 'Dev Vani Building, Bapat Nagar, Chandrapur', city: 'Chandrapur', contact: '9730446500' },
    { brand: 'Samsung', deviceType: 'Monitor', location: 'Samsung Service Center, Sadar, Nagpur', city: 'Nagpur', contact: '0712-2534890' },

    // ===== MICROSOFT =====
    { brand: 'Microsoft', deviceType: 'Laptop', location: 'Kaizen Infoserve, Dharampeth, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },
    { brand: 'Microsoft', deviceType: 'Laptop', location: 'Microsoft Authorized Service, MIHAN, Nagpur', city: 'Nagpur', contact: '1800-102-1100' },
    { brand: 'Microsoft', deviceType: 'Tablet', location: 'Kaizen Infoserve, Dharampeth, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },

    // ===== BROTHER =====
    { brand: 'Brother', deviceType: 'Printer', location: 'TVSE Authorized Services, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },
    { brand: 'Brother', deviceType: 'Printer', location: 'Brother Authorized Service, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2521890' },
    { brand: 'Brother', deviceType: 'Printer', location: 'Printwell Solutions, Chandrapur', city: 'Chandrapur', contact: '9422889900' },

    // ===== CANON =====
    { brand: 'Canon', deviceType: 'Printer', location: 'Computer Service Point, Gandhi Chowk, Chandrapur', city: 'Chandrapur', contact: '8879131510' },
    { brand: 'Canon', deviceType: 'Printer', location: 'Canon Image Square, Dharampeth, Nagpur', city: 'Nagpur', contact: '0712-2556789' },
    { brand: 'Canon', deviceType: 'Printer', location: 'Canon Service Center, Sadar, Nagpur', city: 'Nagpur', contact: '1800-180-3366' },
    { brand: 'Canon', deviceType: 'Scanner', location: 'Computer Service Point, Gandhi Chowk, Chandrapur', city: 'Chandrapur', contact: '8879131510' },
    { brand: 'Canon', deviceType: 'Scanner', location: 'Canon Image Square, Dharampeth, Nagpur', city: 'Nagpur', contact: '0712-2556789' },
    { brand: 'Canon', deviceType: 'Camera', location: 'Canon Image Square, Dharampeth, Nagpur', city: 'Nagpur', contact: '0712-2556789' },

    // ===== EPSON =====
    { brand: 'Epson', deviceType: 'Printer', location: 'Meet Infotech, Ekori Ward, Chandrapur', city: 'Chandrapur', contact: '9513445237' },
    { brand: 'Epson', deviceType: 'Printer', location: 'Epson Authorized Service, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2524567' },
    { brand: 'Epson', deviceType: 'Printer', location: 'Printwell Solutions, Dhantoli, Nagpur', city: 'Nagpur', contact: '1800-123-001-600' },
    { brand: 'Epson', deviceType: 'Scanner', location: 'Meet Infotech, Ekori Ward, Chandrapur', city: 'Chandrapur', contact: '9513445237' },
    { brand: 'Epson', deviceType: 'Projector', location: 'Epson Authorized Service, MIHAN, Nagpur', city: 'Nagpur', contact: '0712-2559012' },

    // ===== D-LINK =====
    { brand: 'D-Link', deviceType: 'Router', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },
    { brand: 'D-Link', deviceType: 'Router', location: 'D-Link Authorized, Sitabuldi, Nagpur', city: 'Nagpur', contact: '1800-233-0000' },
    { brand: 'D-Link', deviceType: 'Switch', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },
    { brand: 'D-Link', deviceType: 'Camera', location: 'D-Link Authorized, Sadar, Nagpur', city: 'Nagpur', contact: '0712-2531234' },

    // ===== TP-LINK =====
    { brand: 'TP-Link', deviceType: 'Router', location: 'National Technical Support', city: 'Pan India', contact: '1800 209 4168' },
    { brand: 'TP-Link', deviceType: 'Router', location: 'TP-Link Service Center, Sitabuldi, Nagpur', city: 'Nagpur', contact: '0712-2528901' },
    { brand: 'TP-Link', deviceType: 'Switch', location: 'National Technical Support', city: 'Pan India', contact: '1800 209 4168' },
    { brand: 'TP-Link', deviceType: 'Range Extender', location: 'TP-Link Service Center, Nagpur', city: 'Nagpur', contact: '1800 209 4168' },

    // ===== NETGEAR =====
    { brand: 'Netgear', deviceType: 'Router', location: 'National Technical Support', city: 'Pan India', contact: '1800-419-4543' },
    { brand: 'Netgear', deviceType: 'Router', location: 'Netgear Authorized, Nagpur', city: 'Nagpur', contact: '1800-419-4543' },
    { brand: 'Netgear', deviceType: 'Switch', location: 'National Technical Support', city: 'Pan India', contact: '1800-419-4543' },

    // ===== WESTERN DIGITAL =====
    { brand: 'Western Digital', deviceType: 'Storage', location: 'SUN Computers, Manewada Road, Nagpur', city: 'Nagpur', contact: '1800 569 3982' },
    { brand: 'Western Digital', deviceType: 'Storage', location: 'WD Authorized Service, Sitabuldi, Nagpur', city: 'Nagpur', contact: '1800-200-5690' },
    { brand: 'Western Digital', deviceType: 'SSD', location: 'SUN Computers, Manewada Road, Nagpur', city: 'Nagpur', contact: '1800 569 3982' },

    // ===== SEAGATE =====
    { brand: 'Seagate', deviceType: 'Storage', location: 'SeaCare Center, Dharampeth, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },
    { brand: 'Seagate', deviceType: 'Storage', location: 'Seagate Authorized, Sitabuldi, Nagpur', city: 'Nagpur', contact: '1800-425-4888' },
    { brand: 'Seagate', deviceType: 'SSD', location: 'SeaCare Center, Dharampeth, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },

    // ===== SANDISK =====
    { brand: 'SanDisk', deviceType: 'Storage', location: 'SUN Computers, Manewada Road, Nagpur', city: 'Nagpur', contact: '1800 569 3982' },
    { brand: 'SanDisk', deviceType: 'SSD', location: 'SUN Computers, Manewada Road, Nagpur', city: 'Nagpur', contact: '1800 569 3982' },
    { brand: 'SanDisk', deviceType: 'Memory Card', location: 'Western Digital Service, Nagpur', city: 'Nagpur', contact: '1800-200-5690' },

    // ===== KINGSTON =====
    { brand: 'Kingston', deviceType: 'RAM', location: 'Smartlink System, Rajura, Chandrapur', city: 'Chandrapur', contact: 'Walk-in / Dealer' },
    { brand: 'Kingston', deviceType: 'RAM', location: 'Kingston Authorized, Sitabuldi, Nagpur', city: 'Nagpur', contact: '1800-425-3456' },
    { brand: 'Kingston', deviceType: 'SSD', location: 'Smartlink System, Rajura, Chandrapur', city: 'Chandrapur', contact: 'Walk-in / Dealer' },
    { brand: 'Kingston', deviceType: 'SSD', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in' },

    // ===== CORSAIR =====
    { brand: 'Corsair', deviceType: 'RAM', location: 'Kaizen Infoserve, Dharampeth, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },
    { brand: 'Corsair', deviceType: 'PSU', location: 'Kaizen Infoserve, Dharampeth, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },
    { brand: 'Corsair', deviceType: 'SSD', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },

    // ===== CRUCIAL =====
    { brand: 'Crucial', deviceType: 'RAM', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },
    { brand: 'Crucial', deviceType: 'SSD', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },

    // ===== G.SKILL =====
    { brand: 'G.Skill', deviceType: 'RAM', location: 'Acro Engineering Drop Point, Nagpur', city: 'Nagpur', contact: 'Walk-in Center' },

    // ===== APC =====
    { brand: 'APC', deviceType: 'UPS', location: 'Aditya Sales, Tukum, Chandrapur', city: 'Chandrapur', contact: 'Walk-in / Distributor' },
    { brand: 'APC', deviceType: 'UPS', location: 'APC by Schneider Electric, MIHAN, Nagpur', city: 'Nagpur', contact: '1800-425-4888' },
    { brand: 'APC', deviceType: 'UPS', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in' },

    // ===== LOGITECH =====
    { brand: 'Logitech', deviceType: 'Mouse', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: '1800-572-7886' },
    { brand: 'Logitech', deviceType: 'Keyboard', location: 'Kaizen Infoserve, Dharampeth, Nagpur', city: 'Nagpur', contact: '1800-572-7886' },
    { brand: 'Logitech', deviceType: 'Webcam', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: '1800-572-7886' },

    // ===== NVIDIA =====
    { brand: 'NVIDIA', deviceType: 'GPU', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in' },
    { brand: 'NVIDIA', deviceType: 'GPU', location: 'NVIDIA Authorized Service, Delhi', city: 'Delhi', contact: '1800-419-0419' },

    // ===== AMD =====
    { brand: 'AMD', deviceType: 'Processor', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: 'Walk-in' },
    { brand: 'AMD', deviceType: 'GPU', location: 'Kaizen Infoserve, Dharampeth, Nagpur', city: 'Nagpur', contact: 'Walk-in' },

    // ===== MSI =====
    { brand: 'MSI', deviceType: 'Laptop', location: 'Rashi Peripherals, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2245678' },
    { brand: 'MSI', deviceType: 'GPU', location: 'Kaizen Infoserve, Dharampeth, Nagpur', city: 'Nagpur', contact: 'Walk-in' },

    // ===== LENOVO (ThinkPad) =====
    { brand: 'Lenovo', deviceType: 'ThinkPad', location: 'Accel Frontline Ltd, Dhantoli, Nagpur', city: 'Nagpur', contact: '0712-2244890' },
    { brand: 'Lenovo', deviceType: 'ThinkPad', location: 'Dev Vani Building, Bapat Nagar, Chandrapur', city: 'Chandrapur', contact: '9730225525' },
  ];

  const docs = centers.map(c => ({ ...c, createdAt: new Date() }));
  await collection.insertMany(docs);
  await collection.createIndex({ brand: 1, deviceType: 1 });
  await collection.createIndex({ brand: 1 });
}

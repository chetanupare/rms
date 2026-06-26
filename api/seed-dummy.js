import 'dotenv/config';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/slcg_rms';
const client = new MongoClient(MONGO_URI);

const CUSTOMERS = [
  { name: 'Rajesh Sharma', mobile: '9823456710', address: '42, Shankar Nagar, Nagpur, Maharashtra 440010', device: 'Laptop', brand: 'HP', model: 'Pavilion 15', problem: 'Screen flickering, random shutdowns' },
  { name: 'Priya Patil', mobile: '9876543211', address: 'Plot 7, Friends Colony, Wani, Maharashtra 445304', device: 'Desktop', brand: 'Dell', model: 'OptiPlex 3080', problem: 'Not powering on' },
  { name: 'Amit Deshmukh', mobile: '9765432109', address: '88, Shinde Layout, Nagpur, Maharashtra 440022', device: 'Printer', brand: 'Canon', model: 'PIXMA G3270', problem: 'Paper jam error, not printing' },
  { name: 'Sneha Joshi', mobile: '9654321098', address: 'House 12, Ward No 5, Wani, Maharashtra 445304', device: 'Laptop', brand: 'Lenovo', model: 'ThinkPad E14', problem: 'Keyboard not working, few keys stuck' },
  { name: 'Vikram Singh', mobile: '9543210987', address: '201, Abhyankar Nagar, Nagpur, Maharashtra 440010', device: 'Tablet', brand: 'Samsung', model: 'Galaxy Tab A8', problem: 'Touch screen unresponsive, cracked display' },
  { name: 'Anita Kale', mobile: '9432109876', address: '15, Main Road, Pandharkawda, Maharashtra 445302', device: 'Laptop', brand: 'Apple', model: 'MacBook Air M1', problem: 'Battery drains fast, not charging beyond 80%' },
  { name: 'Sunil Rathod', mobile: '9321098765', address: '7, Ganesh Nagar, Nagpur, Maharashtra 440024', device: 'Monitor', brand: 'LG', model: '24MK600M', problem: 'Display shows vertical lines, no image after 10 mins' },
  { name: 'Pooja Mahajan', mobile: '9210987654', address: '33, New Colony, Wani, Maharashtra 445304', device: 'Laptop', brand: 'Dell', model: 'Inspiron 3515', problem: 'Overheating, fan making noise, system slow' },
  { name: 'Rahul Gaikwad', mobile: '9109876543', address: '55, Central Avenue, Nagpur, Maharashtra 440012', device: 'Desktop', brand: 'HP', model: 'Pavilion Desktop TP01', problem: 'Frequent Blue Screen of Death (BSOD)' },
  { name: 'Meera Kulkarni', mobile: '9098765432', address: 'Apartment B4, Rajendra Nagar, Wani, Maharashtra 445304', device: 'Printer', brand: 'Epson', model: 'L3150', problem: 'Printer head clogged, color missing in prints' },
  { name: 'Sachin Borkar', mobile: '8987654321', address: '12, Nehru Nagar, Nagpur, Maharashtra 440015', device: 'Laptop', brand: 'Asus', model: 'Vivobook 15', problem: 'WiFi not working, network adapter missing' },
  { name: 'Kavita Wankhede', mobile: '8876543210', address: 'House 21, Ward 7, Wani, Maharashtra 445304', device: 'UPS', brand: 'APC', model: 'Back-UPS BX1100C', problem: 'UPS beeping continuously, not charging battery' },
  { name: 'Deepak Meshram', mobile: '8765432109', address: '9, Trimurti Nagar, Nagpur, Maharashtra 440022', device: 'Laptop', brand: 'HP', model: 'Laptop 15s', problem: 'Hard drive clicking sound, disk not detected' },
  { name: 'Rekha Suryawanshi', mobile: '8654321098', address: '44, Bus Stand Road, Pandharkawda, Maharashtra 445302', device: 'Desktop', brand: 'Lenovo', model: 'IdeaCentre AIO 3', problem: 'System hanging frequently, RAM issue suspected' },
  { name: 'Nitin Bhoyar', mobile: '8543210987', address: 'Plot 17, Shanti Nagar, Nagpur, Maharashtra 440024', device: 'Laptop', brand: 'Dell', model: 'Latitude 5420', problem: 'USB ports not working, system not detecting any peripherals' },
  { name: 'Shweta Dhawale', mobile: '8432109876', address: '18, Mahatma Fule Ward, Wani, Maharashtra 445304', device: 'Laptop', brand: 'Acer', model: 'Aspire 7', problem: 'Laptop not charging, adapter light off' },
  { name: 'Pramod Lanjewar', mobile: '8321098765', address: '66, Seminary Hills, Nagpur, Maharashtra 440006', device: 'Desktop', brand: 'Dell', model: 'Precision 3630', problem: 'GPU not detected, no display output' },
  { name: 'Varsha Tembhekar', mobile: '8210987654', address: '29, Main Road, Wani, Maharashtra 445304', device: 'Printer', brand: 'Brother', model: 'DCP-T520W', problem: 'Network connectivity issue, offline status' },
  { name: 'Gaurav Mankar', mobile: '8109876543', address: '101, Dharampeth, Nagpur, Maharashtra 440010', device: 'Laptop', brand: 'Microsoft', model: 'Surface Laptop 4', problem: 'OS not booting, stuck at logo screen' },
  { name: 'Harsha Bawankule', mobile: '8098765432', address: '8, Patel Ward, Wani, Maharashtra 445304', device: 'Laptop', brand: 'HP', model: 'ProBook 450 G8', problem: 'Audio not working, driver error' },
  { name: 'Mohan Dhanokar', mobile: '7987654321', address: '22, Nandanvan, Nagpur, Maharashtra 440009', device: 'Desktop', brand: 'HP', model: 'EliteDesk 800', problem: 'Power supply unit failure, no power' },
  { name: 'Smita Khobragade', mobile: '7876543210', address: '5, Shahu Ward, Pandharkawda, Maharashtra 445302', device: 'Tablet', brand: 'Samsung', model: 'Galaxy Tab S8', problem: 'Device not charging, charging port loose' },
  { name: 'Ravi Pande', mobile: '7765432109', address: '34, Laxmi Nagar, Nagpur, Maharashtra 440022', device: 'Laptop', brand: 'Lenovo', model: 'Legion 5', problem: 'Fan noise, thermal throttling during gaming' },
  { name: 'Jyoti Wanjari', mobile: '7654321098', address: 'House 11, New Layout, Wani, Maharashtra 445304', device: 'Monitor', brand: 'Samsung', model: '24F350', problem: 'Power LED blinking, no display' },
  { name: 'Kiran Chandekar', mobile: '7543210987', address: '77, Ram Nagar, Nagpur, Maharashtra 440018', device: 'Laptop', brand: 'Asus', model: 'ROG Zephyrus G14', problem: 'Keyboard backlight not working, system lag' },
  { name: 'Ujwala Raut', mobile: '7432109876', address: '36, Shivaji Ward, Wani, Maharashtra 445304', device: 'Desktop', brand: 'Apple', model: 'Mac Mini M2', problem: 'External display not detected via HDMI' },
  { name: 'Prashant Zade', mobile: '7321098765', address: '14, Itwari, Nagpur, Maharashtra 440002', device: 'Laptop', brand: 'Dell', model: 'XPS 13', problem: 'Webcam not detected, device manager error' },
  { name: 'Seema Dhurve', mobile: '7210987654', address: 'House 2, Gandhi Ward, Pandharkawda, Maharashtra 445302', device: 'Printer', brand: 'Canon', model: 'imageCLASS MF244dw', problem: 'Scanned image has black vertical line' },
  { name: 'Vijay Masram', mobile: '7109876543', address: '89, Manish Nagar, Nagpur, Maharashtra 440015', device: 'Laptop', brand: 'HP', model: 'EliteBook 840', problem: 'BIOS password forgotten, system locked' },
  { name: 'Neha Thakre', mobile: '7098765432', address: '16, Main Road, Wani, Maharashtra 445304', device: 'Desktop', brand: 'Dell', model: 'Inspiron 3891', problem: 'System infected with virus, multiple popups' },
];

const STATUSES = ['Pending', 'In Progress', 'Completed', 'Billed', 'Delivered'];
const BILL_TYPES = ['GST Invoice', 'Normal Bill'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];

function randomStatus(idx) {
  if (idx < 5) return 'Delivered';
  if (idx < 10) return 'Billed';
  if (idx < 15) return 'Completed';
  if (idx < 20) return 'In Progress';
  return 'Pending';
}

function generateAmount(idx) {
  const amounts = [2850, 3800, 1750, 4800, 2000, 6500, 1400, 2600, 3200, 950, 2300, 1200, 4200, 3000, 1700, 3700, 5200, 1400, 3500, 2000, 2700, 3100, 4800, 1700, 4000, 2500, 5800, 2000, 3200, 2800];
  return amounts[idx % amounts.length];
}

const TECHNICIANS = ['Rajesh Chavan', 'Suresh Bhalerao', 'Amit Landge', 'Nitin Gajbhiye'];
const DIAGNOSES = [
  'Motherboard power IC faulty, replaced and tested OK',
  'LCD panel damaged, replacement done. Keyboard assembly replaced',
  'Battery swollen, replaced with genuine battery. Charging port cleaned',
  'HDD failed, replaced with SSD 256GB. Fresh OS installed',
  'Printer head clogged, ultrasonic cleaning done. Alignment performed',
  'RAM module faulty, replaced with 8GB DDR4. System stable now',
  'Power supply unit capacitors bulged, replaced PSU',
  'Thermal paste dried, reapplied. Fan cleaned and lubricated',
  'Display driver issue, updated and calibrated. Screen cable reseated',
  'USB controller damaged, replaced motherboard USB IC',
  'WiFi adapter driver corrupted, reinstalled drivers and firmware update',
  'UPS battery dead, replaced with new battery. Inverter board checked',
  'Charging port loose, soldered new port. Adapter tested OK',
  'Touch screen digitizer replaced, calibrated successfully',
  'Operating system corrupted, fresh Windows 11 installation done',
  'GPU driver crash, DDU cleanup done, driver rollback to stable version',
  'Network card firmware updated, printer back online',
  'CMOS battery replaced, BIOS reset. System booting normally now',
  'LCD flex cable damaged, replaced and LCD reassembled',
  'Webcam ribbon cable loose, reseated and camera working',
  'Audio jack damaged, replaced audio board',
  'Keyboard flex ribbon torn, replaced complete keyboard assembly',
  'SSD firmware corrupted, firmware update and data recovery done',
  'Cooling fan bearing worn out, replaced fan assembly',
  'Backlight inverter failed, replaced LED driver board',
  'HDMI port bent pins, soldered new HDMI port',
  'Virus removal done, system cleaned, firewall configured',
  'External display not detected, EDID chip reflashed',
  'Battery calibration done, battery health at 87% now',
  'Wireless adapter hardware failure, replaced Intel AX201 module',
];

async function run() {
  try {
    await client.connect();
    const db = client.db();
    console.log('Connected to MongoDB, seeding dummy data...\n');

    const sequences = db.collection('sequences');
    const customersCol = db.collection('customers');
    const jobCardsCol = db.collection('job_cards');
    const repairsCol = db.collection('repairs');
    const billingCol = db.collection('billing');

    await Promise.all([
      customersCol.deleteMany({}),
      jobCardsCol.deleteMany({}),
      repairsCol.deleteMany({}),
      billingCol.deleteMany({}),
      sequences.deleteMany({}),
    ]);
    console.log('Cleared existing customers, job cards, repairs, billing, sequences\n');

    let customerIdSeq = 0;
    let jobIdSeq = 0;
    let invoiceSeq = 0;

    for (let i = 0; i < CUSTOMERS.length; i++) {
      const c = CUSTOMERS[i];
      customerIdSeq++;
      const phoneNumber = c.mobile;

      const customer = {
        customerId: customerIdSeq,
        name: c.name,
        mobile: phoneNumber,
        address: c.address,
        createdAt: new Date(Date.now() - (30 - i) * 86400000),
      };
      const custResult = await customersCol.insertOne(customer);
      const branch = c.address.includes('Wani') ? 'WANI' : c.address.includes('Pandharkawda') ? 'PANDHARKAWDA' : 'NAGPUR';
      const createdDate = new Date(customer.createdAt);
      const dateStr = createdDate.toISOString().slice(0, 10).replace(/-/g, '');
      jobIdSeq++;
      const jobId = `RM-${dateStr}-${String(jobIdSeq).padStart(6, '0')}`;
      const trackingCode = nanoid(8);
      const status = randomStatus(i);

      let jobDate = new Date(createdDate);
      if (status !== 'Pending') {
        jobDate = new Date(jobDate.getTime() + 3600000);
      }

      await jobCardsCol.insertOne({
        jobId,
        trackingCode,
        customerId: custResult.insertedId.toString(),
        branch,
        status,
        device: c.device,
        brand: c.brand,
        model: c.model,
        problem: c.problem,
        leadSource: 'In Store Visit',
        createdAt: jobDate,
      });

      if (status === 'In Progress' || status === 'Completed' || status === 'Billed' || status === 'Delivered') {
        let repairDate = new Date(createdDate);
        if (status !== 'In Progress') {
          repairDate = new Date(repairDate.getTime() + 7200000);
        }
        await repairsCol.insertOne({
          jobId,
          technician: TECHNICIANS[i % TECHNICIANS.length],
          diagnosis: DIAGNOSES[i % DIAGNOSES.length],
          estimateCost: generateAmount(i),
          status: status === 'In Progress' ? 'In Progress' : 'Completed',
          updatedAt: repairDate,
        });
      }

      if (status === 'Billed' || status === 'Delivered') {
        invoiceSeq++;
        const dateStr = createdDate.toISOString().slice(0, 10).replace(/-/g, '');
        const invoiceNo = `INV-${dateStr}-${String(invoiceSeq).padStart(4, '0')}`;
        const amount = generateAmount(i);
        const isGst = i % 3 !== 0;
        const total = isGst ? Math.round(amount * 1.18 / 100) * 100 : amount;

        let billDate = new Date(createdDate);
        if (status === 'Delivered') {
          billDate = new Date(billDate.getTime() + 86400000);
        }

        await billingCol.insertOne({
          invoiceNo,
          jobId,
          billType: isGst ? 'GST Invoice' : 'Normal Bill',
          amount: total,
          paymentMode: PAYMENT_MODES[i % PAYMENT_MODES.length],
          createdAt: billDate,
        });

        if (status === 'Delivered') {
          const deliveredDate = new Date(billDate.getTime() + 3600000);
          await jobCardsCol.updateOne({ jobId }, { $set: { status: 'Delivered', deliveredAt: deliveredDate } });
        }
      }
    }

    await sequences.insertMany([
      { _id: 'customerId', seq: customerIdSeq },
      { _id: 'jobId', seq: jobIdSeq },
      { _id: 'invoiceNo', seq: invoiceSeq },
    ]);

    console.log(`✓ Seeded ${customerIdSeq} customers with service jobs`);
    const countByStatus = {};
    for (const s of STATUSES) {
      countByStatus[s] = await jobCardsCol.countDocuments({ status: s });
    }
    console.log(`✓ Job status distribution:`);
    for (const [s, count] of Object.entries(countByStatus)) {
      console.log(`   ${s}: ${count}`);
    }
    const repairCount = await repairsCol.countDocuments();
    const billCount = await billingCol.countDocuments();
    console.log(`✓ Repairs created: ${repairCount}`);
    console.log(`✓ Invoices generated: ${billCount}`);
    console.log('\nDummy data seeding complete!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await client.close();
  }
}

run();

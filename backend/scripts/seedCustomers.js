const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const config = require('../config');

const testCustomers = [
  {
    name: 'Mohit Sharma',
    email: 'mohit@example.com',
    phone: '+91-9876543210',
    segment: 'Active',
    totalSpend: 15000,
    visitCount: 5,
    tags: ['high-value', 'regular']
  },
  {
    name: 'Priya Patel',
    email: 'priya@example.com',
    phone: '+91-9876543211',
    segment: 'Inactive',
    totalSpend: 5000,
    visitCount: 2,
    tags: ['new']
  },
  {
    name: 'Rahul Gupta',
    email: 'rahul@example.com',
    phone: '+91-9876543212',
    segment: 'Active',
    totalSpend: 25000,
    visitCount: 8,
    tags: ['vip', 'regular']
  },
  {
    name: 'Anita Singh',
    email: 'anita@example.com',
    phone: '+91-9876543213',
    segment: 'Inactive',
    totalSpend: 8000,
    visitCount: 3,
    tags: ['medium-value']
  },
  {
    name: 'Vikram Mehta',
    email: 'vikram@example.com',
    phone: '+91-9876543214',
    segment: 'Active',
    totalSpend: 30000,
    visitCount: 10,
    tags: ['vip', 'regular']
  }
];

async function seedCustomers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing customers
    await Customer.deleteMany({});
    console.log('Cleared existing customers');

    // Insert test customers
    const customers = await Customer.insertMany(testCustomers);
    console.log(`Added ${customers.length} test customers`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding customers:', error);
    process.exit(1);
  }
}

seedCustomers(); 
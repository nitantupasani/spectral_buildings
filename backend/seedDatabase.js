require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Building = require('./models/Building');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spectral_buildings');
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Building.deleteMany({});
    console.log('Cleared existing data');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const engineerPassword = await bcrypt.hash('engineer123', salt);

    // Create Admin User
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@spectral.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log('✅ Admin user created');

    // Create Engineer User
    const engineerUser = await User.create({
      username: 'engineer',
      email: 'engineer@spectral.com',
      password: engineerPassword,
      role: 'engineer'
    });
    console.log('✅ Engineer user created');

    // Create sample buildings
    const buildings = await Building.insertMany([
      {
        name: 'Spectral Tower A',
        address: '123 Tech Street, San Francisco, CA 94105',
        description: 'Main headquarters building with smart climate control',
        status: 'active',
        createdBy: adminUser._id
      },
      {
        name: 'Innovation Center',
        address: '456 Innovation Blvd, Palo Alto, CA 94301',
        description: 'Research and development facility',
        status: 'active',
        createdBy: adminUser._id
      },
      {
        name: 'Data Center East',
        address: '789 Server Lane, Austin, TX 78701',
        description: 'Primary data center with advanced cooling systems',
        status: 'maintenance',
        createdBy: adminUser._id
      }
    ]);
    console.log(`✅ Created ${buildings.length} sample buildings`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('\n👑 ADMIN USER:');
    console.log('   Email: admin@spectral.com');
    console.log('   Password: admin123');
    console.log('\n👨‍💼 ENGINEER USER:');
    console.log('   Email: engineer@spectral.com');
    console.log('   Password: engineer123');
    console.log('\n═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

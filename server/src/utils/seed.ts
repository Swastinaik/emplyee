import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Employee, { EmployeeRole, EmployeeStatus } from '../models/Employee';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee-management';

export const seedSuperAdmin = async (shouldExit: boolean = false) => {
  try {
    console.log('Checking/Seeding Super Admin...');
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB for seeding...');
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB.');
    }

    // Check if Super Admin already exists
    const superAdminExists = await Employee.findOne({ role: EmployeeRole.SUPER_ADMIN });

    if (superAdminExists) {
      console.log(`ℹ️  A Super Admin account already exists: ${superAdminExists.email}`);
      if (shouldExit) process.exit(0);
      return;
    }

    // Create default Super Admin
    const defaultAdmin = new Employee({
      employeeId: 'EMP000',
      name: 'Super Admin',
      email: 'admin@ems.com',
      phone: '1234567890',
      department: 'Administration',
      designation: 'Super Administrator',
      salary: 150000,
      joiningDate: new Date(),
      status: EmployeeStatus.ACTIVE,
      role: EmployeeRole.SUPER_ADMIN,
      reportingManager: null,
      profileImage: '',
      password: 'adminpassword123', // This will be hashed by the pre-save hook
      isDeleted: false,
    });

    await defaultAdmin.save();
    console.log('✅ Default Super Admin created successfully!');
    console.log('   Email: admin@ems.com');
    console.log('   Password: adminpassword123');
    console.log('   Role: Super Admin');
    if (shouldExit) process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};

// Run automatically if this file is run directly
if (require.main === module) {
  seedSuperAdmin(true);
}

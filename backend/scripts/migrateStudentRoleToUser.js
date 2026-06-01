/**
 * One-time migration: role "student" → "user"
 * Usage: node scripts/migrateStudentRoleToUser.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/faq_db';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const result = await User.updateMany({ role: 'student' }, { $set: { role: 'user' } });
  console.log(`Updated ${result.modifiedCount} user(s) to role "user"`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Seed script — run once to create admin user and demo data
 * Usage: node seed.js
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/faq_db';

const User = require('./models/User');
const { Query } = require('./models/Query');
const FAQ = require('./models/FAQ');
const Category = require('./models/Category');

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Create admin user
  let admin = await User.findOne({ email: 'admin@faq.edu' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@faq.edu',
      password: 'Admin@12345',
      role: 'admin',
      department: 'Administration',
      stats: { reputationPoints: 100, queriesAsked: 2, solutionsSubmitted: 5, solutionsApproved: 3 },
    });
    console.log('Admin user created: admin@faq.edu / Admin@12345');
  } else {
    console.log('Admin user already exists');
  }

  // Create categories
  const cats = [
    { name: 'academics', displayName: 'Academics', icon: '📚', description: 'Academic matters', faqCount: 0 },
    { name: 'admission', displayName: 'Admission', icon: '🎓', description: 'Admission queries', faqCount: 0 },
    { name: 'fees', displayName: 'Fees & Finance', icon: '💰', description: 'Fee structure and payments', faqCount: 0 },
    { name: 'placement', displayName: 'Placements', icon: '💼', description: 'Placement and career', faqCount: 0 },
    { name: 'facilities', displayName: 'Facilities', icon: '🏛️', description: 'Campus facilities', faqCount: 0 },
    { name: 'other', displayName: 'Other', icon: '❓', description: 'Miscellaneous', faqCount: 0 },
  ];
  for (const c of cats) {
    await Category.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
  }
  console.log('Categories seeded');

  // Create sample FAQs
  const faqData = [
    { question: 'What is the fee structure for B.Tech?', answer: 'The annual fee for B.Tech is Rs.1,50,000 per year for Indian students. This includes tuition, lab fees, and library access.', category: 'fees', status: 'published', helpful: 42, notHelpful: 3, viewCount: 312, createdBy: admin._id },
    { question: 'How do I apply for campus placement?', answer: 'Students can register for campus placements through the T&P portal. Eligibility criteria include a minimum 7.0 CGPA and no active backlogs.', category: 'placement', status: 'published', helpful: 67, notHelpful: 5, viewCount: 489, createdBy: admin._id },
    { question: 'What is the attendance policy?', answer: 'A minimum of 75% attendance is mandatory for all students to appear in end-semester examinations.', category: 'academics', status: 'published', helpful: 28, notHelpful: 2, viewCount: 201, createdBy: admin._id },
    { question: 'Is there a hostel facility available?', answer: 'Yes, on-campus hostel accommodation is available for both boys and girls. Fees are Rs.8,000 per month including mess.', category: 'facilities', status: 'published', helpful: 55, notHelpful: 4, viewCount: 378, createdBy: admin._id },
    { question: 'What is the admission process for new students?', answer: 'Admissions are based on the entrance exam rank. After the rank list is published, candidates must attend counseling and complete document verification.', category: 'admission', status: 'published', helpful: 38, notHelpful: 6, viewCount: 445, createdBy: admin._id },
  ];
  for (const f of faqData) {
    await FAQ.findOneAndUpdate({ question: f.question }, f, { upsert: true, new: true });
  }
  console.log('Sample FAQs seeded');

  console.log('Seed complete!');
  console.log('Login: admin@faq.edu / Admin@12345');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
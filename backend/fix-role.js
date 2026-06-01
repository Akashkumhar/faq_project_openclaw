const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/student_support').then(async () => {
  const User = require('./models/User');
  const all = await User.find({});
  console.log('All users:');
  all.forEach(u => console.log('  _id:', u._id.toString(), 'email:', u.email, 'role:', u.role, 'name:', u.name));

  const legacyUserAdmin = await User.findOne({ email: 'admin@faq.edu', role: { $in: ['student', 'user'] } });
  const realAdmin = await User.findOne({ email: 'admin@faq.edu', role: 'admin' });

  if (legacyUserAdmin && realAdmin) {
    console.log('Deleting duplicate user account:', legacyUserAdmin._id.toString());
    await User.deleteOne({ _id: legacyUserAdmin._id });
  } else if (!realAdmin && legacyUserAdmin) {
    legacyUserAdmin.role = 'admin';
    await legacyUserAdmin.save();
    console.log('Fixed role to admin:', legacyUserAdmin._id.toString());
  } else if (realAdmin) {
    console.log('Real admin already exists:', realAdmin._id.toString());
  }

  const remaining = await User.find({});
  console.log('\nRemaining users:');
  remaining.forEach(u => console.log('  _id:', u._id.toString(), 'email:', u.email, 'role:', u.role, 'name:', u.name));

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
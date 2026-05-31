const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/student_support').then(async () => {
  const User = require('./models/User');
  const all = await User.find({});
  console.log('All users:');
  all.forEach(u => console.log('  _id:', u._id.toString(), 'email:', u.email, 'role:', u.role, 'name:', u.name));

  const studentAdmin = await User.findOne({ email: 'admin@faq.edu', role: 'student' });
  const realAdmin = await User.findOne({ email: 'admin@faq.edu', role: 'admin' });

  if (studentAdmin && realAdmin) {
    console.log('Deleting duplicate student user:', studentAdmin._id.toString());
    await User.deleteOne({ _id: studentAdmin._id });
  } else if (!realAdmin && studentAdmin) {
    studentAdmin.role = 'admin';
    await studentAdmin.save();
    console.log('Fixed role to admin:', studentAdmin._id.toString());
  } else if (realAdmin) {
    console.log('Real admin already exists:', realAdmin._id.toString());
  }

  const remaining = await User.find({});
  console.log('\nRemaining users:');
  remaining.forEach(u => console.log('  _id:', u._id.toString(), 'email:', u.email, 'role:', u.role, 'name:', u.name));

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
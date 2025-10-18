require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

async function main() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
main();

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: String
});
const User = mongoose.model('User', userSchema);

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Please enter a valid email.' });

    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    res.json({ message: 'Account created!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password incorrect' });

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET || 'secret');
    res.json({ message: 'Login successful!', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  // Here you can implement sending reset email or any logic you want
  res.json({ message: 'Forgot password feature not implemented yet.' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));

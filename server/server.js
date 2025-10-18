require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Connection URI in .env file for security (replace YOURPASSWORD and mindcare DB name)
const uri = process.env.MONGODB_URI || 'mongodb+srv://eswarans_db_user:EswaranMA1@cluster0.gtfmjlc.mongodb.net/mindcare?retryWrites=true&w=majority';

mongoose.connect(uri);

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: String
});
const User = mongoose.model('User', userSchema);

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ message: 'Account created!' });
  } catch (err) {
    if (err.code === 11000) res.status(400).json({ error: 'User already exists' });
    else res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password incorrect' });
    const token = jwt.sign({ email: user.email }, 'your_jwt_secret'); // Use env var in prod
    res.json({ message: 'Login successful!', token });
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/forgot', async (req, res) => {
  // Add forgot password implementation here
  res.json({ message: 'Forgot password feature not implemented.' });
});

app.listen(5000, () => console.log('API running on port 5000'));

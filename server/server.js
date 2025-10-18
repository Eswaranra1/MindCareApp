// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://eswarans_db_user:<EswaranMA1>@cluster0.gtfmjlc.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
const User = mongoose.model('User', userSchema);

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ message: 'Account created!' });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password incorrect' });
    const token = jwt.sign({ email: user.email }, 'your_jwt_secret');
    res.json({ message: 'Login successful!', token });
});

app.post('/forgot', async (req, res) => {
    // Add forgot password logic (send email or reset link)
    res.json({ message: 'Forgot password feature to be implemented.' });
});

app.listen(5000, () => console.log('API running on port 5000'));

// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./utils/db');
const DataType = require('./models/DataType');

const app = express();
app.use(express.json());


const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
// Serve CSS and JS from /assets
app.use('/qassets', express.static(path.join(__dirname, 'qassets')));

// Ensure DB before API routes (put this ABOVE your routes)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (e) {
    console.error('Mongo connect error:', e?.message, e?.name);
    return res.status(500).json({ error: 'DB connect failed', details: e?.message });
  }
});

// Allow your frontend origins (add your Vercel domain later)
// put this above routes
const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(require('cors')({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);             // allow curl/postman
    if (!allowed.length || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));



// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));


                           //Page Routes
//Index page 
   app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html')); 
});

  //Signup page 
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});


// DataTypes: list
app.get('/api/datatypes', async (req, res) => {
  const list = await DataType.find().sort({ createdAt: 1 }).lean();
  res.json(list);
});

// DataTypes: create
app.post('/api/datatypes', async (req, res) => {
  const { name, description = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const doc = await DataType.create({ name, description });
    res.status(201).json(doc);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Name already exists' });
    console.error(e);
    res.status(500).json({ error: 'Failed to create' });
  }
});
// Connect to database
connectDB();
const PORT = process.env.PORT || 8400;
app.listen(PORT, () => console.log('Server running on ' + PORT));

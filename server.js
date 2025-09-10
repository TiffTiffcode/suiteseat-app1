// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); 

const fs = require('fs');
const multer = require('multer');

const { connectDB } = require('./utils/db');
const AuthUser    = require('./models/AuthUser');
const DataType = require('./models/DataType');
const Field = require('./models/Field');
const OptionSet   = require('./models/OptionSet');
const OptionValue = require('./models/OptionValue');
const Record      = require('./models/Record');
const { canon } = require('./utils/canon');

const bcrypt = require('bcryptjs');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');

const app = express();
app.use(express.json());


const path = require('path');
const servePublic = (name) => (req, res) =>
  res.sendFile(path.join(__dirname, 'public', `${name}.html`));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Serve CSS and JS from /assets
app.use('/qassets', express.static(path.join(__dirname, 'qassets')));

// at the top with other requires
const http = require('http');
const { Server } = require('socket.io');

// after `const app = express();`
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, credentials: true }
});

io.on('connection', (socket) => {
  console.log('🔌 socket connected', socket.id);
  socket.on('disconnect', () => console.log('🔌 socket disconnected', socket.id));
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

// at top of server
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuid } = require('uuid');

const s3 = new S3Client({ region: process.env.AWS_REGION });



// --- Helpers (single copy only) ---
const PUBLIC_TYPES = new Set(["Business","Calendar","Category","Service","Upcoming Hours" ]);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toObjectIdIfHex = (v) =>
  (typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v))
    ? new mongoose.Types.ObjectId(v)
    : v;



// Mount uploads at /uploads
app.set('trust proxy', 1); // good for Render/proxies
// --- View engine (only if you actually render EJS views) ---
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));


app.post('/api/uploads/presign', async (req, res) => {
  try {
    const { filename, contentType } = req.body || {};
    if (!filename || !contentType) return res.status(400).json({ error: 'filename, contentType required' });

    // create a unique key; you can prefix with userId if you want
    const ext = filename.split('.').pop();
    const key = `uploads/${uuid()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read', // or keep private and serve via CloudFront / signed URLs
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60 seconds
    const publicUrl =
      process.env.PUBLIC_BASE_URL
        ? `${process.env.PUBLIC_BASE_URL}/${key}`
        : `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ url, key, publicUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'presign failed' });
  }
});



app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true in production over HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 60 * 60 * 24 * 30,
  }),
}));

///////////////////////////////////
// --- Uploads (single source of truth) ---
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve uploaded files at /uploads/<filename>
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const name = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
//////////////////////////////////



//////////////////////////////////////////////
//User Authentication
app.get("/api/me", (req,res)=>{
  if (!req.session?.userId) return res.status(401).json({ loggedIn:false });
  res.json({ 
    id: req.session.userId, 
    ...req.session.user      // set this during /login
  });
}); 
function ensureAuthenticated(req, res, next) {
  if (req.session?.userId) return next();
  return res.status(401).json({ error: 'Not logged in' });
}

// Returns { user: { _id, firstName, lastName, email, phone, address, profilePhoto } }
app.get('/api/users/me', ensureAuthenticated, async (req, res) => {
  try {
    const u = await AuthUser.findById(req.session.userId).lean();
    if (!u) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        _id: String(u._id),
        firstName:   u.firstName   || '',
        lastName:    u.lastName    || '',
        email:       u.email       || '',
        phone:       u.phone       || '',
        address:     u.address     || '',   // string is fine; if you store an object, serialize as needed
        profilePhoto:u.profilePhoto|| ''    // e.g. "/uploads/169..._avatar.png"
      }
    });
  } catch (e) {
    console.error('GET /api/users/me failed:', e);
    res.status(500).json({ error: e.message });
  }
});


app.get('/api/me/records', ensureAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId || '');
    if (!userId) return res.status(401).json({ error: 'Not logged in' });

    const {
      dataType,
      where: whereStr,
      sort: sortStr,
      includeCreatedBy = '1',
      includeRefField = '1',
      myRefField = 'Client',
      limit = '100',
      skip  = '0',
    } = req.query;

    if (!dataType) return res.status(400).json({ error: 'dataType required' });

    const dt = await getDataTypeByNameLoose(dataType);
    if (!dt) return res.json({ data: [] });

    let whereRaw = {};
    if (whereStr) { try { whereRaw = JSON.parse(whereStr); } catch {} }
    const where = await normalizeWhereForType(dt._id, whereRaw);

    const ors = [];
    if (includeCreatedBy === '1' || includeCreatedBy === 'true') {
      ors.push({ createdBy: req.session.userId });
    }
    if (includeRefField === '1' || includeRefField === 'true') {
      const mineByRef = await normalizeWhereForType(dt._id, { [myRefField]: userId });
      ors.push(mineByRef);
    }

    const q = { dataTypeId: dt._id, deletedAt: null, ...where };
    if (ors.length) q.$or = ors;

    let mongoSort = { createdAt: -1 };
    if (sortStr) { try { mongoSort = await normalizeSortForType(dt._id, JSON.parse(sortStr)); } catch {} }

    const lim = Math.min(parseInt(limit, 10) || 100, 500);
    const skp = Math.max(parseInt(skip, 10) || 0, 0);

    const rows = await Record.find(q).sort(mongoSort).skip(skp).limit(lim).lean();
    res.json({ data: rows.map(r => ({ _id: r._id, values: r.values || {} })) });
  } catch (e) {
    console.error('GET /api/me/records failed:', e);
    res.status(500).json({ error: e.message });
  }
});


app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

  const existing = await AuthUser.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await AuthUser.create({
    firstName, lastName, email, phone, passwordHash, roles: ['client']
  });

  req.session.userId = user._id;
  req.session.user = { email: user.email, name: user.name, roles: user.roles };

  res.json({
    ok: true,
    user: { _id: user._id, firstName, lastName, email, phone }
  });
});

app.post('/signup/pro', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });

    const existing = await AuthUser.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await AuthUser.create({
      firstName, lastName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      roles: ['pro']
    });

    req.session.userId = String(user._id);
    req.session.user = { _id: String(user._id), firstName, lastName, email: user.email, roles: user.roles };

    res.status(201).json({ user: req.session.user, redirect: '/appointment-settings' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await AuthUser.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

  req.session.userId = user._id;
  req.session.user = { email: user.email, name: user.name, roles: user.roles };

  res.json({
    ok: true,
    user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone }
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.get('/check-login', async (req, res) => {
  try {
    if (!req.session?.userId) return res.json({ loggedIn: false });

    const u = await AuthUser.findById(req.session.userId).lean();
    if (!u) return res.json({ loggedIn: false });

    let first = (u.firstName || u.first_name || '').trim();
    let last  = (u.lastName  || u.last_name  || '').trim();
    let name  = [first, last].filter(Boolean).join(' ').trim() || (u.name || '').trim();

    // Try to enrich from Records if missing
    if (!first || !name) {
      try {
        const profile = await Record.findOne({
          deletedAt: { $exists: false },
          dataType: { $in: ['User', 'Client', 'Profile'] },
          $or: [
            { 'values.userId': String(u._id) },
            { 'values.createdBy': u._id },     // many of your records use createdBy: auth._id
            { 'values.Email': u.email },
            { 'values.email': u.email }
          ]
        }).lean();

        const pv = profile?.values || {};
        const pfFirst = (pv['First Name'] || pv.firstName || pv.first_name || '').trim();
        const pfLast  = (pv['Last Name']  || pv.lastName  || pv.last_name  || '').trim();
        const pfName  = [pfFirst, pfLast].filter(Boolean).join(' ').trim();

        if (!first && pfFirst) first = pfFirst;
        if (!last  && pfLast)  last  = pfLast;
        if (!name  && pfName)  name  = pfName;
      } catch {}
    }

    if (!name && u.email) name = u.email.split('@')[0]; // last resort
    const safeFirst = (first || name || 'there').split(' ')[0];

    res.json({
      loggedIn: true,
      userId: String(u._id),
      email: u.email || '',
      firstName: safeFirst,
      lastName: last || null,
      name,
      roles: u.roles || []
    });
  } catch (e) {
    console.error('check-login error:', e);
    res.status(500).json({ loggedIn: false });
  }
});

/////////////////////////////////////////////////////////////////////
   
//Datatypes
app.get('/api/datatypes', async (req, res) => {
  const list = await DataType.find().sort({ createdAt: 1 }).lean();
  res.json(list);
});

// Create
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

// Read one
app.get('/api/datatypes/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await DataType.findById(id).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

// Update
app.patch('/api/datatypes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body || {};
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
  if (name === undefined && description === undefined) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  try {
    const update = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (description !== undefined) update.description = String(description ?? '');

    const doc = await DataType.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Name already exists' });
    console.error(e);
    res.status(500).json({ error: 'Failed to update' });
  }
});

// Delete
app.delete('/api/datatypes/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await DataType.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});



//Field
// ----- Fields -----
app.get('/api/fields', async (req, res) => {
  try {
    const { dataTypeId } = req.query;
    const q = { deletedAt: null };
    if (dataTypeId) q.dataTypeId = dataTypeId;

    const items = await Field.find(q)
      .sort({ createdAt: -1 })
      .populate('referenceTo', 'name')     // <-- add this
      .populate('optionSetId', 'name');    // <-- optional, for "Dropdown → SetName"

    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//app.post('/api/fields',ensureAuthenticated, async (req, res) => {
    app.post('/api/fields', async (req, res) => {
  try {
    const { dataTypeId, name, type, allowMultiple, referenceTo, optionSetId } = req.body || {};
    if (!dataTypeId || !name || !type) {
      return res.status(400).json({ error: 'dataTypeId, name, type are required' });
    }
    if (!mongoose.isValidObjectId(dataTypeId)) {
      return res.status(400).json({ error: 'Invalid dataTypeId' });
    }
    if (type === 'Reference' && referenceTo && !mongoose.isValidObjectId(referenceTo)) {
      return res.status(400).json({ error: 'Invalid referenceTo' });
    }
    if (type === 'Dropdown' && optionSetId && !mongoose.isValidObjectId(optionSetId)) {
      return res.status(400).json({ error: 'Invalid optionSetId' });
    }

    const nameCanonical = canon(name);

    // Optional pre-check (your unique index will also enforce this)
    const dupe = await Field.findOne({ dataTypeId, nameCanonical, deletedAt: null });
    if (dupe) return res.status(409).json({ error: 'Field already exists (ignoring case/spaces)' });

    const created = await Field.create({
      dataTypeId,
      name,
      nameCanonical,
      type,
      allowMultiple: !!allowMultiple,
      referenceTo: referenceTo || null,
      optionSetId: optionSetId || null
    });
    res.status(201).json(created);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Field already exists (unique index)' });
    }
    res.status(500).json({ error: e.message });
  }
});
//app.patch('/api/fields/:id', ensureAuthenticated, async (req, res) => {
app.patch('/api/fields/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const setOps = {};
    if (req.body?.name) {
      setOps.name = String(req.body.name).trim();
      setOps.nameCanonical = canon(setOps.name);
    }
    if ('defaultOptionValueId' in req.body) {
      setOps.defaultOptionValueId = req.body.defaultOptionValueId || null;
    }
    if ('allowMultiple' in req.body) {
      setOps.allowMultiple = !!req.body.allowMultiple; // optional, matches your UI if you add a toggle later
    }

    if (!Object.keys(setOps).length) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const updated = await Field.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: setOps },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Field already exists (unique index)' });
    }
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/fields/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const updated = await Field.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//OptionSet

// ---------- Option Sets ----------
app.get('/api/optionsets', async (req, res) => {
  const sets = await OptionSet.find({ deletedAt: null }).sort({ createdAt: 1 }).lean();
  res.json(sets);
});

app.post('/api/optionsets', /*ensureAuthenticated,*/ async (req, res) => {
  try {
    const { name, kind = 'text' } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const created = await OptionSet.create({ name, nameCanonical: canon(name), kind });
    res.status(201).json(created);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Set name already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/optionsets/:id', /*ensureAuthenticated,*/ async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const setOps = {};
    if (req.body?.name) setOps.name = String(req.body.name).trim();
    if (req.body?.kind) setOps.kind = req.body.kind;

    if (!Object.keys(setOps).length) return res.status(400).json({ error: 'Nothing to update' });

    if (setOps.name) setOps.nameCanonical = canon(setOps.name);

    const updated = await OptionSet.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: setOps },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Set name already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/optionsets/:id', /*ensureAuthenticated,*/ async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const set = await OptionSet.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!set) return res.status(404).json({ error: 'Not found' });

    // soft-delete its values too
    await OptionValue.updateMany({ optionSetId: id, deletedAt: null }, { $set: { deletedAt: new Date() } });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Option Values ----------
app.get('/api/optionsets/:id/values', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.json([]);
  const vals = await OptionValue.find({ optionSetId: id, deletedAt: null })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  res.json(vals);
});

app.post('/api/optionsets/:id/values', /*ensureAuthenticated,*/ async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid optionSetId' });

    const { label, order = 0, imageUrl=null, numberValue=null, boolValue=null, colorHex=null } = req.body || {};
    if (!label) return res.status(400).json({ error: 'label required' });

    const created = await OptionValue.create({
      optionSetId: id,
      label,
      labelCanonical: canon(label),
      order,
      imageUrl, numberValue, boolValue, colorHex
    });
    res.status(201).json(created);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Value already exists in this set' });
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/optionvalues/:id', /*ensureAuthenticated,*/ async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const setOps = {};
    if ('label' in req.body) {
      setOps.label = String(req.body.label).trim();
      setOps.labelCanonical = canon(setOps.label);
    }
    ['imageUrl','numberValue','boolValue','colorHex','order'].forEach(k => {
      if (k in req.body) setOps[k] = req.body[k];
    });

    if (!Object.keys(setOps).length) return res.status(400).json({ error: 'Nothing to update' });

    const updated = await OptionValue.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: setOps },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Duplicate value in set' });
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/optionvalues/:id', /*ensureAuthenticated,*/ async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const updated = await OptionValue.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



////////////////////////////////////////////////////////////////////////////////////////////////////////

                                     //Accept Appointments 
                                     // helper near the top of server.js (once)
 // ---------- helpers ----------
 //create slug 
// --- Slug helpers ---
function slugify(s = '') {
  return String(s).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   // spaces & junk -> dashes
    .replace(/^-+|-+$/g, '') || 'business';
}

async function ensureUniqueBusinessSlug(base, excludeId = null) {
  const dt = await DataType.findOne({ name: /Business/i }).lean();
  if (!dt) return base || 'business';

  let slug = base || 'business';
  let n = 2;

  const collides = async (s) => {
    const q = {
      dataTypeId: dt._id,
      deletedAt: null,
      $or: [{ 'values.slug': s }, { 'values.businessSlug': s }],
    };
    if (excludeId) q._id = { $ne: excludeId };
    return !!(await Record.exists(q));
  };

  while (await collides(slug)) slug = `${base}-${n++}`;
  return slug;
}

// 1) JSON for a booking slug: /HairEverywhere.json
// Put this NEAR THE BOTTOM, after your /api, /qassets, /uploads, and
// explicit page routes like /admin, /signup, etc.
// Put this near the BOTTOM of server.js, after static + API + explicit page routes
const RESERVED = new Set([
  'api','public','uploads','qassets',
  'admin','signup','login','logout',
  'appointment-settings','appqointment-settings',
  'favicon.ico','robots.txt','sitemap.xml'
]);


// Public list of records by type, with simple field filters (e.g. &Business=<id>)
app.get('/public/records', async (req, res) => {
  try {
    const { dataType, limit = '500', skip = '0', sort } = req.query;
    if (!dataType) return res.status(400).json({ error: 'dataType required' });

    const dt = await getDataTypeByNameLoose(dataType);
    if (!dt) return res.json([]); // no such type yet

    const where = { dataTypeId: dt._id, deletedAt: null };

    // Treat any other query param as a values.<FieldName> = value filter
    for (const [k, v] of Object.entries(req.query)) {
      if (['dataType','limit','skip','sort','ts'].includes(k)) continue;
      if (v !== undefined && v !== '') where[`values.${k}`] = v;
    }

    let order = { createdAt: -1 };
    if (sort) { try { order = JSON.parse(sort); } catch {} }

    const lim = Math.min(parseInt(limit, 10) || 100, 1000);
    const skp = Math.max(parseInt(skip, 10) || 0, 0);

    const rows = await Record.find(where).sort(order).skip(skp).limit(lim).lean();

    res.json(rows.map(r => ({
      _id: String(r._id),
      values: r.values || {},
      deletedAt: r.deletedAt || null,
    })));
  } catch (e) {
    console.error('GET /public/records failed:', e);
    res.status(500).json({ error: e.message });
  }
});


// 1) JSON data for a business booking slug, e.g. /HairEverywhere.json
app.get('/:slug.json', async (req, res, next) => {
  const { slug } = req.params;
  if (!slug || slug.includes('.') || RESERVED.has(slug)) return next();

  try {
    const dt = await DataType.findOne({ name: /Business/i }).lean();
    if (!dt) return res.status(404).json({ message: 'Business type not found' });

    const re = new RegExp(`^${escapeRegex(slug)}$`, 'i');

    const biz = await Record.findOne({
      deletedAt: null,
      $and: [
        { $or: [{ dataTypeId: dt._id }, { dataType: 'Business' }] },
        { $or: [
       { 'values.slug': re },
{ 'values.businessSlug': re },
{ 'values.Slug': re },
{ 'values.bookingSlug': re },
{ 'values.Business Slug': re }, // with space/case
{ 'values.slug ': re },         // trailing space
{ 'values.Slug ': re },
        ]},
      ],
    }).lean();

    if (!biz) return res.status(404).json({ message: 'Business not found' });
    res.json({ _id: biz._id, values: biz.values || {} });
  } catch (e) {
    console.error('GET /:slug.json error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2) Page render for the booking page (EJS). Front-end JS will call /:slug.json
app.get('/:slug', (req, res, next) => {
  const { slug } = req.params;
  if (!slug || slug.includes('.') || RESERVED.has(slug)) return next();
  res.render('booking-page', { slug });
});


// 2) Public records (GET)
const {
  getDataTypeByNameLoose,
  normalizeValuesForType,
  normalizeWhereForType,
  normalizeSortForType,
} = require('./utils/normalize');

// --- Auth helpers (optional) ---
function ensureAuthenticated(req, res, next) {
  if (req.session?.userId) return next();
  res.status(401).json({ error: "Not authenticated" });
}
function ensureRole(role) {
  return (req, res, next) => {
    const roles = req.session?.roles || [];
    if (roles.includes(role)) return next();
    res.status(403).json({ error: "Forbidden" });
  };
}

 app.get('/appointment-settings',
  ensureAuthenticated,
  ensureRole('pro'),
  (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'appointment-settings.html'));
  }
);
                                    
app.post('/auth/logout', (req, res) => {
  req.session?.destroy(() => res.json({ ok: true }));
});

//
// --- helpers ---

async function getDataTypeByName(typeName) {
  return DataType.findOne({ name: typeName, deletedAt: null });
}


// --- CREATE a record: POST /api/records/:typeName ---
app.post('/api/records/:typeName', ensureAuthenticated, async (req, res) => {
  try {
    const typeName = req.params.typeName;
    const dt = await getDataTypeByNameLoose(typeName);
    if (!dt) return res.status(404).json({ error: `Data type "${typeName}" not found` });

    const rawValues = req.body?.values;
    if (!rawValues || typeof rawValues !== 'object') {
      return res.status(400).json({ error: 'values (object) is required' });
    }

    // --- BUSINESS: create slug before normalize ---
    if (/^business$/i.test(typeName)) {
      const explicit = String(rawValues.slug || rawValues.businessSlug || '').trim();
      const nameForSlug = (
        rawValues.businessName ||
        rawValues['Business Name'] ||
        rawValues.name || ''
      ).trim();

      const base = slugify(explicit || nameForSlug);
      if (base) {
        const unique = await ensureUniqueBusinessSlug(base);
        rawValues.slug = unique;
        rawValues.businessSlug = unique; // keep both in sync if you store both
      }
    }

    // --- CLIENT: auto-link to a "User" profile (& optionally create login) ---
    if (/^client$/i.test(typeName)) {
      const email = String(rawValues.Email || rawValues.email || '').toLowerCase().trim();
      const first = (rawValues['First Name'] || '').trim();
      const last  = (rawValues['Last Name']  || '').trim();
      const phone = (rawValues['Phone Number'] || '').trim();

      const alreadyLinked =
        rawValues['Linked User'] && (rawValues['Linked User']._id || rawValues['Linked User'].id);

      if (email && !alreadyLinked) {
        const userDT = await DataType.findOne({ name: 'User', deletedAt: null }).lean();

        let userRec = userDT
          ? await Record.findOne({
              dataTypeId: userDT._id,
              'values.Email': email,
              deletedAt: null
            }).lean()
          : null;

        let auth = await AuthUser.findOne({ email }).lean();

        if (!auth && process.env.AUTO_CREATE_CLIENT_ACCOUNTS === 'true') {
          const crypto = await import('node:crypto');
          const tempPass = crypto.randomBytes(9).toString('base64url'); // one-time temp
          const passwordHash = await bcrypt.hash(tempPass, 12);
          auth = await AuthUser.create({
            email,
            passwordHash,
            roles: ['client'],
            firstName: first,
            lastName:  last
          });
          console.log(`[Invite] Created AuthUser for ${email} (id=${auth._id}). Send invite email here.`);
        }

        if (!userRec && userDT) {
          const [created] = await Record.create([{
            dataTypeId: userDT._id,
            values: {
              'First Name':   first,
              'Last Name':    last,
              'Email':        email,
              'Phone Number': phone
            },
            createdBy: (auth && auth._id) || req.session.userId
          }]);
          userRec = created.toObject();
        }

        if (userRec) {
          rawValues['Linked User'] = { _id: String(userRec._id) };
        }
      }
    }

    // Normalize & persist (make sure slug survives normalization)
    const values = await normalizeValuesForType(dt._id, rawValues);
    if (/^business$/i.test(typeName)) {
      if (rawValues.slug) values.slug = rawValues.slug;
      if (rawValues.businessSlug) values.businessSlug = rawValues.businessSlug;
    }

    const created = await Record.create({
      dataTypeId: dt._id,
      values,
      createdBy: req.session.userId
    });

    res.status(201).json(created);
  } catch (e) {
    console.error('POST /api/records error:', e);
    res.status(500).json({ error: e.message });
  }
});





app.get('/api/records/:typeName', ensureAuthenticated, async (req, res) => {
  try {
    const dt = await getDataTypeByNameLoose(req.params.typeName);
    if (!dt) return res.status(404).json({ error: `Data type "${req.params.typeName}" not found` });

    const base = { dataTypeId: dt._id, createdBy: req.session.userId, deletedAt: null };

    let where = {};
    if (req.query.where) {
      try { where = JSON.parse(req.query.where); } catch {}
      where = await normalizeWhereForType(dt._id, where);
    }

    let sort = { createdAt: -1 };
    if (req.query.sort) {
      try {
        const rawSort = JSON.parse(req.query.sort);
        sort = await normalizeSortForType(dt._id, rawSort);
      } catch {}
    }

    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const skip  = Math.max(parseInt(req.query.skip  || '0',   10), 0);

    const items = await Record.find({ ...base, ...where }).sort(sort).skip(skip).limit(limit);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// --- GET one record: GET /api/records/:typeName/:id ---
app.get('/api/records/:typeName/:id', ensureAuthenticated, async (req, res) => {
  try {
    const dt = await getDataTypeByName(req.params.typeName);
    if (!dt) return res.status(404).json({ error: `Data type "${req.params.typeName}" not found` });

    const item = await Record.findOne({
      _id: req.params.id,
      dataTypeId: dt._id,
      createdBy: req.session.userId,
      deletedAt: null
    });

    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// --- UPDATE record (replace or merge values): PATCH /api/records/:typeName/:id ---
// Send { values: { "Field Label": newValue, ... } }
// Send { values: { "Field Label": newValue, ... } }
// Send { values: { "Field Label": newValue, ... } }
app.patch('/api/records/:typeName/:id', ensureAuthenticated, async (req, res) => {
  try {
    const typeName = req.params.typeName;
    const id = req.params.id;

    const dt = await getDataTypeByNameLoose(typeName);
    if (!dt) return res.status(404).json({ error: `Data type "${typeName}" not found` });

    const rawValues = req.body?.values;
    if (!rawValues || typeof rawValues !== 'object') {
      return res.status(400).json({ error: 'values (object) is required' });
    }

    // --- BUSINESS: keep slug unique if name/slug changes (before normalize) ---
    if (/^business$/i.test(typeName)) {
      const existing = await Record.findOne({
        _id: id,
        dataTypeId: dt._id,
        createdBy: req.session.userId,
        deletedAt: null,
      }).lean();
      if (!existing) return res.status(404).json({ error: 'Not found' });

      const currentSlug =
        existing.values?.slug || existing.values?.businessSlug || '';

      const incomingSlug = String(rawValues.slug || rawValues.businessSlug || '').trim();
      const incomingName = (
        rawValues.businessName ||
        rawValues['Business Name'] ||
        rawValues.name || ''
      ).trim();

      let desiredSlug = incomingSlug || currentSlug;
      if (!desiredSlug && incomingName) desiredSlug = slugify(incomingName);

      if (desiredSlug && desiredSlug !== currentSlug) {
        const unique = await ensureUniqueBusinessSlug(slugify(desiredSlug), id);
        rawValues.slug = unique;
        rawValues.businessSlug = unique;
      }
    }

    const values = await normalizeValuesForType(dt._id, rawValues);
    if (/^business$/i.test(typeName)) {
      if (rawValues.slug) values.slug = rawValues.slug;
      if (rawValues.businessSlug) values.businessSlug = rawValues.businessSlug;
    }

    const setOps = {};
    for (const [k, v] of Object.entries(values)) {
      setOps[`values.${k}`] = v;
    }

    const updated = await Record.findOneAndUpdate(
      { _id: id, dataTypeId: dt._id, createdBy: req.session.userId, deletedAt: null },
      { $set: setOps },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    console.error('PATCH /api/records error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- SOFT DELETE record: DELETE /api/records/:typeName/:id ---
app.delete('/api/records/:typeName/:id', ensureAuthenticated, async (req, res) => {
  try {
    const dt = await getDataTypeByName(req.params.typeName);
    if (!dt) return res.status(404).json({ error: `Data type "${req.params.typeName}" not found` });

    const updated = await Record.findOneAndUpdate(
      { _id: req.params.id, dataTypeId: dt._id, createdBy: req.session.userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 1) Upload a single file, return a URL
app.post('/api/upload', ensureAuthenticated, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// 2) Compute a unique slug for a type, scoped to current user
app.post('/api/slug/:typeName', ensureAuthenticated, async (req, res) => {
  try {
    const dt = await getDataTypeByName(req.params.typeName);
    if (!dt) return res.status(404).json({ error: `Data type "${req.params.typeName}" not found` });

    const base = String(req.body.base || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    const excludeId = req.body.excludeId || null;

    let slug = base || 'item';
    let i = 1;

    const baseQuery = {
      dataTypeId: dt._id,
      'values.slug': slug,
      createdBy: req.session.userId,
      deletedAt: null
    };
    if (excludeId) baseQuery._id = { $ne: excludeId };

    // bump suffix until free
    while (await Record.exists(baseQuery)) {
      slug = `${base}${i++}`;
      baseQuery['values.slug'] = slug;
    }

    res.json({ slug });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ---------- GET RECORDS BY TYPE NAME (keeps your old front-end calls working) ----------
app.get('/get-records/:typeName', ensureAuthenticated, async (req, res) => {
  try {
    const dt = await getDataTypeByName(req.params.typeName); // ✅ fixed name
    if (!dt) return res.json([]);

    const q = {
      dataTypeId: dt._id,
      deletedAt: null,
      createdBy: req.session.userId
    };

    // (Optional improvement: resolve the Business datatype and match referenceTo by its _id)

    const rows = await Record.find(q).sort({ createdAt: -1 });
    const out = rows.map(r => ({ _id: r._id, values: r.values || {} }));
    res.json(out);
  } catch (e) {
    console.error('get-records error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});


                               // ----- Records -----
app.get('/api/records', async (req, res) => {
  try {
    const { dataTypeId } = req.query;
    const q = dataTypeId ? { dataTypeId } : {};
    const items = await Record.find(q).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/records', async (req, res) => {
  try {
    const { dataTypeId, values = {} } = req.body;
    if (!dataTypeId) return res.status(400).json({ error: 'dataTypeId required' });
    const created = await Record.create({ dataTypeId, values });
    res.status(201).json(created);
  } catch (e) { res.status(500).json({ error: e.message }); }
});



// GET /api/public/booking-page-by-slug/:slug
app.get('/api/public/booking-page-by-slug/:slug', async (req,res) => {
  try {
    const slug = req.params.slug.trim().toLowerCase();
    const biz = await Records.findOne({ typeName:'Business', 'values.slug': slug, deletedAt: null });
    if (!biz) return res.status(404).json({ error:'Business not found' });

    const bizId = biz._id.toString();
    const selectedId = biz.values?.selectedBookingPageId || '';

    const pages = await Records.find({
      typeName: 'CustomBookingPage',
      deletedAt: null,
      $or: [
        { 'values.businessId': bizId },
        { 'values.Business': bizId },      // flexible keying
        { 'values.ownerId': bizId }
      ]
    }).lean();

    // helpers
    const isPublished = r => !!pickPublishedFlag(r.values||{});
    const byBiz = r => true; // already filtered by biz above
    const byTimeDesc = (a,b) => pickTime(b.values||{}) - pickTime(a.values||{});

    // 1) selected and published?
    let chosen = pages.find(p => p._id.toString() === selectedId && isPublished(p));

    // 2) else latest published
    if (!chosen){
      const published = pages.filter(isPublished).sort(byTimeDesc);
      chosen = published[0] || null;
    }

    if (chosen){
      const jsonStr = pickJson(chosen.values||{});
      return res.json({
        kind: 'custom',
        businessId: bizId,
        pageId: chosen._id,
        json: jsonStr
      });
    }

    // 3/4) fallbacks
    return res.json({
      kind: 'template',
      businessId: bizId,
      templateKey: biz.values?.templateKey || 'basic'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error:'Resolver failed' });
  }
});















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


// Pretty URLs protected by auth
app.get('/appointment-settings', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'appointment-settings.html'));
});

app.get('/appqointment-settings', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'appqointment-settings.html'));
});

// (Optional) keep old links working
app.get(['/appointment-settings', '/appointment-settings.html'], (req, res) => {
  res.redirect('/appointment-settings');
});

// Availability Page
app.get('/availability', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'availability.html'));
});

//calendar page 
app.get('/calendar', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

//clients page 
app.get('/clients', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'clients.html'));
});

//menu page 
app.get('/menu', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

//booking-page page 
app.get('/booking-page', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booking-page.html'));
});
////////////////////////////////////
//calendar page 
app.get('/custom-booking', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'custom-booking.html'));
});


//////////////////////////////////

//Client-board page 
app.get('/client-dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'client-dashboard.html'));
});

});
// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));



///////////////////////////////////////////////////////////////////////////////
//last code
// Connect to database
connectDB();
const PORT = process.env.PORT || 8400;
server.listen(PORT, () => console.log('Server running on ' + PORT));

////////////////////////////////////////////////////////////////////////////////



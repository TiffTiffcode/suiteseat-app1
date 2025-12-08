// routes/records.js
const express = require('express');
const router = express.Router();

// Controllers (CommonJS)
const rec = require('../controllers/records');

// Dynamic Record model (we’ll use it to discover owned Business IDs)
const Record = require('../models/Record');

// ---- sanity: make sure controller exports exist
const requiredFns = [
  'createRecord',
  'listRecords',
  'getRecordById',
  'updateRecordById',
  'deleteRecordById',
  'queryRecords',
];
for (const fn of requiredFns) {
  if (typeof rec[fn] !== 'function') {
    throw new Error(`[routes/records] Controller is missing ${fn}() export`);
  }
}

// ---- helpers
function parseJSON(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function getUserId(req) {
  return (
    req.session?.userId ||
    req.user?._id ||
    req.user?.id ||
    null
  );
}

function asId(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return String(v._id || v.id || v.value || v.$id || '');
  return '';
}

// Build the OR clause that matches “created by user”
function makeCreatedByClause(uid) {
  return {
    $or: [
      { createdBy: uid },
      { 'createdBy._id': uid },
      { 'values.createdBy': uid },
      { 'values.createdBy._id': uid },
    ],
  };
}

// Build the OR clause that matches “owner is user”
function makeOwnerClause(uid) {
  return {
    $or: [
      { Owner: uid },
      { 'Owner._id': uid },
      { 'values.Owner': uid },
      { 'values.Owner._id': uid },
      { ownerId: uid },
      { 'values.ownerId': uid },
    ],
  };
}

// Build the OR clause that matches “Business ref is in allowed IDs”
function makeBusinessRefInClause(businessIds) {
  // support many field shapes
  const asSet = Array.from(new Set((businessIds || []).map(String)));
  if (!asSet.length) return { $expr: { $eq: [1, 0] } }; // match nothing
  return {
    $or: [
      { 'values.businessId': { $in: asSet } },
      { 'businessId':        { $in: asSet } },
      { 'values.Business':   { $in: asSet } },
      { 'Business':          { $in: asSet } },
      { 'values.Business._id': { $in: asSet } },
      { 'Business._id':        { $in: asSet } },
      { 'values["Business Id"]': { $in: asSet } },
      { 'values.BusinessId':     { $in: asSet } },
    ],
  };
}

// Discover Business IDs owned by the user (by createdBy or Owner)
async function getOwnedBusinessIds(uid) {
  if (!uid) return [];
  const whereOwnedBusiness = {
    typeName: 'Business',
    $or: [
      // createdBy
      { createdBy: uid },
      { 'createdBy._id': uid },
      { 'values.createdBy': uid },
      { 'values.createdBy._id': uid },
      // Owner
      { Owner: uid },
      { 'Owner._id': uid },
      { 'values.Owner': uid },
      { 'values.Owner._id': uid },
      { ownerId: uid },
      { 'values.ownerId': uid },
    ],
    deletedAt: { $exists: false },
  };

  const docs = await Record.find(whereOwnedBusiness, { _id: 1 }).lean().exec();
  return (docs || []).map(d => String(d._id));
}

// Build an ownership filter for the incoming :type
async function buildOwnerWhere(type, uid) {
  // If not logged in, let your controller handle auth (401/empty list)
  if (!uid) return null;

  // Always allow "created by me"
  const createdBy = makeCreatedByClause(uid);

  if (!type || /^Business$/i.test(type)) {
    // Business: also allow explicit Owner matches
    const owner = makeOwnerClause(uid);
    return { $or: [ createdBy, owner ] };
  }

  // Other types we care about:
const isScopedToBusiness = /^(Calendar|Category|Service|Client|Appointment)$/i.test(type);

  if (isScopedToBusiness) {
    const ownedBizIds = await getOwnedBusinessIds(uid);
    const bizRef = makeBusinessRefInClause(ownedBizIds);

    // Allow either “I created it” OR “it references my Business”
    return { $or: [ createdBy, bizRef ] };
  }

  // Default (unknown types): fall back to "created by me"
  return createdBy;
}

// Merge a new filter into req.query.where via $and
function mergeIntoWhere(req, addFilter) {
  if (!addFilter) return;
  const existing = parseJSON(req.query.where, {});
  if (existing && Object.keys(existing).length > 0) {
    req.query.where = JSON.stringify({ $and: [ existing, addFilter ] });
  } else {
    req.query.where = JSON.stringify(addFilter);
  }
}

// ---- middleware that clamps list + query endpoints to the owner
async function clampToOwner(req, _res, next) {
  try {
    const uid = getUserId(req);
    const type = req.params?.type || req.body?.typeName; // GET uses :type, POST /query uses body
    const ownerWhere = await buildOwnerWhere(type, uid);
    mergeIntoWhere(req, ownerWhere);
    next();
  } catch (e) {
    next(e);
  }
}

// --------- ROUTES ----------

// LIST (supports ?where=, ?limit=, ?sort= etc.)
// GET /api/records/:type
router.get('/:type', clampToOwner, async (req, res, next) => {
  try {
    await rec.listRecords(req, res);
  } catch (e) { next(e); }
});

// READ ONE (no clamp here; your controller can still enforce read auth per-id)
router.get('/:type/:id', async (req, res, next) => {
  try {
    await rec.getRecordById(req, res);
  } catch (e) { next(e); }
});

// CREATE
router.post('/:type', async (req, res, next) => {
  try {
    await rec.createRecord(req, res);
  } catch (e) { next(e); }
});

// QUERY (POST body: { typeName, where, ... }) — clamp too
router.post('/query', clampToOwner, async (req, res, next) => {
  try {
    await rec.queryRecords(req, res);
  } catch (e) { next(e); }
});

// UPDATE
router.patch('/:type/:id', async (req, res, next) => {
  try {
    await rec.updateRecordById(req, res);
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:type/:id', async (req, res, next) => {
  try {
    await rec.deleteRecordById(req, res);
  } catch (e) { next(e); }
});

module.exports = router;

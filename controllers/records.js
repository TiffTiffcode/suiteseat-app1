// controllers/records.js
const mongoose = require('mongoose');
const Record   = require('../models/Record');

function parseJSON(input, fallback) {
  if (input == null || input === '') return fallback;
  try { return typeof input === 'string' ? JSON.parse(input) : input; }
  catch { return fallback; }
}

function cleanSort(sort) {
  if (!sort || typeof sort !== 'object') return { createdAt: -1 };
  const out = {};
  for (const [k, v] of Object.entries(sort)) {
    out[String(k)] = (String(v) === 'desc' || Number(v) < 0) ? -1 : 1;
  }
  return out;
}

function toObjectId(id) {
  try { return new mongoose.Types.ObjectId(String(id)); }
  catch { return null; }
}

function buildTypeMatch(type) {
  // We keep your flexible schema: many of your docs use `dataType` string.
  // If you also use `dataTypeId`, this won’t hurt; it just filters by string.
  return type ? { dataType: String(type) } : {};
}

function buildWhere(base) {
  const where = { deletedAt: null, ...(base || {}) };
  // normalize $gte/$lte for Date stored as "YYYY-MM-DD" strings if needed — no-op here
  return where;
}

function ownerClauseFor(uid) {
  return {
    $or: [
      { Owner: uid },
      { 'values.Owner': uid },
      { Owner: { _id: uid } },
      { 'values.Owner._id': uid },
    ],
  };
}

/** GET /api/records/:type */
async function listRecords(req, res) {
  const type = req.params.type;
  const where = parseJSON(req.query.where, {});
  const fields = parseJSON(req.query.fields, null);
  const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 5000);
  const sort  = cleanSort(parseJSON(req.query.sort, { createdAt: -1 }));

  const q = {
    ...buildTypeMatch(type),
    ...buildWhere(where),
  };

  const cursor = Record.find(q, fields || undefined).sort(sort).limit(limit).lean();
  const rows = await cursor.exec();
  return res.json(rows || []);
}

/** GET /api/records/:type/:id */
async function getRecordById(req, res) {
  const type = req.params.type;
  const id   = req.params.id;
  const _id  = toObjectId(id);
  if (!_id) return res.status(400).json({ error: 'bad_id' });

  const row = await Record.findOne({ _id, ...buildTypeMatch(type), deletedAt: null }).lean();
  if (!row) return res.status(404).json({ error: 'not_found' });
  return res.json(row);
}

/** POST /api/records/:type */
async function createRecord(req, res) {
  const type = req.params.type;
  const values = req.body?.values || {};
  if (!type) return res.status(400).json({ error: 'missing_type' });

  const doc = new Record({
    dataType: type,
    values,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  await doc.save();
  return res.status(201).json(doc.toObject());
}

/** PATCH /api/records/:type/:id */
async function updateRecordById(req, res) {
  const type = req.params.type;
  const id   = req.params.id;
  const _id  = toObjectId(id);
  if (!_id) return res.status(400).json({ error: 'bad_id' });

  const $set = {};
  if (req.body?.values && typeof req.body.values === 'object') {
    // update nested values.*
    for (const [k, v] of Object.entries(req.body.values)) {
      $set[`values.${k}`] = v;
    }
  }
  $set.updatedAt = new Date();

  const row = await Record.findOneAndUpdate(
    { _id, ...buildTypeMatch(type), deletedAt: null },
    { $set },
    { new: true, lean: true }
  );
  if (!row) return res.status(404).json({ error: 'not_found' });
  return res.json(row);
}

/** DELETE /api/records/:type/:id (soft delete) */
async function deleteRecordById(req, res) {
  const type = req.params.type;
  const id   = req.params.id;
  const _id  = toObjectId(id);
  if (!_id) return res.status(400).json({ error: 'bad_id' });

  const row = await Record.findOneAndUpdate(
    { _id, ...buildTypeMatch(type), deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true, lean: true }
  );
  if (!row) return res.status(404).json({ error: 'not_found' });
  return res.json({ ok: true, _id: String(_id) });
}

/** POST /api/records/query { typeName, where, limit, sort, fields } */
async function queryRecords(req, res) {
  const {
    typeName,
    where: whereBody,
    limit: limitBody,
    sort: sortBody,
    fields: fieldsBody,
  } = req.body || {};

  if (!typeName) return res.status(400).json({ error: 'missing_typeName' });

  let where = buildWhere(whereBody || {});
  let fields = fieldsBody || undefined;
  const limit = Math.min(parseInt(limitBody || '1000', 10) || 1000, 5000);
  const sort  = cleanSort(sortBody || { createdAt: -1 });

  // ✅ Owner clamp for Business on POST /query (the GET path is clamped in router)
  if (String(typeName).toLowerCase() === 'business') {
    const uid = req.session?.userId || req.user?._id || req.user?.id;
    if (uid) {
      where = (where && Object.keys(where).length)
        ? { $and: [ where, ownerClauseFor(uid) ] }
        : ownerClauseFor(uid);
    }
  }

  const q = { ...buildTypeMatch(typeName), ...where, deletedAt: null };
  const rows = await Record.find(q, fields || undefined).sort(sort).limit(limit).lean();
  return res.json(rows || []);
}

module.exports = {
  createRecord,
  listRecords,
  getRecordById,
  updateRecordById,
  deleteRecordById,
  queryRecords,
};

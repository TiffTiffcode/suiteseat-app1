// utils/normalize.js
const DataType = require('../models/DataType');
const Field    = require('../models/Field');
const { canon } = require('./canon');

// Find a DataType by exact or canonical name
async function getDataTypeByNameLoose(typeName) {
  const want = canon(typeName);

  // 1) Try canonical
  let dt = await DataType.findOne({ nameCanonical: want });
  if (dt) return dt;

  // 2) Fallback: case-insensitive name (handles legacy rows without nameCanonical)
  dt = await DataType.findOne({ name: new RegExp(`^\\s*${typeName}\\s*$`, 'i') });
  if (dt) return dt;

  // 3) Last resort: scan + canon compare (slow, but only hit in edge cases)
  const all = await DataType.find({});
  return all.find(d => canon(d.name) === want) || null;
}

// Build a canonical map of field labels for a DataType
async function buildFieldMap(dataTypeId) {
  const fields = await Field.find({ dataTypeId, deletedAt: null }).lean();
  const byCanon = new Map();
  for (const f of fields) {
    const c = f.nameCanonical || canon(f.name);
    byCanon.set(c, f.name);
  }
  return byCanon;
}

// Normalize incoming values object: map keys by canonical label
async function normalizeValuesForType(dataTypeId, values) {
  const byCanon = await buildFieldMap(dataTypeId);
  const out = {};
  for (const [k, v] of Object.entries(values || {})) {
    const real = byCanon.get(canon(k)) || k;
    out[real] = v;
  }
  return out;
}

// Normalize a "where" object to Mongo query on values.*
async function normalizeWhereForType(dataTypeId, whereObj) {
  const byCanon = await buildFieldMap(dataTypeId);
  const q = {};
  for (const [k, v] of Object.entries(whereObj || {})) {
    const real = byCanon.get(canon(k)) || k;
    q[`values.${real}`] = v;
  }
  return q;
}

// Normalize a "sort" object that may reference values.<label>
async function normalizeSortForType(dataTypeId, sortObj) {
  const byCanon = await buildFieldMap(dataTypeId);
  const out = {};
  for (const [k, dir] of Object.entries(sortObj || {})) {
    if (k.startsWith('values.')) {
      const raw  = k.slice(7);
      const real = byCanon.get(canon(raw)) || raw;
      out[`values.${real}`] = dir;
    } else {
      out[k] = dir;
    }
  }
  return out;
}

module.exports = {
  getDataTypeByNameLoose,
  normalizeValuesForType,
  normalizeWhereForType,
  normalizeSortForType,
};

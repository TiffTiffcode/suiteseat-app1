// C:\Users\tiffa\OneDrive\Desktop\Live\routes\public.js
// C:\Users\tiffa\OneDrive\Desktop\Live\routes\public.js
const express  = require('express');
const router   = express.Router();
const Record   = require('../models/Record');
const DataType = require('../models/DataType');

// helpers
const toId = (x) => {
  if (!x) return '';
  if (typeof x === 'string') return x;
  if (typeof x === 'object') return String(x._id || x.id || '');
  return '';
};
const needsBusinessScope = (name='') =>
  /^(calendar|category|service)$/i.test(String(name).trim());

// Loose lookup: "Calendar", "calendar", etc.
async function getDTLoose(name) {
  if (!name) return null;
  const dt = await DataType.findOne({
    $or: [
      { name: new RegExp(`^${String(name).trim()}$`, 'i') },
      { nameCanonical: String(name).toLowerCase() }
    ],
    deletedAt: null
  }, { _id: 1 }).lean();
  return dt?._id || null;
}

// GET /public/records
// ?dataType=Service&Business=<bizId>&Calendar=<calId>&Date=YYYY-MM-DD
router.get('/public/records', async (req, res) => {
  try {
    const {
      dataType,          // e.g. "Calendar" | "Service" | "Category"
      _id,
      Date: dateISO,     // YYYY-MM-DD
      Calendar,          // calendar ref in various shapes
      'Calendar._id': CalendarDot,
      calendarId,
      Business,
      businessId
    } = req.query;

    const q = { deletedAt: null };
    if (_id) q._id = _id;

    // Resolve datatype (optional)
    let dtId = null;
    if (dataType) {
      dtId = await getDTLoose(dataType);
      if (!dtId) return res.json([]); // unknown type → nothing public
      q.dataTypeId = dtId;
    }

    // 🔒 Business scoping (strong)
    const biz = String(Business || businessId || '').trim();
    if (needsBusinessScope(dataType)) {
      // For these public lists, Business is REQUIRED
      if (!biz) return res.json([]);
    }
    if (biz) {
      // Enforce on server side
      q.$and = (q.$and || []).concat([{
        $or: [
          { 'values.Business': biz },
          { 'values.businessId': biz },
          { 'values.ownerBusinessId': biz },
          { 'values.ownerId': biz },
          { 'values["Business Id"]': biz },
          { 'values.Business._id': biz }
        ]
      }]);
    }

    // Optional calendar scoping (accept many shapes)
    const cal = Calendar || CalendarDot || calendarId;
    if (cal) {
      const calStr = String(cal);
      q.$and = (q.$and || []).concat([{
        $or: [
          { 'values.calendarId': calStr },
          { 'values.CalendarId': calStr },
          { 'values.Calendar._id': calStr },
          { 'values.Calendar': calStr } // string form
        ]
      }]);
    }

    // Optional date scoping
    if (dateISO) {
      const d = String(dateISO).slice(0, 10);
      // match the YYYY-MM-DD prefix regardless of time suffix
      q['values.Date'] = { $regex: `^${d}` };
    }

    // Limit fields to avoid leakage
    const rows = await Record.find(q, { values: 1 }).lean();

    // 🔒 Second-pass client-safe filter (belt & suspenders)
    const filtered = !biz ? rows : rows.filter(r => {
      const v = r.values || {};
      const candidates = [
        v.Business, v.businessId, v.ownerBusinessId, v.ownerId, v['Business Id'],
        v.Business && v.Business._id
      ];
      return candidates.map(toId).map(String).includes(biz);
    });

    // Public shape
    res.json(filtered.map(r => ({ _id: String(r._id), values: r.values || {} })));
  } catch (e) {
    console.error('[public/records] error', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;

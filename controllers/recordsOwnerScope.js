// controllers/recordsOwnerScope.js
const Record = require('../models/Record');

/** owner clause for Business rows */
function businessOwnerClause(userId) {
  return {
    $or: [
      { 'values.Owner': userId },
      { 'values.Owner._id': userId },
      { 'Owner': userId },
      { 'Owner._id': userId },
      { 'createdBy': userId },
      { 'values.createdBy': userId },
    ]
  };
}

/**
 * Inject owner scope into the incoming "where" filter.
 * - Business: only rows owned by req.user
 * - Calendar/Service/Client/Appointment: only rows whose Business is owned by req.user
 */
async function injectOwnerScope(userId, typeName, where = {}) {
  const t = String(typeName || '').toLowerCase();

  // ADMIN escape hatch (optional)
  // if (req.user?.role === 'admin' && req.query.all === '1') return where;

  if (t === 'business') {
    return { $and: [ where, businessOwnerClause(userId) ] };
  }

  // For types that belong to a Business, first find my Business ids
  const myBizIds = await Record.find({
    typeName: 'Business',
    deletedAt: { $exists: false },
    ...businessOwnerClause(userId)
  }).distinct('_id');

  if (!myBizIds.length) {
    // force empty
    return { $and: [ where, { _id: { $in: [] } } ] };
  }

  const belongsToMyBusiness = {
    $or: [
      { 'values.Business': { $in: myBizIds } },          // string id
      { 'values.Business._id': { $in: myBizIds } },      // ref object {_id}
      { 'Business': { $in: myBizIds } },
      { 'Business._id': { $in: myBizIds } }
    ]
  };

  return { $and: [ where, belongsToMyBusiness ] };
}

module.exports = { injectOwnerScope };

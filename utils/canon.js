// utils/canon.js
function canon(s = '') {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // collapse spaces; customize as you like
}
module.exports = { canon };

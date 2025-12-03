/**
 * Split an array into chunks of a given max size
 * Pure utility: no side effects.
 * @template T
 * @param {T[]} arr
 * @param {number} size - Max items per chunk (>=1)
 * @returns {T[][]}
 */
function chunkArray(arr, size) {
  const n = Math.max(1, Number(size) || 1);
  const out = [];
  for (let i = 0; i < arr.length; i += n) {
    out.push(arr.slice(i, i + n));
  }
  return out;
}

module.exports = { chunkArray };


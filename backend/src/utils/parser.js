const { Readable } = require('stream');
const { parse } = require('fast-csv');
/**
 * Parses a CSV buffer into an array of objects using streaming to avoid loading whole file into memory.
 * @param {Buffer} buffer - CSV file buffer.
 * @returns {Promise<Array<Object>>} Resolves with all parsed records.
 */
function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(parse({ headers: true, ignoreEmpty: true, trim: true, strictColumnHandling: false }))
      .on('error', (err) => reject(err))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows));
  });
}

module.exports = { parseCSV };


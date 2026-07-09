const { parseCSV } = require('../utils/parser');
const { processBatch } = require('../services/aiService');

/**
 * Handles CSV Upload, Parsing, and AI Extraction.
 */
async function importCSV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    let rawRecords;
    try {
      rawRecords = await parseCSV(req.file.buffer);
    } catch (parseErr) {
      return res.status(400).json({ error: `Failed to parse CSV file: ${parseErr.message}` });
    }

    if (!rawRecords || rawRecords.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no valid headers' });
    }

    // Set batch size (default to 15 to stay safe within token limits and output limits)
    const batchSize = parseInt(process.env.BATCH_SIZE || '15', 10);
    const batches = [];
    for (let i = 0; i < rawRecords.length; i += batchSize) {
      batches.push(rawRecords.slice(i, i + batchSize));
    }

    const successRecords = [];
    const skippedRecords = [];

    // Process each batch sequentially to avoid rate-limiting issues
    for (let index = 0; index < batches.length; index++) {
      const batch = batches[index];
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let mappedBatch = [];
      let lastError = null;

      while (attempts < maxAttempts && !success) {
        attempts++;
        try {
          mappedBatch = await processBatch(batch);
          success = true;
        } catch (err) {
          lastError = err;
          console.error(`[AI Batch Error] Batch ${index + 1}/${batches.length}, Attempt ${attempts} failed:`, err.message);
          
          if (attempts < maxAttempts) {
            // Exponential backoff wait (1s, 2s, 3s...)
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          }
        }
      }

      if (!success) {
        // If all retries failed, log these records as skipped
        console.error(`[AI Batch Failure] Batch ${index + 1}/${batches.length} completely failed after ${maxAttempts} attempts.`);
        for (const rawItem of batch) {
          skippedRecords.push({
            name: rawItem.name || rawItem.Name || 'Unknown',
            email: rawItem.email || rawItem.Email || 'Unknown',
            mobile: rawItem.mobile || rawItem.Phone || rawItem.Mobile || 'Unknown',
            reason: `AI processing error: ${lastError ? lastError.message : 'Unknown error'}`
          });
        }
        continue;
      }

      // If batch succeeded, run post-processing validation
      for (const record of mappedBatch) {
        // Rule 7: Skip invalid records if neither email nor mobile_without_country_code is present
        const emailVal = record.email ? String(record.email).trim() : '';
        const mobileVal = record.mobile_without_country_code ? String(record.mobile_without_country_code).trim() : '';

        if (!emailVal && !mobileVal) {
          skippedRecords.push({
            name: record.name || 'Unknown',
            email: emailVal || 'N/A',
            mobile: mobileVal || 'N/A',
            reason: 'Record skipped: contains neither a valid email nor a mobile number.'
          });
          continue;
        }

        // Rule 1: Allowed CRM status values
        const allowedStatuses = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
        let status = record.crm_status ? String(record.crm_status).trim().toUpperCase() : 'GOOD_LEAD_FOLLOW_UP';
        // Replace spaces or dashes with underscores
        status = status.replace(/[-\s]/g, '_');
        if (!allowedStatuses.includes(status)) {
          status = 'GOOD_LEAD_FOLLOW_UP';
        }
        record.crm_status = status;

        // Rule 2: Allowed Data Source values
        const allowedSources = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
        let source = record.data_source ? String(record.data_source).trim().toLowerCase() : '';
        if (source && !allowedSources.includes(source)) {
          source = ''; // If none match confidently, leave blank
        }
        record.data_source = source;

        // Rule 3: Date Format
        let createdAt = record.created_at;
        try {
          if (!createdAt || isNaN(Date.parse(createdAt))) {
            createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
          } else {
            // Standardize format: YYYY-MM-DD HH:mm:ss
            const dateObj = new Date(createdAt);
            const pad = (num) => String(num).padStart(2, '0');
            createdAt = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
          }
        } catch (e) {
          createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
        }
        record.created_at = createdAt;

        successRecords.push(record);
      }
    }

    res.json({
      successRecords,
      skippedRecords,
      totalImported: successRecords.length,
      totalSkipped: skippedRecords.length
    });

  } catch (error) {
    console.error('Import processing error:', error);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}

module.exports = { importCSV };

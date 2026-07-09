const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const SYSTEM_PROMPT = `You are an expert data migration assistant for GrowEasy CRM.
Your task is to take a batch of raw records with arbitrary columns, map their fields, and extract them into a clean JSON array representing GrowEasy CRM leads.

Target Schema fields for each output record:
1. created_at (string): Lead creation date/time. MUST be in a format that JavaScript's 'new Date(created_at)' can parse successfully (e.g., 'YYYY-MM-DD HH:mm:ss'). If missing or invalid, use the current system date or try to parse from other date/timestamp fields.
2. name (string): Full name of the lead. If split across multiple columns (e.g., 'First Name', 'Last Name'), combine them.
3. email (string): Primary email address.
4. country_code (string): Country code (e.g., '+91', '+1'). Guess based on mobile prefix, country field, or default to '+91' if the country appears to be India.
5. mobile_without_country_code (string): Mobile number WITHOUT country code and without spaces, hyphens, or parentheses.
6. company (string): Company name.
7. city (string): City.
8. state (string): State.
9. country (string): Country.
10. lead_owner (string): Owner/assignee of the lead (usually an email address).
11. crm_status (string): Status of the lead. MUST be exactly one of: 'GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'. Map any raw status, disposition, or notes to these categories intelligently.
12. crm_note (string): Use for remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, or any other useful raw fields that do not fit into other specific fields.
13. data_source (string): Lead source. MUST be exactly one of: 'leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'. If none match confidently, leave it empty/blank.
14. possession_time (string): Property possession time (e.g., "Ready to move", "6 months", "1 year").
15. description (string): Additional description or raw row summary.

Strict Rules:
- CRITICAL: If a record contains neither an email nor a mobile number, you MUST skip it entirely (do not include it in the output array).
- If multiple email addresses are present, use the first as the primary 'email' field and append all other emails to 'crm_note'.
- If multiple mobile numbers are present, use the first as the primary 'mobile_without_country_code' (removing country code) and append all other numbers to 'crm_note'.
- Escaping: Ensure any line breaks in notes/descriptions are escaped as '\\n' so they remain compatible with a single CSV row.
- Output Format: You must output ONLY a valid JSON array of objects. Do not include any explanations, markdown headers, or wrap it in markdown code blocks like \`\`\`json.`;

/**
 * Calls Gemini API to process a batch of records.
 * @param {Array<Object>} batch 
 * @param {string} apiKey 
 * @returns {Promise<Array<Object>>}
 */
async function processWithGemini(batch, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  // We use gemini-1.5-flash as it supports JSON output and is highly cost-effective
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    }
  });

  const prompt = `Here is the batch of raw records to process:\n${JSON.stringify(batch, null, 2)}\n\nReturn the mapped and cleaned JSON array:`;
  
  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: prompt }
  ]);

  const responseText = result.response.text();
  try {
    return JSON.parse(responseText.trim());
  } catch (e) {
    console.error("Gemini failed to return valid JSON. Raw response:", responseText);
    throw new Error("Invalid JSON response from AI provider");
  }
}

/**
 * Calls OpenAI API to process a batch of records.
 * @param {Array<Object>} batch 
 * @param {string} apiKey 
 * @returns {Promise<Array<Object>>}
 */
async function processWithOpenAI(batch, apiKey) {
  const openai = new OpenAI({ apiKey });
  const prompt = `Here is the batch of raw records to process:\n${JSON.stringify(batch, null, 2)}\n\nReturn the mapped and cleaned JSON array:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  });

  const responseText = response.choices[0].message.content;
  try {
    const parsed = JSON.parse(responseText.trim());
    // Sometimes OpenAI wraps the array inside a key, check if there is an array inside
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.records && Array.isArray(parsed.records)) {
      return parsed.records;
    } else if (parsed.leads && Array.isArray(parsed.leads)) {
      return parsed.leads;
    } else {
      // Find the first array key
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) {
          return parsed[key];
        }
      }
      throw new Error("No array found in OpenAI response");
    }
  } catch (e) {
    console.error("OpenAI failed to return valid JSON. Raw response:", responseText);
    throw new Error("Invalid JSON response from AI provider");
  }
}

/**
 * Fallback mock mapper that simulates AI extraction logic deterministically.
 * @param {Array<Object>} batch 
 * @returns {Array<Object>}
 */
function processWithMock(batch) {
  return batch.map(row => {
    // Find name key
    const nameKey = Object.keys(row).find(k => /name/i.test(k)) || '';
    const nameVal = nameKey ? row[nameKey] : '';

    // Find email key
    const emailKey = Object.keys(row).find(k => /email|mail/i.test(k)) || '';
    const emailVal = emailKey ? row[emailKey] : '';

    // Find phone key
    const phoneKey = Object.keys(row).find(k => /phone|mobile|num|contact/i.test(k)) || '';
    let rawPhone = phoneKey ? String(row[phoneKey]) : '';
    
    // Simple extraction of country code and number
    let countryCode = '+91';
    let mobileNum = rawPhone.replace(/\D/g, ''); // strip non-digits
    if (mobileNum.length > 10) {
      if (mobileNum.startsWith('91')) {
        countryCode = '+91';
        mobileNum = mobileNum.substring(2);
      } else if (mobileNum.startsWith('1')) {
        countryCode = '+1';
        mobileNum = mobileNum.substring(1);
      } else {
        countryCode = '+' + mobileNum.substring(0, mobileNum.length - 10);
        mobileNum = mobileNum.substring(mobileNum.length - 10);
      }
    }

    // Find company
    const companyKey = Object.keys(row).find(k => /company|org/i.test(k)) || '';
    const companyVal = companyKey ? row[companyKey] : '';

    // Find location fields
    const cityKey = Object.keys(row).find(k => /city/i.test(k)) || '';
    const cityVal = cityKey ? row[cityKey] : '';
    const stateKey = Object.keys(row).find(k => /state/i.test(k)) || '';
    const stateVal = stateKey ? row[stateKey] : '';
    const countryKey = Object.keys(row).find(k => /country/i.test(k)) || '';
    const countryVal = countryKey ? row[countryKey] : '';

    // Find date
    const dateKey = Object.keys(row).find(k => /date|time|created/i.test(k)) || '';
    const dateVal = dateKey ? row[dateKey] : new Date().toISOString();

    // Find status/notes
    const statusKey = Object.keys(row).find(k => /status|disposition/i.test(k)) || '';
    const rawStatus = statusKey ? String(row[statusKey]).toUpperCase() : '';
    let crmStatus = 'GOOD_LEAD_FOLLOW_UP';
    if (rawStatus.includes('CONNECT')) crmStatus = 'DID_NOT_CONNECT';
    if (rawStatus.includes('BAD') || rawStatus.includes('NOT')) crmStatus = 'BAD_LEAD';
    if (rawStatus.includes('WON') || rawStatus.includes('SALE') || rawStatus.includes('CLOSE')) crmStatus = 'SALE_DONE';

    // Source mapping
    const sourceKey = Object.keys(row).find(k => /source/i.test(k)) || '';
    const rawSource = sourceKey ? String(row[sourceKey]).toLowerCase() : '';
    let dataSource = '';
    const allowedSources = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
    const matchedSource = allowedSources.find(src => rawSource.includes(src.replace('_', '')) || rawSource.includes(src));
    if (matchedSource) dataSource = matchedSource;

    // Collect all unused keys into notes
    const usedKeys = [nameKey, emailKey, phoneKey, companyKey, cityKey, stateKey, countryKey, dateKey, statusKey, sourceKey].filter(Boolean);
    const extraDetails = [];
    Object.keys(row).forEach(k => {
      if (!usedKeys.includes(k)) {
        extraDetails.push(`${k}: ${row[k]}`);
      }
    });

    return {
      created_at: dateVal,
      name: nameVal || 'Unknown Lead',
      email: emailVal,
      country_code: countryCode,
      mobile_without_country_code: mobileNum,
      company: companyVal,
      city: cityVal,
      state: stateVal,
      country: countryVal,
      lead_owner: 'system@groweasy.ai',
      crm_status: crmStatus,
      crm_note: extraDetails.join('; '),
      data_source: dataSource,
      possession_time: row.possession_time || row.Possession || '',
      description: row.description || row.Description || 'Mock Cleaned Record'
    };
  });
}

/**
 * Maps raw records to GrowEasy CRM records using the configured AI provider.
 * @param {Array<Object>} batch 
 * @returns {Promise<Array<Object>>}
 */
async function processBatch(batch) {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API Key is missing. Please set OPENAI_API_KEY in your env.");
    }
    return await processWithOpenAI(batch, apiKey);
  } else if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your env.");
    }
    return await processWithGemini(batch, apiKey);
  } else if (provider === 'mock') {
    // Return mock processed result instantly without external network calls
    return processWithMock(batch);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

module.exports = { processBatch };

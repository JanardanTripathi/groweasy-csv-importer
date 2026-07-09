const assert = require('assert');
const { parseCSV } = require('../utils/parser');

async function runTests() {
  console.log("--- Starting CSV Importer Backend Tests ---");

  // Test 1: Basic CSV Parsing
  try {
    const csvBuffer = Buffer.from(
      "name,email,phone,city\n" +
      "John Doe,john@example.com,9876543210,Mumbai\n" +
      "Sarah Connor,sarah@example.com,9876543211,Los Angeles"
    );
    const records = await parseCSV(csvBuffer);

    assert.strictEqual(records.length, 2, "Should parse exactly 2 records");
    assert.strictEqual(records[0].name, "John Doe", "First record name should match");
    assert.strictEqual(records[0].email, "john@example.com", "First record email should match");
    assert.strictEqual(records[0].phone, "9876543210", "First record phone should match");
    assert.strictEqual(records[0].city, "Mumbai", "First record city should match");
    assert.strictEqual(records[1].name, "Sarah Connor", "Second record name should match");
    
    console.log("✓ Test 1: Basic CSV Parsing - PASSED");
  } catch (err) {
    console.error("✗ Test 1: Basic CSV Parsing - FAILED");
    throw err;
  }

  // Test 2: CSV Parsing with BOM and Whitespace Trimming
  try {
    const csvBuffer = Buffer.from(
      "\uFEFFname , email , phone\n" +
      "  Alice Green  ,  alice@example.com  ,  123456  "
    );
    const records = await parseCSV(csvBuffer);

    assert.strictEqual(records.length, 1, "Should parse 1 record");
    assert.ok(records[0].hasOwnProperty('name'), "Should have trimmed header 'name'");
    assert.ok(records[0].hasOwnProperty('email'), "Should have trimmed header 'email'");
    assert.strictEqual(records[0].name, "Alice Green", "Should trim values");
    assert.strictEqual(records[0].email, "alice@example.com", "Should trim values");

    console.log("✓ Test 2: CSV Trimming and BOM Strip - PASSED");
  } catch (err) {
    console.error("✗ Test 2: CSV Trimming and BOM Strip - FAILED");
    throw err;
  }

  console.log("--- All tests passed successfully! ---");
}

runTests().catch(err => {
  console.error("Tests execution failed:", err);
  process.exit(1);
});

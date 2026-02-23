/**
 * Test cases for addressParser utility
 * Run these tests to verify the address parsing functionality
 */

import { extractStateAndZipcode, isValidZipcode, isValidStateAbbreviation } from './addressParser';

// Test cases
const testCases = [
    // Smarty autocomplete format
    {
        input: "123 W Main St, Springfield, KY 40069",
        expected: { state: "KY", zipcode: "40069" },
        description: "Smarty format with comma separators"
    },
    {
        input: "456 Oak Ave Apt 2B, Los Angeles, CA 90001",
        expected: { state: "CA", zipcode: "90001" },
        description: "Smarty format with apartment number"
    },
    {
        input: "789 Pine St, New York, NY 10001-1234",
        expected: { state: "NY", zipcode: "10001-1234" },
        description: "Smarty format with ZIP+4"
    },
    
    // Manual entry formats
    {
        input: "123 Main Street Springfield KY 40069",
        expected: { state: "KY", zipcode: "40069" },
        description: "No commas, space-separated"
    },
    {
        input: "456 Oak Avenue, Los Angeles CA 90001",
        expected: { state: "CA", zipcode: "90001" },
        description: "Mixed format with one comma"
    },
    {
        input: "789 Pine St New York NY 10001",
        expected: { state: "NY", zipcode: "10001" },
        description: "No commas, all spaces"
    },
    
    // Edge cases
    {
        input: "123 Main St, Springfield, Kentucky 40069",
        expected: { state: "", zipcode: "40069" },
        description: "Full state name (not abbreviation) - should extract zipcode only"
    },
    {
        input: "PO Box 123, Dallas, TX 75201",
        expected: { state: "TX", zipcode: "75201" },
        description: "PO Box address"
    },
    {
        input: "1600 Pennsylvania Avenue NW, Washington, DC 20500",
        expected: { state: "DC", zipcode: "20500" },
        description: "Washington DC address"
    },
    
    // Invalid/incomplete addresses
    {
        input: "123 Main Street",
        expected: { state: "", zipcode: "" },
        description: "No state or zipcode"
    },
    {
        input: "Springfield, KY",
        expected: { state: "KY", zipcode: "" },
        description: "State only, no zipcode"
    },
    {
        input: "40069",
        expected: { state: "", zipcode: "40069" },
        description: "Zipcode only"
    },
    {
        input: "",
        expected: { state: "", zipcode: "" },
        description: "Empty string"
    }
];

// Run tests
console.log("🧪 Running Address Parser Tests\n");

testCases.forEach((testCase, index) => {
    const result = extractStateAndZipcode(testCase.input);
    const passed = result.state === testCase.expected.state && result.zipcode === testCase.expected.zipcode;
    
    console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Description: ${testCase.description}`);
    console.log(`  Input: "${testCase.input}"`);
    console.log(`  Expected: state="${testCase.expected.state}", zipcode="${testCase.expected.zipcode}"`);
    console.log(`  Got:      state="${result.state}", zipcode="${result.zipcode}"`);
    console.log('');
});

// Test validation functions
console.log("\n🧪 Testing Validation Functions\n");

console.log("isValidZipcode tests:");
console.log(`  "40069" -> ${isValidZipcode("40069")} (expected: true)`);
console.log(`  "10001-1234" -> ${isValidZipcode("10001-1234")} (expected: true)`);
console.log(`  "1234" -> ${isValidZipcode("1234")} (expected: false)`);
console.log(`  "abcde" -> ${isValidZipcode("abcde")} (expected: false)`);

console.log("\nisValidStateAbbreviation tests:");
console.log(`  "KY" -> ${isValidStateAbbreviation("KY")} (expected: true)`);
console.log(`  "CA" -> ${isValidStateAbbreviation("CA")} (expected: true)`);
console.log(`  "XX" -> ${isValidStateAbbreviation("XX")} (expected: false)`);
console.log(`  "Kentucky" -> ${isValidStateAbbreviation("Kentucky")} (expected: false)`);

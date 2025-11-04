import { getCurrentFiscalYear } from '../utils/fiscalYear';

console.log('=== Fiscal Year Calculation Tests ===\n');

// Test data with expected results
const testCases = [
  { date: new Date('2024-10-27'), expected: 'FY24', description: 'Before FY25 start (Oct 28, 2024)' },
  { date: new Date('2024-10-28'), expected: 'FY25', description: 'FY25 starts (last Monday of Oct 2024)' },
  { date: new Date('2024-11-01'), expected: 'FY25', description: 'After FY25 start' },
  { date: new Date('2025-01-15'), expected: 'FY25', description: 'Middle of FY25' },
  { date: new Date('2025-10-26'), expected: 'FY25', description: 'Before FY26 start' },
  { date: new Date('2025-10-27'), expected: 'FY26', description: 'FY26 starts (last Monday of Oct 2025)' },
  { date: new Date('2025-11-03'), expected: 'FY26', description: 'After FY26 start (current date)' },
  { date: new Date('2026-01-15'), expected: 'FY26', description: 'Middle of FY26' },
];

let allPassed = true;

testCases.forEach(test => {
  const result = getCurrentFiscalYear(test.date);
  const passed = result === test.expected;
  const status = passed ? '✓' : '✗';

  if (!passed) allPassed = false;

  console.log(`${status} ${test.date.toISOString().split('T')[0]} -> ${result} (expected: ${test.expected}) - ${test.description}`);
});

console.log('\n=== Current Fiscal Year ===');
console.log(`Today (${new Date().toISOString().split('T')[0]}) -> ${getCurrentFiscalYear()}`);

console.log(`\n${allPassed ? '✓ All tests passed!' : '✗ Some tests failed'}`);

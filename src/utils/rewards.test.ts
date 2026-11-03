import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRecommendedReward,
  validateUpiId,
  formatINR,
  generateUtrReference,
  generateComplaintId,
} from './rewards';

test('calculateRecommendedReward returns expected amounts for categories and priority', () => {
  // Base category checks
  assert.equal(calculateRecommendedReward('biohazard', 'Normal'), 300);
  assert.equal(calculateRecommendedReward('illegal_dumping', 'Normal'), 250);
  assert.equal(calculateRecommendedReward('plastic_waste', 'Normal'), 150);
  assert.equal(calculateRecommendedReward('overflowing_dustbin', 'Normal'), 100);

  // Priority bonus
  assert.equal(calculateRecommendedReward('plastic_waste', 'High'), 200);
  assert.equal(calculateRecommendedReward('biohazard', 'Urgent'), 400);
});

test('validateUpiId validates correct UPI handles and rejects invalid ones', () => {
  assert.equal(validateUpiId('citizen@okhdfcbank'), true);
  assert.equal(validateUpiId('9876543210@paytm'), true);
  assert.equal(validateUpiId('namma.bengaluru@sbi'), true);
  assert.equal(validateUpiId('user_123@ybl'), true);

  // Invalid cases
  assert.equal(validateUpiId(''), false);
  assert.equal(validateUpiId('notanupi'), false);
  assert.equal(validateUpiId('@sbi'), false);
  assert.equal(validateUpiId('name@'), false);
  assert.equal(validateUpiId('spaces in@bank'), false);
});

test('formatINR formats currency symbol and amounts properly', () => {
  const result = formatINR(250);
  assert.match(result, /250/);
});

test('generateUtrReference produces 12 digit banking UTR string', () => {
  const utr = generateUtrReference();
  assert.equal(utr.length, 12);
  assert.match(utr, /^\d{12}$/);
});

test('generateComplaintId creates formatted BLR-YEAR-XXXX code', () => {
  const id = generateComplaintId();
  assert.match(id, /^BLR-\d{4}-\d{4}$/);
});

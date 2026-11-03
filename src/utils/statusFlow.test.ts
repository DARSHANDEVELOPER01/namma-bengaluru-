import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionStatus, getStepNumber, ORDERED_STATUSES } from './statusFlow';

test('getStepNumber returns correct 1-8 sequence', () => {
  assert.equal(getStepNumber('submitted'), 1);
  assert.equal(getStepNumber('under_review'), 2);
  assert.equal(getStepNumber('approved'), 3);
  assert.equal(getStepNumber('assigned'), 4);
  assert.equal(getStepNumber('cleaning_in_progress'), 5);
  assert.equal(getStepNumber('completed'), 6);
  assert.equal(getStepNumber('reward_approved'), 7);
  assert.equal(getStepNumber('reward_paid'), 8);
  assert.equal(getStepNumber('rejected'), 0);
});

test('citizen cannot transition statuses', () => {
  assert.equal(canTransitionStatus('submitted', 'approved', 'citizen'), false);
  assert.equal(canTransitionStatus('completed', 'reward_paid', 'citizen'), false);
});

test('field staff can only advance assigned to cleaning_in_progress and completed', () => {
  assert.equal(canTransitionStatus('assigned', 'cleaning_in_progress', 'field_staff'), true);
  assert.equal(canTransitionStatus('cleaning_in_progress', 'completed', 'field_staff'), true);
  // Staff cannot approve rewards or reject
  assert.equal(canTransitionStatus('completed', 'reward_approved', 'field_staff'), false);
  assert.equal(canTransitionStatus('submitted', 'approved', 'field_staff'), false);
});

test('admin can transition across progression steps', () => {
  assert.equal(canTransitionStatus('submitted', 'under_review', 'admin'), true);
  assert.equal(canTransitionStatus('under_review', 'approved', 'admin'), true);
  assert.equal(canTransitionStatus('completed', 'reward_approved', 'admin'), true);
  assert.equal(canTransitionStatus('reward_approved', 'reward_paid', 'admin'), true);
});

test('ordered statuses contains all 8 expected steps', () => {
  assert.equal(ORDERED_STATUSES.length, 8);
});

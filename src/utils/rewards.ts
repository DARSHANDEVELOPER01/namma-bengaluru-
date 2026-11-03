import { ComplaintCategory, PriorityLevel } from '../types';

/**
 * Calculates recommended reward amount in Indian Rupees (INR)
 * based on garbage severity, category hazard, and urgency level.
 */
export function calculateRecommendedReward(
  category: ComplaintCategory,
  priority: PriorityLevel = 'Normal'
): number {
  let baseAmount = 100;

  switch (category) {
    case 'biohazard':
      baseAmount = 300;
      break;
    case 'illegal_dumping':
      baseAmount = 250;
      break;
    case 'construction_debris':
      baseAmount = 200;
      break;
    case 'plastic_waste':
      baseAmount = 150;
      break;
    case 'electronic_waste':
      baseAmount = 150;
      break;
    case 'market_waste':
      baseAmount = 120;
      break;
    case 'overflowing_dustbin':
    default:
      baseAmount = 100;
      break;
  }

  // Priority multipliers
  if (priority === 'Urgent') {
    baseAmount += 100;
  } else if (priority === 'High') {
    baseAmount += 50;
  }

  return baseAmount;
}

/**
 * Validates format of standard Indian UPI IDs (e.g. name@bank, phone@upi)
 */
export function validateUpiId(upiId: string): boolean {
  if (!upiId || typeof upiId !== 'string') return false;
  const trimmed = upiId.trim();
  // Standard pattern: 3-50 chars, alphanumeric with dots/hyphens before @, alphanumeric after @
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z0-9]{2,30}$/;
  return upiRegex.test(trimmed);
}

/**
 * Formats a number to Indian Rupees format (e.g., ₹250)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates a realistic 12-digit Indian Banking UPI UTR reference number
 */
export function generateUtrReference(): string {
  const prefix = Math.floor(4000 + Math.random() * 5999).toString();
  const suffix = Math.floor(10000000 + Math.random() * 89999999).toString();
  return `${prefix}${suffix}`;
}

/**
 * Generates a unique BBMP Complaint ID (e.g., BLR-2026-8472)
 */
export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BLR-${year}-${randomNum}`;
}

import { ComplaintStatus, UserRole } from '../types';

export const ORDERED_STATUSES: ComplaintStatus[] = [
  'submitted',
  'under_review',
  'approved',
  'assigned',
  'cleaning_in_progress',
  'completed',
  'reward_approved',
  'reward_paid',
];

export interface StatusMeta {
  step: number;
  labelEn: string;
  labelKn: string;
  descriptionEn: string;
  descriptionKn: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const STATUS_META_MAP: Record<ComplaintStatus, StatusMeta> = {
  submitted: {
    step: 1,
    labelEn: 'Submitted',
    labelKn: 'ಸಲ್ಲಿಸಲಾಗಿದೆ',
    descriptionEn: 'Report submitted by citizen with GPS location and photo.',
    descriptionKn: 'ಜಿಪಿಎಸ್ ಸ್ಥಳ ಮತ್ತು ಫೋಟೋದೊಂದಿಗೆ ನಾಗರಿಕರಿಂದ ವರದಿ ಸಲ್ಲಿಕೆ.',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
  },
  under_review: {
    step: 2,
    labelEn: 'Under Review',
    labelKn: 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
    descriptionEn: 'BBMP Admin is verifying photo authenticity and location.',
    descriptionKn: 'ಬಿಬಿಎಂಪಿ ಅಧಿಕಾರಿಗಳು ಫೋಟೋ ನೈಜತೆ ಮತ್ತು ಸ್ಥಳ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದಾರೆ.',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
  },
  approved: {
    step: 3,
    labelEn: 'Approved',
    labelKn: 'ಅನುಮೋದಿಸಲಾಗಿದೆ',
    descriptionEn: 'Complaint approved as genuine public nuisance.',
    descriptionKn: 'ದೂರು ಅಧಿಕೃತವೆಂದು ದೃಢೀಕರಿಸಿ ಅನುಮೋದಿಸಲಾಗಿದೆ.',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
  },
  assigned: {
    step: 4,
    labelEn: 'Assigned to Field Staff',
    labelKn: 'ಸಿಬ್ಬಂದಿಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ',
    descriptionEn: 'Assigned to Ward Marshals / Field Cleaning team.',
    descriptionKn: 'ವಾರ್ಡ್ ಮಾರ್ಷಲ್ಸ್ / ಸ್ವಚ್ಛತಾ ಸಿಬ್ಬಂದಿಗೆ ವಹಿಸಲಾಗಿದೆ.',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
  },
  cleaning_in_progress: {
    step: 5,
    labelEn: 'Cleaning in Progress',
    labelKn: 'ಸ್ವಚ್ಛತೆ ನಡೆಯುತ್ತಿದೆ',
    descriptionEn: 'Field team is currently clearing and sanitizing the spot.',
    descriptionKn: 'ಸ್ಥಳದಲ್ಲಿ ಕಸ ವಿಲೇವಾರಿ ಮತ್ತು ಸ್ವಚ್ಛತಾ ಕಾರ್ಯ ನಡೆಯುತ್ತಿದೆ.',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
  },
  completed: {
    step: 6,
    labelEn: 'Completed',
    labelKn: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    descriptionEn: 'Site cleared. Field staff uploaded after-cleaning proof.',
    descriptionKn: 'ಸ್ಥಳ ಸ್ವಚ್ಛಗೊಳಿಸಿ, ನಂತರದ ಫೋಟೋ ದಾಖಲಿಸಲಾಗಿದೆ.',
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-400',
    badgeBorder: 'border-teal-500/30',
  },
  reward_approved: {
    step: 7,
    labelEn: 'Reward Approved',
    labelKn: 'ಬಹುಮಾನ ಅನುಮೋದನೆ',
    descriptionEn: 'Admin approved reward payout for citizen vigilance.',
    descriptionKn: 'ನಾಗರಿಕರ ಶ್ರಮಕ್ಕೆ ಬಹುಮಾನದ ಮೊತ್ತ ಅನುಮೋದಿಸಲಾಗಿದೆ.',
    badgeBg: 'bg-yellow-500/10',
    badgeText: 'text-yellow-400',
    badgeBorder: 'border-yellow-500/30',
  },
  reward_paid: {
    step: 8,
    labelEn: 'Reward Paid',
    labelKn: 'ಬಹುಮಾನ ಪಾವತಿಸಲಾಗಿದೆ',
    descriptionEn: 'Reward transferred directly to citizen UPI ID with UTR ref.',
    descriptionKn: 'ಯುಪಿಐ ಮೂಲಕ ನೇರವಾಗಿ ನಾಗರಿಕ ಖಾತೆಗೆ ಹಣ ಜಮೆಯಾಗಿದೆ.',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-400/40',
  },
  rejected: {
    step: 0,
    labelEn: 'Rejected',
    labelKn: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
    descriptionEn: 'Report rejected due to duplicate or invalid image/location.',
    descriptionKn: 'ಅಮಾನ್ಯ ಅಥವಾ ನಕಲು ಮಾಹಿತಿಯಿಂದ ದೂರು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
  },
};

/**
 * Validates if a user role can perform state transition
 */
export function canTransitionStatus(
  currentStatus: ComplaintStatus,
  nextStatus: ComplaintStatus,
  role: UserRole
): boolean {
  if (currentStatus === nextStatus) return true;
  if (currentStatus === 'rejected' || currentStatus === 'reward_paid') return false;

  // Citizens can only submit or view; they cannot change status directly
  if (role === 'citizen') {
    return false;
  }

  // Field Staff can only move:
  // - assigned -> cleaning_in_progress
  // - cleaning_in_progress -> completed (requires after photo)
  if (role === 'field_staff') {
    if (currentStatus === 'assigned' && nextStatus === 'cleaning_in_progress') return true;
    if (currentStatus === 'cleaning_in_progress' && nextStatus === 'completed') return true;
    return false;
  }

  // Admin has authority over all transitions:
  if (role === 'admin') {
    // Admin can reject at review/submitted/assigned
    if (nextStatus === 'rejected') {
      return ['submitted', 'under_review', 'approved', 'assigned'].includes(currentStatus);
    }
    // Progression validations
    if (currentStatus === 'submitted' && (nextStatus === 'under_review' || nextStatus === 'approved')) return true;
    if (currentStatus === 'under_review' && (nextStatus === 'approved' || nextStatus === 'assigned')) return true;
    if (currentStatus === 'approved' && nextStatus === 'assigned') return true;
    if (currentStatus === 'completed' && nextStatus === 'reward_approved') return true;
    if (currentStatus === 'reward_approved' && nextStatus === 'reward_paid') return true;
    // Allow admin overrides if needed
    return true;
  }

  return false;
}

export function getStepNumber(status: ComplaintStatus): number {
  return STATUS_META_MAP[status]?.step ?? 1;
}

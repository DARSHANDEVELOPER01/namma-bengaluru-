export type UserRole = 'admin' | 'citizen' | 'field_staff';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  ward?: string;
  zone?: string;
  upiId?: string;
  avatarUrl?: string;
  createdAt: string;
  active?: boolean;
}

export type ComplaintCategory =
  | 'plastic_waste'
  | 'overflowing_dustbin'
  | 'construction_debris'
  | 'illegal_dumping'
  | 'market_waste'
  | 'biohazard'
  | 'electronic_waste';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'assigned'
  | 'cleaning_in_progress'
  | 'completed'
  | 'reward_approved'
  | 'reward_paid'
  | 'rejected';

export type PriorityLevel = 'Normal' | 'High' | 'Urgent';

export type RewardStatus = 'none' | 'pending' | 'approved' | 'processing' | 'paid' | 'failed' | 'rejected';

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
  address: string;
  ward: string;
  zone: string;
  landmark?: string;
}

export interface Complaint {
  id: string; // e.g. BLR-2026-1042
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  citizenUpi?: string;
  category: ComplaintCategory;
  description: string;
  location: LocationCoords;
  photoBefore: string;
  photoAfter?: string;
  photoCleaning?: string;
  status: ComplaintStatus;
  priority: PriorityLevel;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
  cleaningNotes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  rewardAmount?: number;
  rewardStatus?: RewardStatus;
  payoutMethod?: 'PhonePe' | 'Google Pay' | 'BHIM UPI' | 'Direct Bank Transfer';
  payoutTransactionRef?: string;
  payoutTimestamp?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface RewardRecord {
  id: string;
  complaintId: string;
  citizenId: string;
  citizenName: string;
  amount: number;
  upiId: string;
  paymentMethod: string;
  transactionRef: string;
  status: RewardStatus;
  paidAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  titleKn: string;
  message: string;
  messageKn: string;
  date: string;
  priority: 'info' | 'alert' | 'event';
}

export interface AppNotification {
  id: string;
  userId?: string;
  targetRole?: UserRole | 'all';
  title: string;
  titleKn: string;
  message: string;
  messageKn: string;
  timestamp: string;
  read: boolean;
  complaintId?: string;
  type?: 'report' | 'cleaning' | 'reward' | 'announcement';
}

export type Language = 'en' | 'kn';

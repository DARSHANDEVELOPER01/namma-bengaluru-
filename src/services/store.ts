import {
  User,
  Complaint,
  RewardRecord,
  Announcement,
  AppNotification,
  UserRole,
} from '../types';

const USERS_KEY = 'namma_blr_users';
const COMPLAINTS_KEY = 'namma_blr_complaints';
const REWARDS_KEY = 'namma_blr_rewards';
const ANNOUNCEMENTS_KEY = 'namma_blr_announcements';
const NOTIFICATIONS_KEY = 'namma_blr_notifications';
const ACTIVE_USER_KEY = 'namma_blr_active_user';

// High quality photo assets for garbage spots & cleaned spots
const PHOTOS = {
  garbage1: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80', // Plastic waste on roadside
  garbage2: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80', // Overflowing bin
  garbage3: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80', // Construction debris
  garbage4: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=800&q=80', // Roadside dump
  cleaned1: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', // Clean paved street with trees
  cleaned2: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80', // Pristine green roadside park
};

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-1',
    role: 'admin',
    name: 'Dr. Srinivas Murthy (IAS)',
    email: 'admin@bbmp.gov.in',
    phone: '9845000001',
    ward: 'BBMP Head Office',
    zone: 'BBMP Central Command',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-10T09:00:00Z',
    active: true,
  },
  {
    id: 'usr-citizen-1',
    role: 'citizen',
    name: 'Team Rockers',
    email: 'citizen@gmail.com',
    phone: '9845012345',
    ward: 'Ward 112 - Domlur / Indiranagar',
    zone: 'East Zone',
    upiId: 'teamrockers@okhdfcbank',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-02-15T10:30:00Z',
    active: true,
  },
  {
    id: 'usr-staff-1',
    role: 'field_staff',
    name: 'Ramesh Gowda',
    email: 'staff@bbmp.gov.in',
    phone: '9900112233',
    ward: 'Ward 80 - Hoysala Nagar / Indiranagar',
    zone: 'East Zone Marshal Unit #14',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-20T08:00:00Z',
    active: true,
  },
  {
    id: 'usr-staff-2',
    role: 'field_staff',
    name: 'Suresh Kumar',
    email: 'staff2@bbmp.gov.in',
    phone: '9945112244',
    ward: 'Ward 151 - Koramangala',
    zone: 'South Zone Marshal Unit #09',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-22T08:00:00Z',
    active: true,
  },
];

const DEFAULT_COMPLAINTS: Complaint[] = [
  {
    id: 'BLR-2026-1042',
    citizenId: 'usr-citizen-1',
    citizenName: 'Team Rockers',
    citizenPhone: '9845012345',
    citizenUpi: 'teamrockers@okhdfcbank',
    category: 'plastic_waste',
    description: 'Huge accumulation of single-use plastic cups, plates, and bags scattered near the metro pillar exit.',
    location: {
      lat: 12.9784,
      lng: 77.6408,
      address: '100 Feet Road, Near Indiranagar Metro Station, Bengaluru 560038',
      ward: 'Ward 112 - Domlur',
      zone: 'East Zone',
      landmark: 'Next to Metro Pillar 42, near Toit corner',
    },
    photoBefore: PHOTOS.garbage1,
    photoAfter: PHOTOS.cleaned1,
    status: 'reward_paid',
    priority: 'High',
    assignedStaffId: 'usr-staff-1',
    assignedStaffName: 'Ramesh Gowda',
    assignedStaffPhone: '9900112233',
    cleaningNotes: 'Entire footpath sweeped and disinfected. 4 sacks of plastic sent to dry waste collection centre (DWCC).',
    adminNotes: 'Verified genuine report. Fast response by Indiranagar unit. Citizen reward authorized.',
    rewardAmount: 200,
    rewardStatus: 'paid',
    payoutMethod: 'Google Pay',
    payoutTransactionRef: '439201982736',
    payoutTimestamp: '2026-11-01T14:35:00Z',
    createdAt: '2026-10-31T09:15:00Z',
    updatedAt: '2026-11-01T14:35:00Z',
    completedAt: '2026-10-31T17:20:00Z',
  },
  {
    id: 'BLR-2026-1088',
    citizenId: 'usr-citizen-1',
    citizenName: 'Team Rockers',
    citizenPhone: '9845012345',
    citizenUpi: 'teamrockers@okhdfcbank',
    category: 'overflowing_dustbin',
    description: 'Community dustbin overflowing with domestic garbage onto the pedestrian sidewalk, emitting foul smell.',
    location: {
      lat: 12.9352,
      lng: 77.6245,
      address: '5th Block, Koramangala, Bengaluru 560095',
      ward: 'Ward 151 - Koramangala',
      zone: 'South Zone',
      landmark: 'Opposite Jyoti Nivas College Road cross',
    },
    photoBefore: PHOTOS.garbage2,
    photoAfter: PHOTOS.cleaned2,
    status: 'completed',
    priority: 'Urgent',
    assignedStaffId: 'usr-staff-2',
    assignedStaffName: 'Suresh Kumar',
    assignedStaffPhone: '9945112244',
    cleaningNotes: 'Dustbin completely emptied by auto-tipper. Area washed with bleaching powder.',
    adminNotes: 'Under reward verification step.',
    rewardAmount: 200,
    rewardStatus: 'approved',
    createdAt: '2026-11-02T11:00:00Z',
    updatedAt: '2026-11-02T16:45:00Z',
    completedAt: '2026-11-02T16:30:00Z',
  },
  {
    id: 'BLR-2026-1120',
    citizenId: 'usr-citizen-1',
    citizenName: 'Team Rockers',
    citizenPhone: '9845012345',
    citizenUpi: 'teamrockers@okhdfcbank',
    category: 'construction_debris',
    description: 'Heavy concrete rubble and broken tiles dumped on the stormwater drain curb blocking water flow.',
    location: {
      lat: 12.9767,
      lng: 77.5713,
      address: 'Subhash Nagar, Majestic Bus Stand Road, Bengaluru 560009',
      ward: 'Ward 94 - Gandhi Nagar',
      zone: 'West Zone',
      landmark: 'Near Majestic Sangam theatre back road',
    },
    photoBefore: PHOTOS.garbage3,
    status: 'cleaning_in_progress',
    priority: 'High',
    assignedStaffId: 'usr-staff-1',
    assignedStaffName: 'Ramesh Gowda',
    assignedStaffPhone: '9900112233',
    cleaningNotes: 'JCB mini excavator deployed to lift concrete debris.',
    adminNotes: 'High priority task assigned to East/Central team.',
    rewardAmount: 250,
    rewardStatus: 'pending',
    createdAt: '2026-11-02T15:20:00Z',
    updatedAt: '2026-11-03T07:10:00Z',
  },
  {
    id: 'BLR-2026-1155',
    citizenId: 'usr-citizen-1',
    citizenName: 'Team Rockers',
    citizenPhone: '9845012345',
    citizenUpi: 'teamrockers@okhdfcbank',
    category: 'illegal_dumping',
    description: 'Vehicle dumped mixed waste bags in empty plot overnight near residential layout.',
    location: {
      lat: 13.0068,
      lng: 77.5684,
      address: '8th Cross, Margosa Road, Malleshwaram, Bengaluru 560003',
      ward: 'Ward 45 - Malleshwaram',
      zone: 'North Zone',
      landmark: 'Behind Canara Union Ground',
    },
    photoBefore: PHOTOS.garbage4,
    status: 'under_review',
    priority: 'Normal',
    adminNotes: 'Admin verifying CCTV nearby for black spot offenders.',
    createdAt: '2026-11-03T06:30:00Z',
    updatedAt: '2026-11-03T06:30:00Z',
  },
];

const DEFAULT_REWARDS: RewardRecord[] = [
  {
    id: 'RWD-2026-901',
    complaintId: 'BLR-2026-1042',
    citizenId: 'usr-citizen-1',
    citizenName: 'Team Rockers',
    amount: 200,
    upiId: 'teamrockers@okhdfcbank',
    paymentMethod: 'Google Pay UPI',
    transactionRef: '439201982736',
    status: 'paid',
    paidAt: '2026-11-01T14:35:00Z',
  },
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'BBMP Mega Weekend Plogging Drive at Lalbagh & Cubbon Park',
    titleKn: 'ಲಾಲ್‌ಬಾಗ್ ಮತ್ತು ಕಬ್ಬನ್ ಪಾರ್ಕ್‌ನಲ್ಲಿ ಬಿಬಿಎಂಪಿ ಮಹಾ ವಾರಾಂತ್ಯ ಪ್ಲಾಗಿಂಗ್ ಡ್ರೈವ್',
    message: 'Join BBMP Marshals and youth volunteers for a clean city drive. Citizens submitting valid waste reports receive on-spot recognition and UPI rewards.',
    messageKn: 'ನಮ್ಮ ಬೆಂಗಳೂರು ಸ್ವಚ್ಛತಾ ಅಭಿಯಾನದಲ್ಲಿ ಭಾಗವಹಿಸಿ. ವರದಿ ಸಲ್ಲಿಸುವ ನಾಗರಿಕರಿಗೆ ತಕ್ಷಣದ ಬಹುಮಾನ ಮತ್ತು ಪ್ರಶಂಸಾ ಪತ್ರ.',
    date: '2026-11-02',
    priority: 'event',
  },
  {
    id: 'ann-2',
    title: 'Zero Tolerance for Night Garbage Dumping (Penalty up to ₹5,000)',
    titleKn: 'ರಾತ್ರಿ ವೇಳೆ ರಸ್ತೆಯಲ್ಲಿ ಕಸ ಎಸೆಯುವವರಿಗೆ ₹5,000 ವರೆಗೆ ದಂಡ ವಿಧಿಸಲಾಗುವುದು',
    message: 'CCTV surveillance activated at 250 black spots across Bengaluru. Citizens reporting illegal dumpers with geo-tagged photos will receive a ₹300 reward.',
    messageKn: 'ಬೆಂಗಳೂರಿನ 250 ಕಪ್ಪು ಸ್ಥಳಗಳಲ್ಲಿ ಸಿಸಿಟಿವಿ ಅಳವಡಿಸಲಾಗಿದೆ. ಅಕ್ರಮವಾಗಿ ಕಸ ಎಸೆಯುವವರ ಬಗ್ಗೆ ಮಾಹಿತಿ ನೀಡಿದವರಿಗೆ ₹300 ಬಹುಮಾನ.',
    date: '2026-10-28',
    priority: 'alert',
  },
  {
    id: 'ann-3',
    title: 'Mandatory 3-Way Waste Segregation in Apartments & Commercial Hubs',
    titleKn: 'ಅಪಾರ್ಟ್‌ಮೆಂಟ್‌ಗಳು ಮತ್ತು ವಾಣಿಜ್ಯ ಸಂಸ್ಥೆಗಳಲ್ಲಿ 3-ವಿಧದ ತ್ಯಾಜ್ಯ ವಿಂಗಡಣೆ ಕಡ್ಡಾಯ',
    message: 'Wet, Dry, and Sanitary waste must be handed over in separate colour-coded bins to BBMP compactors.',
    messageKn: 'ಹಸಿ, ಒಣ ಮತ್ತು ನೈರ್ಮಲ್ಯ ತ್ಯಾಜ್ಯವನ್ನು ಪ್ರತ್ಯೇಕ ಬಣ್ಣದ ಕಸದ ಬುಟ್ಟಿಗಳಲ್ಲಿ ಬಿಬಿಎಂಪಿ ವಾಹನಗಳಿಗೆ ನೀಡಬೇಕು.',
    date: '2026-10-20',
    priority: 'info',
  },
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'usr-citizen-1',
    title: 'Reward of ₹200 Paid to UPI!',
    titleKn: '₹200 ಬಹುಮಾನ ನಿಮ್ಮ ಯುಪಿಐ ಖಾತೆಗೆ ಜಮೆಯಾಗಿದೆ!',
    message: 'Your report BLR-2026-1042 was cleared and ₹200 was credited to teamrockers@okhdfcbank (UTR #439201982736).',
    messageKn: 'ನಿಮ್ಮ ವರದಿ BLR-2026-1042 ಸ್ವಚ್ಛಗೊಳಿಸಿ, ₹200 ಮೊತ್ತವನ್ನು ಜಮೆ ಮಾಡಲಾಗಿದೆ.',
    timestamp: '2026-11-01T14:35:00Z',
    read: false,
    complaintId: 'BLR-2026-1042',
    type: 'reward',
  },
  {
    id: 'notif-2',
    userId: 'usr-citizen-1',
    title: 'Cleaning In Progress: BLR-2026-1120',
    titleKn: 'ಸ್ವಚ್ಛತೆ ನಡೆಯುತ್ತಿದೆ: BLR-2026-1120',
    message: 'Marshal Ramesh Gowda has initiated cleanup at Subhash Nagar, Majestic.',
    messageKn: 'ಮಾರ್ಷಲ್ ರಮೇಶ್ ಗೌಡ ಅವರು ಮೆಜೆಸ್ಟಿಕ್‌ನಲ್ಲಿ ಸ್ವಚ್ಛತಾ ಕಾರ್ಯ ಪ್ರಾರಂಭಿಸಿದ್ದಾರೆ.',
    timestamp: '2026-11-03T07:10:00Z',
    read: true,
    complaintId: 'BLR-2026-1120',
    type: 'cleaning',
  },
];

export const Store = {
  // Users
  getUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  },

  saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getActiveUser(): User | null {
    const data = localStorage.getItem(ACTIVE_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setActiveUser(user: User | null) {
    if (user) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  },

  // Complaints
  getComplaints(): Complaint[] {
    const data = localStorage.getItem(COMPLAINTS_KEY);
    if (!data) {
      localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(DEFAULT_COMPLAINTS));
      return DEFAULT_COMPLAINTS;
    }
    return JSON.parse(data);
  },

  saveComplaints(complaints: Complaint[]) {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  },

  addComplaint(complaint: Complaint) {
    const list = this.getComplaints();
    const updated = [complaint, ...list];
    this.saveComplaints(updated);

    // Add admin notification
    this.addNotification({
      id: `notif-${Date.now()}`,
      targetRole: 'admin',
      title: `New Report: ${complaint.id}`,
      titleKn: `ಹೊಸ ಕಸದ ವರದಿ: ${complaint.id}`,
      message: `${complaint.category} reported at ${complaint.location.address}`,
      messageKn: `${complaint.location.address} ನಲ್ಲಿ ಕಸದ ವರದಿ ದಾಖಲಾಗಿದೆ`,
      timestamp: new Date().toISOString(),
      read: false,
      complaintId: complaint.id,
      type: 'report',
    });

    return updated;
  },

  updateComplaint(id: string, updates: Partial<Complaint>): Complaint | null {
    const list = this.getComplaints();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveComplaints(list);
    return updated;
  },

  // Rewards
  getRewards(): RewardRecord[] {
    const data = localStorage.getItem(REWARDS_KEY);
    if (!data) {
      localStorage.setItem(REWARDS_KEY, JSON.stringify(DEFAULT_REWARDS));
      return DEFAULT_REWARDS;
    }
    return JSON.parse(data);
  },

  addReward(reward: RewardRecord) {
    const list = this.getRewards();
    const updated = [reward, ...list];
    localStorage.setItem(REWARDS_KEY, JSON.stringify(updated));
    return updated;
  },

  // Announcements
  getAnnouncements(): Announcement[] {
    const data = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (!data) {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
      return DEFAULT_ANNOUNCEMENTS;
    }
    return JSON.parse(data);
  },

  addAnnouncement(ann: Announcement) {
    const list = this.getAnnouncements();
    const updated = [ann, ...list];
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteAnnouncement(id: string) {
    const list = this.getAnnouncements().filter((a) => a.id !== id);
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list));
    return list;
  },

  // Notifications
  getNotifications(): AppNotification[] {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(data);
  },

  addNotification(notif: AppNotification) {
    const list = this.getNotifications();
    const updated = [notif, ...list];
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return updated;
  },

  markNotificationsRead(userId?: string) {
    const list = this.getNotifications().map((n) => {
      if (!userId || n.userId === userId || n.targetRole) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
    return list;
  },

  // Reset to initial seed state
  resetData() {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(DEFAULT_COMPLAINTS));
    localStorage.setItem(REWARDS_KEY, JSON.stringify(DEFAULT_REWARDS));
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
    localStorage.removeItem(ACTIVE_USER_KEY);
  },
};

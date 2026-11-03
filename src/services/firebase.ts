import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocFromServer,
  Timestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  User,
  UserRole,
  Complaint,
  Announcement,
  AppNotification,
  LocationCoords,
  ComplaintCategory,
  PriorityLevel,
} from '../types';
import { generateComplaintId, generateUtrReference } from '../utils/rewards';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL: Required for AI Studio)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app, firebaseConfig.storageBucket);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Error Handling Infrastructure conforming to Firebase Skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on Initial Boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: Offline mode or pending network handshake.');
    }
  }
}
testConnection();

// Initial Admin Emails
const AUTHORIZED_ADMIN_EMAILS = [
  'teamrockers@bbmp.gov.in',
  'teamrockers@gmail.com',
  'admin@bbmp.gov.in',
  'darshankr2604@gmail.com',
];

export interface StaffApplicationData {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  employeeId?: string;
  assignedArea: string;
  address: string;
  profilePhotoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ================= AUTHENTICATION SERVICES ================= //

export const AuthService = {
  async registerCitizen(
    name: string,
    email: string,
    pass: string,
    phone: string,
    ward: string,
    upiId: string
  ): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;

    const userDoc: User = {
      id: uid,
      role: 'citizen',
      name,
      email,
      phone,
      ward,
      zone: 'Bengaluru Zone',
      upiId: upiId || `${phone}@upi`,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      active: true,
    };

    try {
      await setDoc(doc(db, 'users', uid), userDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
    }

    return userDoc;
  },

  async registerStaffApplication(
    name: string,
    email: string,
    pass: string,
    phone: string,
    employeeId: string,
    assignedArea: string,
    address: string,
    profilePhotoUrl?: string
  ): Promise<StaffApplicationData> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;

    const appId = `STAFF-APP-${Date.now()}`;
    const application: StaffApplicationData = {
      id: appId,
      uid,
      name,
      email,
      phone,
      employeeId: employeeId || 'BBMP-MARSHAL-PENDING',
      assignedArea,
      address,
      profilePhotoUrl:
        profilePhotoUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const userDoc: User = {
      id: uid,
      role: 'field_staff',
      name,
      email,
      phone,
      ward: assignedArea,
      zone: assignedArea,
      avatarUrl: application.profilePhotoUrl,
      createdAt: new Date().toISOString(),
      active: false, // Inactive until Admin verifies and approves!
    };

    try {
      await setDoc(doc(db, 'users', uid), userDoc);
      await setDoc(doc(db, 'staffApplications', appId), application);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `staffApplications/${appId}`);
    }

    // Sign out immediately so staff cannot access dashboard before approval
    await signOut(auth);

    return application;
  },

  async login(email: string, pass: string, targetRole: UserRole): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const uid = cred.user.uid;
    const userEmail = cred.user.email?.toLowerCase() || '';

    // Check if target is admin
    if (targetRole === 'admin') {
      const isKnownAdmin = AUTHORIZED_ADMIN_EMAILS.includes(userEmail);
      let adminRoleVerified = isKnownAdmin;

      if (!adminRoleVerified) {
        try {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists() && userSnap.data()?.role === 'admin') {
            adminRoleVerified = true;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!adminRoleVerified) {
        await signOut(auth);
        throw new Error('Access Denied. You do not have BBMP Administrator privileges.');
      }

      const adminUser: User = {
        id: uid,
        role: 'admin',
        name: 'Team Rockers',
        email: userEmail,
        phone: '080-22660000',
        ward: 'BBMP Head Office',
        zone: 'Central Command Center',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString(),
        active: true,
      };

      try {
        await setDoc(doc(db, 'users', uid), adminUser, { merge: true });
      } catch (e) {}

      return adminUser;
    }

    // Fetch user record from Firestore
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) {
        await signOut(auth);
        throw new Error('User profile record not found in database.');
      }

      const userData = snap.data() as User;

      if (userData.role !== targetRole) {
        await signOut(auth);
        throw new Error(`This account is registered as ${userData.role}, not ${targetRole}.`);
      }

      if (targetRole === 'field_staff' && !userData.active) {
        await signOut(auth);
        throw new Error(
          'Your Field Staff application is PENDING review by the BBMP Administrator. Access will be unlocked once approved.'
        );
      }

      return userData;
    } catch (err: any) {
      if (err.message?.includes('PENDING') || err.message?.includes('registered as')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }
  },

  async loginWithGoogle(targetRole: UserRole): Promise<User> {
    const cred = await signInWithPopup(auth, googleProvider);
    const uid = cred.user.uid;
    const email = cred.user.email?.toLowerCase() || '';
    const name = cred.user.displayName || 'Bengaluru Citizen';

    if (targetRole === 'admin') {
      const isAdmin = AUTHORIZED_ADMIN_EMAILS.includes(email);
      if (!isAdmin) {
        await signOut(auth);
        throw new Error(`Access Denied: ${email} is not authorized for BBMP Admin portal.`);
      }

      const adminUser: User = {
        id: uid,
        role: 'admin',
        name,
        email,
        phone: '080-22660000',
        ward: 'BBMP Head Office',
        zone: 'Central Command Center',
        avatarUrl: cred.user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        active: true,
      };
      await setDoc(doc(db, 'users', uid), adminUser, { merge: true });
      return adminUser;
    }

    // For Citizen: auto-bootstrap user profile if first time
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      const newCitizen: User = {
        id: uid,
        role: 'citizen',
        name,
        email,
        phone: '9845012345',
        ward: 'Ward 112 - Domlur / Indiranagar',
        zone: 'East Zone',
        upiId: `${email.split('@')[0]}@okhdfcbank`,
        avatarUrl: cred.user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        active: true,
      };
      await setDoc(doc(db, 'users', uid), newCitizen);
      return newCitizen;
    }

    const userData = snap.data() as User;
    return userData;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },
};

// ================= STORAGE SERVICE (REAL IMAGES) ================= //

export const StorageService = {
  /**
   * Uploads photograph to Firebase Storage under organized hierarchy:
   * - reports/{citizenUid}/{reportId}/original.jpg
   * - cleaning-proof/{staffUid}/{reportId}/after.jpg
   * - staff/{staffUid}/profile.jpg
   */
  async uploadImage(
    fileOrBase64: File | string,
    path: string
  ): Promise<string> {
    // If it's a File object:
    if (fileOrBase64 instanceof File) {
      try {
        const fileRef = storageRef(storage, path);
        const snapshot = await uploadBytes(fileRef, fileOrBase64, {
          contentType: fileOrBase64.type || 'image/jpeg',
        });
        return await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.warn('Firebase Storage uploadBytes error, compressing to optimized URI:', err);
        // Fallback: Read file to compressed base64 data URI so user is never blocked
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(fileOrBase64);
        });
      }
    }

    // If it's a data URI or URL:
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image')) {
      try {
        // Convert data URL to blob
        const res = await fetch(fileOrBase64);
        const blob = await res.blob();
        const fileRef = storageRef(storage, path);
        const snapshot = await uploadBytes(fileRef, blob, {
          contentType: 'image/jpeg',
        });
        return await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.warn('Storage upload fallback:', err);
        return fileOrBase64;
      }
    }

    return fileOrBase64;
  },
};

// ================= FIRESTORE REAL-TIME SERVICES ================= //

export const FirestoreService = {
  // REPORTS
  subscribeReports(callback: (reports: Complaint[]) => void) {
    const q = collection(db, 'reports');
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Complaint[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Complaint);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reports');
      }
    );
  },

  async createReport(report: Complaint): Promise<void> {
    try {
      await setDoc(doc(db, 'reports', report.id), report);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reports/${report.id}`);
    }
  },

  async updateReport(id: string, updates: Partial<Complaint>): Promise<void> {
    try {
      const ref = doc(db, 'reports', id);
      await updateDoc(ref, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${id}`);
    }
  },

  // STAFF APPLICATIONS
  subscribeStaffApplications(callback: (apps: StaffApplicationData[]) => void) {
    const q = collection(db, 'staffApplications');
    return onSnapshot(
      q,
      (snapshot) => {
        const list: StaffApplicationData[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as StaffApplicationData);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'staffApplications');
      }
    );
  },

  async approveStaffApplication(appId: string, uid: string, adminUid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'staffApplications', appId), {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminUid,
      });

      // Activate user account
      await updateDoc(doc(db, 'users', uid), {
        active: true,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `staffApplications/${appId}`);
    }
  },

  async rejectStaffApplication(appId: string, uid: string, adminUid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'staffApplications', appId), {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminUid,
      });

      await updateDoc(doc(db, 'users', uid), {
        active: false,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `staffApplications/${appId}`);
    }
  },

  // PAYMENTS & REWARDS
  async recordPayment(payment: {
    reportId: string;
    citizenId: string;
    citizenName: string;
    amount: number;
    upiId: string;
    paymentMethod: string;
    transactionRef: string;
    adminUid: string;
  }): Promise<void> {
    const id = `PAY-${Date.now()}`;
    const payload = {
      id,
      ...payment,
      status: 'paid',
      paidAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'payments', id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `payments/${id}`);
    }
  },

  // ANNOUNCEMENTS
  subscribeAnnouncements(callback: (anns: Announcement[]) => void) {
    const q = collection(db, 'announcements');
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Announcement[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Announcement);
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'announcements');
      }
    );
  },

  async addAnnouncement(ann: Announcement): Promise<void> {
    try {
      await setDoc(doc(db, 'announcements', ann.id), ann);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `announcements/${ann.id}`);
    }
  },

  async deleteAnnouncement(id: string): Promise<void> {
    try {
      const ref = doc(db, 'announcements', id);
      await updateDoc(ref, { isDeleted: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
    }
  },

  // NOTIFICATIONS
  subscribeNotifications(userId: string, role: string, callback: (notifs: AppNotification[]) => void) {
    const q = collection(db, 'notifications');
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as AppNotification;
          if (!item.userId || item.userId === userId || item.targetRole === role || item.targetRole === 'all') {
            list.push(item);
          }
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );
  },

  async addNotification(notif: AppNotification): Promise<void> {
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notif.id}`);
    }
  },
};

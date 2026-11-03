/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Complaint, Announcement, AppNotification, Language } from './types';
import {
  auth,
  db,
  AuthService,
  FirestoreService,
  StaffApplicationData,
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import AuthPortal from './components/AuthPortal';
import KarnatakaHeaderBanner from './components/KarnatakaHeaderBanner';
import CitizenDashboard from './components/CitizenDashboard';
import AdminDashboard from './components/AdminDashboard';
import FieldStaffDashboard from './components/FieldStaffDashboard';
import AboutModal from './components/AboutModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [staffApplications, setStaffApplications] = useState<StaffApplicationData[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [focusComplaintId, setFocusComplaintId] = useState<string | null>(null);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as User;
            if (data.role === 'admin') {
              data.name = 'Team Rockers';
            }
            setCurrentUser(data);
          } else if (
            fbUser.email === 'darshankr2604@gmail.com' ||
            fbUser.email === 'admin@bbmp.gov.in' ||
            fbUser.email === 'teamrockers@bbmp.gov.in' ||
            fbUser.email === 'teamrockers@gmail.com'
          ) {
            // Bootstrapped Administrator
            const adminUser: User = {
              id: fbUser.uid,
              role: 'admin',
              name: 'Team Rockers',
              email: fbUser.email,
              phone: '080-22660000',
              ward: 'BBMP Head Office',
              zone: 'Central Command Room',
              avatarUrl: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
              active: true,
            };
            setCurrentUser(adminUser);
          }
        } catch (e) {
          console.warn('Error reading user profile on auth state change:', e);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthInitializing(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore Listeners - ONLY when user is authenticated
  useEffect(() => {
    // Public Announcements can be read by anyone
    const unsubAnnouncements = FirestoreService.subscribeAnnouncements((data) => {
      setAnnouncements(data);
    });

    if (!currentUser) {
      setComplaints([]);
      setUsersList([]);
      setStaffApplications([]);
      setNotifications([]);
      return () => {
        unsubAnnouncements();
      };
    }

    // Reports stream (authenticated users)
    const unsubReports = FirestoreService.subscribeReports((data) => {
      setComplaints(data);
    });

    // Admin-only streams
    let unsubUsers = () => {};
    let unsubStaffApps = () => {};

    if (currentUser.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const uList: User[] = [];
        snap.forEach((d) => uList.push(d.data() as User));
        setUsersList(uList);
      }, (err) => console.warn('Users list permission:', err));

      unsubStaffApps = FirestoreService.subscribeStaffApplications((data) => {
        setStaffApplications(data);
      });
    }

    // Notifications stream
    const unsubNotifs = FirestoreService.subscribeNotifications(
      currentUser.id,
      currentUser.role,
      (data) => {
        setNotifications(data);
      }
    );

    return () => {
      unsubAnnouncements();
      unsubReports();
      unsubUsers();
      unsubStaffApps();
      unsubNotifs();
    };
  }, [currentUser]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    setFocusComplaintId(null);
  };

  // Complaint Operations (Real Firestore)
  const handleSubmitComplaint = async (complaint: Complaint) => {
    await FirestoreService.createReport(complaint);
    // Add notification for admin
    await FirestoreService.addNotification({
      id: `notif-${Date.now()}`,
      targetRole: 'admin',
      title: `New Report: ${complaint.id}`,
      titleKn: `ಹೊಸ ಕಸದ ವರದಿ: ${complaint.id}`,
      message: `${complaint.category.replace(/_/g, ' ')} reported at ${complaint.location.address}`,
      messageKn: `${complaint.location.address} ನಲ್ಲಿ ಕಸದ ವರದಿ ದಾಖಲಾಗಿದೆ`,
      timestamp: new Date().toISOString(),
      read: false,
      complaintId: complaint.id,
      type: 'report',
    });
  };

  const handleUpdateComplaint = async (id: string, updates: Partial<Complaint>) => {
    await FirestoreService.updateReport(id, updates);
  };

  // Staff Applications Management
  const handleApproveStaffApp = async (appId: string, uid: string) => {
    if (!currentUser) return;
    await FirestoreService.approveStaffApplication(appId, uid, currentUser.id);
  };

  const handleRejectStaffApp = async (appId: string, uid: string) => {
    if (!currentUser) return;
    await FirestoreService.rejectStaffApplication(appId, uid, currentUser.id);
  };

  // Announcements Management
  const handleAddAnnouncement = async (ann: Announcement) => {
    await FirestoreService.addAnnouncement(ann);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await FirestoreService.deleteAnnouncement(id);
  };

  // Notifications
  const handleAddNotification = async (notif: AppNotification) => {
    await FirestoreService.addNotification(notif);
  };

  // Payment Recording
  const handleRecordPayment = async (payment: {
    reportId: string;
    citizenId: string;
    citizenName: string;
    amount: number;
    upiId: string;
    paymentMethod: string;
    transactionRef: string;
    adminUid: string;
  }) => {
    await FirestoreService.recordPayment(payment);
  };

  // If Firebase Auth is initializing
  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-amber-300">
          Connecting to Namma Bengaluru Firebase Cloud Platform...
        </p>
      </div>
    );
  }

  // If user is not authenticated: MUST display ONLY the Gateway Portal
  if (!currentUser) {
    return (
      <>
        <AuthPortal
          language={language}
          onLanguageChange={setLanguage}
          onLoginSuccess={handleLoginSuccess}
          onOpenAboutModal={() => setShowAboutModal(true)}
        />
        {showAboutModal && (
          <AboutModal language={language} onClose={() => setShowAboutModal(false)} />
        )}
      </>
    );
  }

  // Once authenticated: Render Role-specific Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <KarnatakaHeaderBanner
        user={currentUser}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationsRead={() => {}}
        onOpenAboutModal={() => setShowAboutModal(true)}
        onViewComplaintFromNotif={(id) => setFocusComplaintId(id)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'citizen' && (
          <CitizenDashboard
            user={currentUser}
            language={language}
            complaints={complaints}
            onSubmitComplaint={handleSubmitComplaint}
            onUpdateUser={(updates) => setCurrentUser({ ...currentUser, ...updates })}
            focusComplaintId={focusComplaintId}
          />
        )}

        {currentUser.role === 'admin' && (
          <AdminDashboard
            user={currentUser}
            language={language}
            complaints={complaints}
            users={usersList}
            staffApplications={staffApplications}
            announcements={announcements}
            onUpdateComplaint={handleUpdateComplaint}
            onApproveStaffApp={handleApproveStaffApp}
            onRejectStaffApp={handleRejectStaffApp}
            onAddAnnouncement={handleAddAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {currentUser.role === 'field_staff' && (
          <FieldStaffDashboard
            user={currentUser}
            language={language}
            complaints={complaints}
            onUpdateComplaint={handleUpdateComplaint}
            onAddNotification={handleAddNotification}
          />
        )}
      </main>

      {showAboutModal && (
        <AboutModal language={language} onClose={() => setShowAboutModal(false)} />
      )}

      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {language === 'kn'
              ? '© 2026 ಬೃಹತ್ ಬೆಂಗಳೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ (ಬಿಬಿಎಂಪಿ). ನಮ್ಮ ಬೆಂಗಳೂರು ಸ್ವಚ್ಛತಾ ಮಿಷನ್.'
              : '© 2026 Bruhat Bengaluru Mahanagara Palike (BBMP). Powered by Cloud Firestore & Firebase Auth.'}
          </span>
          <div className="flex items-center space-x-3 text-amber-400 font-medium">
            <span>24x7 Helpline: 1533</span>
            <span>•</span>
            <span>Control Room: 080-22660000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

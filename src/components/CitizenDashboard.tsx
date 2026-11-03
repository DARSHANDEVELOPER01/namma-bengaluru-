import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Complaint,
  ComplaintCategory,
  LocationCoords,
  Language,
} from '../types';
import { getTranslation } from '../utils/i18n';
import {
  calculateRecommendedReward,
  formatINR,
  generateComplaintId,
  validateUpiId,
} from '../utils/rewards';
import { STATUS_META_MAP, ORDERED_STATUSES } from '../utils/statusFlow';
import BengaluruMap from './BengaluruMap';
import { StorageService } from '../services/firebase';
import {
  Camera,
  Upload,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  PlusCircle,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  ExternalLink,
  Award,
  Sparkles,
  Info,
  X,
  Navigation,
} from 'lucide-react';

interface Props {
  user: User;
  language: Language;
  complaints: Complaint[];
  onSubmitComplaint: (complaint: Complaint) => Promise<void>;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  focusComplaintId?: string | null;
}

export default function CitizenDashboard({
  user,
  language,
  complaints,
  onSubmitComplaint,
  onUpdateUser,
  focusComplaintId = null,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'new_report' | 'my_reports' | 'rewards' | 'map'>('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    focusComplaintId ? complaints.find((c) => c.id === focusComplaintId) || null : null
  );

  // New Report Form State
  const [category, setCategory] = useState<ComplaintCategory>('plastic_waste');
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');

  // Location Coordinates (with GPS accuracy)
  const [location, setLocation] = useState<LocationCoords>({
    lat: 12.9716,
    lng: 77.5946,
    accuracy: 15,
    address: 'Bengaluru Central, Karnataka',
    ward: user.ward || 'Ward 112 - Domlur / Indiranagar',
    zone: 'Bengaluru Urban',
    landmark: '',
  });

  // Profile / UPI state
  const [upiInput, setUpiInput] = useState(user.upiId || '');
  const [upiSavedMsg, setUpiSavedMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = getTranslation(language);

  // Filter complaints for this citizen (real UID from Firebase)
  const myComplaints = complaints.filter((c) => c.citizenId === user.id);

  // Stats calculation from live complaints
  const totalReportsCount = myComplaints.length;
  const cleanedCount = myComplaints.filter(
    (c) => c.status === 'completed' || c.status === 'reward_approved' || c.status === 'reward_paid'
  ).length;
  const totalEarnedAmount = myComplaints
    .filter((c) => c.rewardStatus === 'paid')
    .reduce((acc, c) => acc + (c.rewardAmount || 0), 0);
  const pendingRewardsAmount = myComplaints
    .filter((c) => c.rewardStatus === 'approved' || c.rewardStatus === 'processing')
    .reduce((acc, c) => acc + (c.rewardAmount || 0), 0);

  // 1. LIVE BROWSER GPS GEOLOCATION WITH ACCURACY
  const handleDetectLiveGps = () => {
    setIsDetectingGps(true);
    setGpsError('');
    setGpsSuccessMsg('');

    if (!navigator.geolocation) {
      setGpsError(language === 'kn' ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಜಿಪಿಎಸ್ ಬೆಂಬಲವಿಲ್ಲ' : 'Geolocation is not supported by your browser.');
      setIsDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCoords: LocationCoords = {
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5)),
          accuracy: Number(accuracy.toFixed(1)),
          address: `GPS Pin: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E, Bengaluru (±${Math.round(accuracy)}m)`,
          ward: user.ward || 'Ward 112 - Indiranagar',
          zone: 'Bengaluru Smart Zone',
          landmark: landmark || 'Live Citizen Device GPS Lock',
        };
        setLocation(newCoords);
        setIsDetectingGps(false);
        setGpsSuccessMsg(
          language === 'kn'
            ? `ಜಿಪಿಎಸ್ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (ನಿಖರತೆ: ±${Math.round(accuracy)}m)`
            : `Live GPS Locked: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (Accuracy: ±${Math.round(accuracy)} meters)`
        );
      },
      (error) => {
        setIsDetectingGps(false);
        console.warn('GPS detection failed, fallback active:', error);
        setGpsError(
          language === 'kn'
            ? 'ಜಿಪಿಎಸ್ ಅನುಮತಿ ಸಿಗಲಿಲ್ಲ. ನಕ್ಷೆಯಲ್ಲಿ ಸ್ಥಳ ಗುರುತಿಸಿ.'
            : 'GPS permission denied or timeout. Please tap directly on the map to pin your location.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // 2. Camera Stream Handler
  const startCamera = async () => {
    try {
      setIsCapturingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setIsCapturingCamera(false);
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const capturePhotoFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoPreview(dataUrl);
      setSelectedFile(null); // Captured from camera
    }
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setIsCapturingCamera(false);
  };

  const cancelCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCapturingCamera(false);
  };

  // 3. File upload handler with validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setFormError('Image size exceeds 20MB limit. Please choose a smaller file.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  // 4. REAL SUBMIT TO FIREBASE STORAGE & FIRESTORE
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!photoPreview && !selectedFile) {
      setFormError(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ಕಸದ ಛಾಯಾಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Please upload or capture a real garbage photograph.'
      );
      return;
    }

    if (!description.trim()) {
      setFormError(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ವಿವರಣೆ ನಮೂದಿಸಿ' : 'Please provide a brief description of the issue.'
      );
      return;
    }

    setIsSubmitting(true);
    setUploadStatusMsg('Uploading photograph to Firebase Storage...');

    try {
      const newId = generateComplaintId();
      const storagePath = `reports/${user.id}/${newId}/original.jpg`;

      // Upload to Firebase Storage
      const uploadedPhotoUrl = await StorageService.uploadImage(
        selectedFile || photoPreview,
        storagePath
      );

      setUploadStatusMsg('Saving report to Cloud Firestore...');

      const recommendedAmount = calculateRecommendedReward(category, 'Normal');

      const newComplaint: Complaint = {
        id: newId,
        citizenId: user.id,
        citizenName: user.name,
        citizenPhone: user.phone,
        citizenUpi: user.upiId || 'citizen@upi',
        category,
        description: description.trim(),
        location: {
          ...location,
          landmark: landmark.trim() || 'Near roadside curb',
        },
        photoBefore: uploadedPhotoUrl,
        status: 'submitted',
        priority: 'Normal',
        rewardAmount: recommendedAmount,
        rewardStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSubmitComplaint(newComplaint);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#dc2626', '#10b981'],
        });
      } catch (e) {}

      setDescription('');
      setLandmark('');
      setPhotoPreview('');
      setSelectedFile(null);
      setSelectedComplaint(newComplaint);
      setActiveTab('my_reports');
    } catch (err: any) {
      console.error('Failed to submit report to Firebase:', err);
      setFormError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadStatusMsg('');
    }
  };

  // 5. Save UPI ID
  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUpiId(upiInput)) {
      setUpiSavedMsg(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯ ಯುಪಿಐ ಐಡಿ ನಮೂದಿಸಿ (ಉದಾ: name@okhdfcbank)' : 'Please enter a valid UPI address (e.g. name@okhdfcbank).'
      );
      return;
    }

    onUpdateUser({ upiId: upiInput.trim() });
    setUpiSavedMsg(
      language === 'kn' ? 'ಯುಪಿಐ ಐಡಿ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' : 'UPI Address successfully updated for reward payouts!'
    );
    setTimeout(() => setUpiSavedMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Citizen Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-red-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.citizenWelcome}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {user.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.ward}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 font-mono text-xs">UPI: {user.upiId || 'Not linked'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('new_report')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm btn-3d shadow-lg shadow-amber-500/20 flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.navNewReport}</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="glass-card rounded-2xl p-4 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">{t.totalEarned}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {formatINR(totalEarnedAmount)}
            </div>
            <span className="text-[10px] text-slate-400">Paid to UPI Wallet</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">{t.pendingRewards}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              {formatINR(pendingRewardsAmount)}
            </div>
            <span className="text-[10px] text-slate-400">Awaiting Admin Release</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">{t.reportsSubmitted}</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-400 mt-2">
              {totalReportsCount}
            </div>
            <span className="text-[10px] text-slate-400">Saved in Firestore</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-teal-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">{t.cleanedSpots}</span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-teal-400 mt-2">
              {cleanedCount}
            </div>
            <span className="text-[10px] text-slate-400">Cleaned & Verified</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {t.navDashboard}
        </button>
        <button
          onClick={() => setActiveTab('new_report')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'new_report'
              ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{t.navNewReport}</span>
        </button>
        <button
          onClick={() => setActiveTab('my_reports')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'my_reports'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {t.navMyReports} ({myComplaints.length})
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'rewards'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{t.navRewards}</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'map'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{t.navMap}</span>
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {language === 'kn' ? 'ನಿಮ್ಮ ಸುತ್ತಲಿನ ಕಸ ಅಥವಾ ಕಪ್ಪು ಸ್ಥಳ ಕಂಡಿತೇ?' : 'Spotted a Garbage Dump in Bengaluru?'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {language === 'kn'
                    ? 'ತಕ್ಷಣ ಫೋಟೋ ತೆಗೆದು ಜಿಪಿಎಸ್ ಮೂಲಕ ಸಲ್ಲಿಸಿ. ಸ್ವಚ್ಛತೆ ದೃಢೀಕರಿಸಿದ ನಂತರ ನಿಮ್ಮ ಯುಪಿಐ ಖಾತೆಗೆ ನೇರವಾಗಿ ಬಹುಮಾನ ಜಮೆಯಾಗುತ್ತದೆ!'
                    : 'Capture genuine photo evidence and live GPS. Once cleared by Field Marshals and verified by BBMP, receive instant cash rewards in your UPI account.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('new_report')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm btn-3d shadow-lg shadow-emerald-500/20 whitespace-nowrap self-start sm:self-auto"
            >
              + {t.submitReport}
            </button>
          </div>

          {/* Recent Reports List */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {language === 'kn' ? 'ನನ್ನ ಇತ್ತೀಚಿನ ದೂರುಗಳು' : 'Your Submitted Reports'}
              </h3>
              <button
                onClick={() => setActiveTab('my_reports')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>{language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ' : 'View All'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {myComplaints.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No reports submitted yet. Tap &ldquo;Report Waste&rdquo; to submit your first report with real GPS!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myComplaints.slice(0, 4).map((c) => {
                  const meta = STATUS_META_MAP[c.status];
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedComplaint(c);
                        setActiveTab('my_reports');
                      }}
                      className="glass-card glass-card-hover rounded-2xl p-4 border border-slate-800 cursor-pointer flex space-x-3.5"
                    >
                      <img
                        src={c.photoBefore}
                        alt="Garbage report"
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-slate-700"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                            >
                              {language === 'kn' ? meta.labelKn : meta.labelEn}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white mt-1 truncate">
                            {c.category.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span>{c.location.address}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          {c.rewardAmount && (
                            <span className="text-emerald-400 font-bold">
                              {formatINR(c.rewardAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: UPLOAD REAL GARBAGE REPORT ================= */}
      {activeTab === 'new_report' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/20 max-w-4xl mx-auto shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Camera className="w-6 h-6 text-amber-400" />
              <span>{t.uploadGarbagePhoto}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Capture a clear, real photograph of the garbage nuisance and lock your live GPS location.
            </p>
          </div>

          {formError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center space-x-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {uploadStatusMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/50 flex items-center space-x-2 text-xs text-amber-200">
              <Clock className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
              <span>{uploadStatusMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitComplaint} className="space-y-6">
            {/* 1. REAL CAMERA / GALLERY UPLOAD */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                1. {t.uploadGarbagePhoto} * (Stored in Firebase Storage: reports/{user.id}/.../original.jpg)
              </label>

              {isCapturingCamera ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500 bg-black aspect-video max-w-lg mx-auto flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-4">
                    <button
                      type="button"
                      onClick={capturePhotoFromVideo}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{language === 'kn' ? 'ಕ್ಯಾಪ್ಚರ್ ಮಾಡಿ' : 'Capture Snap'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelCamera}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-900 max-w-md mx-auto aspect-video">
                  <img src={photoPreview} alt="Captured garbage" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview('');
                      setSelectedFile(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-red-400 hover:text-white"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Real Photograph Ready for Cloud Upload</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl glass-card border border-dashed border-amber-500/40 hover:border-amber-400/80 hover:bg-slate-800/60 transition group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white">{t.cameraCapture}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Device Camera (Live Viewfinder)</span>
                  </button>

                  <label className="flex flex-col items-center justify-center p-6 rounded-2xl glass-card border border-dashed border-slate-700 hover:border-emerald-500/60 hover:bg-slate-800/60 transition group cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white">{t.galleryUpload}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP (Max 20MB)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 2. REAL BROWSER GPS GEOLOCATION & GOOGLE/LEAFLET MAP */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  2. {t.gpsCoordinates} * (Browser Geolocation API)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleDetectLiveGps}
                    disabled={isDetectingGps}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isDetectingGps ? 'Locking GPS...' : t.detectGpsBtn}</span>
                  </button>
                </div>
              </div>

              {gpsSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{gpsSuccessMsg}</span>
                </div>
              )}
              {gpsError && (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Interactive Pin-Drop Leaflet Map */}
              <BengaluruMap
                selectedLocation={location}
                onSelectLocation={(newLoc) => setLocation(newLoc)}
                interactiveSelectMode={true}
                height="280px"
                zoom={14}
                language={language}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Latitude & Longitude
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${location.lat}° N, ${location.lng}° E`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    GPS Accuracy
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={location.accuracy ? `±${location.accuracy} meters` : 'High Precision'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    BBMP Ward / Area
                  </label>
                  <input
                    type="text"
                    value={location.ward}
                    onChange={(e) => setLocation({ ...location, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. CATEGORY & LANDMARK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                  3. {t.garbageCategory} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="plastic_waste">{t.cat_plastic_waste}</option>
                  <option value="overflowing_dustbin">{t.cat_overflowing_dustbin}</option>
                  <option value="construction_debris">{t.cat_construction_debris}</option>
                  <option value="illegal_dumping">{t.cat_illegal_dumping}</option>
                  <option value="market_waste">{t.cat_market_waste}</option>
                  <option value="biohazard">{t.cat_biohazard}</option>
                  <option value="electronic_waste">{t.cat_electronic_waste}</option>
                </select>
                <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
                  Official BBMP Reward Scale: {formatINR(calculateRecommendedReward(category, 'Normal'))}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                  4. {t.landmark}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Metro Pillar 42, near signal"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 5. Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                5. {t.description} *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe garbage pile, foul smell, pedestrian obstruction or recurring night dumping..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Linked UPI Preview */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'kn' ? 'ಬಹುಮಾನ ಜಮೆ ಯುಪಿಐ:' : 'Verified Payout Account:'}{' '}
                  <strong>{user.upiId || `${user.email} (Update in Wallet tab)`}</strong>
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-950 font-black text-sm btn-3d shadow-xl shadow-amber-500/20 transition flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Submitting to Cloud Firestore & Storage...</span>
              ) : (
                <>
                  <Award className="w-5 h-5 text-slate-950" />
                  <span>{t.submitReport}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 3: MY REPORTS & 8-STAGE TRACKING ================= */}
      {activeTab === 'my_reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t.navMyReports}</h2>
              <p className="text-xs text-slate-300">Live complaint tracker synchronized with Cloud Firestore.</p>
            </div>
            <button
              onClick={() => setActiveTab('new_report')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs btn-3d self-start sm:self-auto"
            >
              + {t.navNewReport}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports List */}
            <div className="lg:col-span-1 space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {myComplaints.length === 0 ? (
                <div className="p-6 rounded-2xl glass-card text-center text-xs text-slate-400">
                  No complaints submitted yet. Tap &ldquo;Report Waste&rdquo; to submit.
                </div>
              ) : (
                myComplaints.map((c) => {
                  const meta = STATUS_META_MAP[c.status];
                  const isSelected = selectedComplaint?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaint(c)}
                      className={`p-4 rounded-2xl glass-card cursor-pointer transition border ${
                        isSelected
                          ? 'border-amber-400 bg-slate-800/90 shadow-lg'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-amber-400">{c.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                        >
                          {language === 'kn' ? meta.labelKn : meta.labelEn}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-2 truncate">
                        {c.category.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.location.address}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        {c.rewardAmount && (
                          <span className="text-emerald-400 font-bold">
                            Reward: {formatINR(c.rewardAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Complaint Detail & 8-Step Timeline */}
            <div className="lg:col-span-2">
              {selectedComplaint ? (
                <div className="glass-panel rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black font-mono text-amber-400">{selectedComplaint.id}</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            STATUS_META_MAP[selectedComplaint.status].badgeBg
                          } ${STATUS_META_MAP[selectedComplaint.status].badgeText} ${
                            STATUS_META_MAP[selectedComplaint.status].badgeBorder
                          }`}
                        >
                          {language === 'kn'
                            ? STATUS_META_MAP[selectedComplaint.status].labelKn
                            : STATUS_META_MAP[selectedComplaint.status].labelEn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Recorded on {new Date(selectedComplaint.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedComplaint.location.lat},${selectedComplaint.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-amber-300 font-medium flex items-center space-x-1.5 self-start"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.openGoogleMaps}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* 8-Step Visual Timeline */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                      Complaint Resolution & Reward Progression
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ORDERED_STATUSES.map((st, idx) => {
                        const meta = STATUS_META_MAP[st];
                        const currentIndex = ORDERED_STATUSES.indexOf(selectedComplaint.status);
                        const isPast = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;

                        return (
                          <div
                            key={st}
                            className={`p-2.5 rounded-xl border transition ${
                              isCurrent
                                ? 'bg-amber-500/20 border-amber-400 shadow-md'
                                : isPast
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-slate-900/60 border-slate-800 opacity-60'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                                  isPast ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className={isCurrent ? 'text-amber-300' : isPast ? 'text-emerald-300' : 'text-slate-400'}>
                                {language === 'kn' ? meta.labelKn : meta.labelEn}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Before and After Proof Photographs */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Photograph Verification Proof
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-rose-400">
                          {language === 'kn' ? 'ಸ್ವಚ್ಛತೆಗೆ ಮುನ್ನ (ವರದಿ)' : 'Before Cleaning (Citizen Upload)'}
                        </span>
                        <img
                          src={selectedComplaint.photoBefore}
                          alt="Before cleaning"
                          className="w-full h-44 rounded-2xl object-cover border border-rose-500/30 shadow-md"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-emerald-400">
                          {language === 'kn' ? 'ಸ್ವಚ್ಛತೆಯ ನಂತರ (ಕ್ಷೇತ್ರ ಸಿಬ್ಬಂದಿ ಪುರಾವೆ)' : 'After Cleaning (Marshal Proof)'}
                        </span>
                        {selectedComplaint.photoAfter ? (
                          <img
                            src={selectedComplaint.photoAfter}
                            alt="After cleaning proof"
                            className="w-full h-44 rounded-2xl object-cover border border-emerald-500/40 shadow-md"
                          />
                        ) : (
                          <div className="w-full h-44 rounded-2xl bg-slate-900/90 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                            <Clock className="w-6 h-6 mb-1 text-amber-500 animate-pulse" />
                            <span>Cleaning work in progress</span>
                            <span className="text-[10px] text-slate-600">Field staff will upload after-photo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location & Details Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/70 rounded-2xl p-4 border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Location / Address:</span>
                      <span className="font-semibold text-white">{selectedComplaint.location.address}</span>
                      <span className="text-[11px] text-amber-400 block mt-0.5">
                        Landmark: {selectedComplaint.location.landmark || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Ward Marshal:</span>
                      <span className="font-semibold text-white">
                        {selectedComplaint.assignedStaffName || 'BBMP Marshal Assignment Pending'}
                      </span>
                      {selectedComplaint.assignedStaffPhone && (
                        <span className="text-[11px] text-slate-300 block">
                          Phone: +91 {selectedComplaint.assignedStaffPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reward Card */}
                  {selectedComplaint.rewardAmount && (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Award className="w-4 h-4" />
                          Citizen Reward Status
                        </span>
                        <div className="text-xl font-black text-emerald-300 mt-1">
                          {formatINR(selectedComplaint.rewardAmount)}
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {selectedComplaint.rewardStatus === 'paid'
                            ? `Transferred to UPI: ${selectedComplaint.citizenUpi || user.upiId} • Bank UTR: ${
                                selectedComplaint.payoutTransactionRef || 'Verified'
                              }`
                            : 'Reward approved by BBMP Admin. Will be disbursed directly to UPI upon final site closure.'}
                        </p>
                      </div>

                      {selectedComplaint.rewardStatus === 'paid' && (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md">
                          ✓ PAID & VERIFIED
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 glass-panel rounded-3xl text-center text-slate-400 text-xs">
                  Select a complaint from the list to track live progress and view photos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: REWARDS & UPI WALLET ================= */}
      {activeTab === 'rewards' && (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
          {/* UPI Address Management Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{t.upiWalletTitle}</h3>
                <p className="text-xs text-slate-300">{t.upiSetupNotice}</p>
              </div>
            </div>

            {upiSavedMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{upiSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveUpi} className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                required
                placeholder="e.g. 9845012345@paytm or yourname@okhdfcbank"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm btn-3d shadow-lg shadow-emerald-500/20"
              >
                {t.saveUpi}
              </button>
            </form>
          </div>

          {/* Reward Payout History Table */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>{t.transactionHistory}</span>
            </h3>

            {myComplaints.filter((c) => c.rewardAmount).length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No rewards recorded yet. Submit verified reports to earn money!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Complaint ID</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Reward Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Bank UTR Ref</th>
                      <th className="py-3 px-4">Payout Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {myComplaints
                      .filter((c) => c.rewardAmount)
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                          <td className="py-3.5 px-4 text-white font-medium">
                            {c.category.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-400">
                            {formatINR(c.rewardAmount || 0)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                c.rewardStatus === 'paid'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              }`}
                            >
                              {c.rewardStatus || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {c.payoutTransactionRef || 'Pending Release'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{c.payoutMethod || 'PhonePe / GPay'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: SMART CITY MAP ================= */}
      {activeTab === 'map' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t.navMap}</h2>
              <p className="text-xs text-slate-300">
                Live Bengaluru map showing reported waste spots across wards (Green: Cleaned, Yellow: In progress, Red: Reported)
              </p>
            </div>
          </div>

          <BengaluruMap complaints={complaints} height="520px" zoom={12} language={language} />
        </div>
      )}
    </div>
  );
}

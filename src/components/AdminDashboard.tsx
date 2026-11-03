import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Complaint,
  ComplaintStatus,
  Language,
  Announcement,
} from '../types';
import { getTranslation } from '../utils/i18n';
import { formatINR, generateUtrReference } from '../utils/rewards';
import { STATUS_META_MAP } from '../utils/statusFlow';
import BengaluruMap from './BengaluruMap';
import { StaffApplicationData } from '../services/firebase';
import {
  Shield,
  Users,
  HardHat,
  FileText,
  Clock,
  CheckCircle2,
  CreditCard,
  DollarSign,
  MapPin,
  ChevronRight,
  Search,
  Check,
  X,
  UserCheck,
  Download,
  Megaphone,
  UserX,
  FileCheck,
  ExternalLink,
} from 'lucide-react';

interface Props {
  user: User;
  language: Language;
  complaints: Complaint[];
  users: User[];
  staffApplications: StaffApplicationData[];
  announcements: Announcement[];
  onUpdateComplaint: (id: string, updates: Partial<Complaint>) => Promise<void>;
  onApproveStaffApp: (appId: string, uid: string) => Promise<void>;
  onRejectStaffApp: (appId: string, uid: string) => Promise<void>;
  onAddAnnouncement: (ann: Announcement) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onRecordPayment: (payment: {
    reportId: string;
    citizenId: string;
    citizenName: string;
    amount: number;
    upiId: string;
    paymentMethod: string;
    transactionRef: string;
    adminUid: string;
  }) => Promise<void>;
}

export default function AdminDashboard({
  user,
  language,
  complaints,
  users,
  staffApplications,
  announcements,
  onUpdateComplaint,
  onApproveStaffApp,
  onRejectStaffApp,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onRecordPayment,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'staff_applications' | 'payouts' | 'roster' | 'announcements' | 'map'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Action Console
  const [assignStaffId, setAssignStaffId] = useState('');
  const [customRewardAmount, setCustomRewardAmount] = useState<number>(200);
  const [manualUtrInput, setManualUtrInput] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'PhonePe' | 'Google Pay' | 'BHIM UPI'>('PhonePe');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annTitleKn, setAnnTitleKn] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annMessageKn, setAnnMessageKn] = useState('');
  const [annPriority, setAnnPriority] = useState<'info' | 'alert' | 'event'>('info');

  const t = getTranslation(language);

  // Field Staff List (Active only)
  const activeFieldStaff = users.filter((u) => u.role === 'field_staff' && u.active);
  const citizenUsers = users.filter((u) => u.role === 'citizen');

  // Live Firestore KPI Stats
  const totalCitizensCount = citizenUsers.length;
  const totalFieldStaffCount = activeFieldStaff.length;
  const totalComplaintsCount = complaints.length;
  const pendingComplaintsCount = complaints.filter(
    (c) => c.status === 'submitted' || c.status === 'under_review'
  ).length;
  const approvedComplaintsCount = complaints.filter(
    (c) => c.status === 'approved' || c.status === 'assigned' || c.status === 'cleaning_in_progress'
  ).length;
  const completedCleaningCount = complaints.filter(
    (c) => c.status === 'completed' || c.status === 'reward_approved' || c.status === 'reward_paid'
  ).length;
  const totalRewardsDistributed = complaints
    .filter((c) => c.rewardStatus === 'paid')
    .reduce((sum, c) => sum + (c.rewardAmount || 0), 0);
  const pendingRewardPaymentsCount = complaints.filter(
    (c) => c.status === 'completed' || c.status === 'reward_approved' || c.rewardStatus === 'approved'
  ).length;

  // Filtered Complaints List
  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q) ||
        c.location.ward.toLowerCase().includes(q) ||
        c.citizenName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action: Approve Complaint
  const handleApprove = async (c: Complaint) => {
    const defaultReward = c.rewardAmount || 150;
    setIsProcessing(true);
    await onUpdateComplaint(c.id, {
      status: 'approved',
      rewardAmount: customRewardAmount || defaultReward,
      adminNotes: adminNotesInput.trim() || 'Verified genuine public nuisance by BBMP Admin.',
    });
    setIsProcessing(false);
    setSelectedComplaint(null);
  };

  // Action: Reject Complaint
  const handleReject = async (c: Complaint) => {
    setIsProcessing(true);
    await onUpdateComplaint(c.id, {
      status: 'rejected',
      rewardStatus: 'rejected',
      rejectionReason: rejectionReasonInput.trim() || 'Image does not represent actionable garbage nuisance or is duplicate.',
    });
    setIsProcessing(false);
    setSelectedComplaint(null);
  };

  // Action: Assign to Field Staff
  const handleAssignStaff = async (c: Complaint) => {
    const staff = activeFieldStaff.find((s) => s.id === assignStaffId);
    if (!staff) {
      alert('Please select an active field staff member from the roster.');
      return;
    }

    setIsProcessing(true);
    await onUpdateComplaint(c.id, {
      status: 'assigned',
      assignedStaffId: staff.id,
      assignedStaffName: staff.name,
      assignedStaffPhone: staff.phone,
      adminNotes: adminNotesInput.trim() || `Assigned to ${staff.name} (${staff.zone}) for rapid resolution.`,
    });
    setIsProcessing(false);
    setSelectedComplaint(null);
  };

  // Action: Record Verified UPI Reward Payment
  const handleConfirmUpiPayment = async (c: Complaint) => {
    const utr = manualUtrInput.trim() || generateUtrReference();
    setIsProcessing(true);

    try {
      await onRecordPayment({
        reportId: c.id,
        citizenId: c.citizenId,
        citizenName: c.citizenName,
        amount: c.rewardAmount || 200,
        upiId: c.citizenUpi || 'citizen@upi',
        paymentMethod: selectedPaymentMethod,
        transactionRef: utr,
        adminUid: user.id,
      });

      await onUpdateComplaint(c.id, {
        status: 'reward_paid',
        rewardStatus: 'paid',
        payoutMethod: selectedPaymentMethod,
        payoutTransactionRef: utr,
        payoutTimestamp: new Date().toISOString(),
      });

      setFeedbackMsg(`Reward of ${formatINR(c.rewardAmount || 200)} marked PAID. Transaction UTR: ${utr}`);

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#10b981', '#f59e0b', '#3b82f6'],
        });
      } catch (e) {}

      setManualUtrInput('');
      setTimeout(() => {
        setFeedbackMsg('');
        setSelectedComplaint(null);
      }, 2500);
    } catch (err: any) {
      alert('Failed to record payment: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export JSON Report
  const handleExportReport = () => {
    const reportData = complaints.map((c) => ({
      Complaint_ID: c.id,
      Citizen: c.citizenName,
      Ward: c.location.ward,
      Category: c.category,
      Status: c.status,
      Reward_Amount: c.rewardAmount || 0,
      Reward_Status: c.rewardStatus || 'none',
      Bank_UTR: c.payoutTransactionRef || 'N/A',
      Date: c.createdAt,
    }));

    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BBMP_Live_Report_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Admin Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-red-500/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-600/10 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>{t.adminWelcome}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {user.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Live Cloud Firestore Connected • Solid Waste Management (SWM) Authority
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportReport}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-2 transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Audit Data</span>
            </button>
          </div>
        </div>

        {/* 8 Live KPI Cards from Firestore */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="glass-card rounded-2xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">{t.totalCitizens}</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">{totalCitizensCount}</div>
            <span className="text-[10px] text-emerald-400">Registered Citizens</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">{t.totalStaff}</span>
              <HardHat className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">{totalFieldStaffCount}</div>
            <span className="text-[10px] text-amber-400">Active Marshals</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">{t.totalComplaints}</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">{totalComplaintsCount}</div>
            <span className="text-[10px] text-blue-400">Total Live Reports</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-red-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">{t.pendingReview}</span>
              <Clock className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-400 mt-1.5">{pendingComplaintsCount}</div>
            <span className="text-[10px] text-red-300">Pending Review</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">{t.approvedComplaints}</span>
              <Check className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-1.5">{approvedComplaintsCount}</div>
            <span className="text-[10px] text-cyan-300">Approved / In Progress</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">{t.completedTasks}</span>
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-teal-400 mt-1.5">{completedCleaningCount}</div>
            <span className="text-[10px] text-teal-300">Cleaned & Resolved</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">{t.totalDistributed}</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1.5">
              {formatINR(totalRewardsDistributed)}
            </div>
            <span className="text-[10px] text-emerald-300">Total Paid Rewards</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">{t.pendingPayoutsCount}</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1.5">{pendingRewardPaymentsCount}</div>
            <span className="text-[10px] text-amber-300">Pending Rewards</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'overview'
              ? 'bg-red-600 text-white shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {t.navDashboard}
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'complaints'
              ? 'bg-red-600 text-white shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {t.navVerifyReports} ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('staff_applications')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'staff_applications'
              ? 'bg-red-600 text-white shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Staff Applications ({staffApplications.filter((a) => a.status === 'pending').length} Pending)</span>
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'payouts'
              ? 'bg-red-600 text-white shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>UPI Payouts & UTR</span>
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'roster'
              ? 'bg-red-600 text-white shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <HardHat className="w-3.5 h-3.5" />
          <span>{t.navStaffRoster}</span>
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'announcements'
              ? 'bg-red-600 text-white shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>{t.navAnnouncements}</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'map'
              ? 'bg-red-600 text-white shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{t.navMap}</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {pendingComplaintsCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
                <span>
                  <strong>{pendingComplaintsCount} citizen complaints</strong> are awaiting official BBMP validation.
                </span>
              </div>
              <button
                onClick={() => {
                  setStatusFilter('submitted');
                  setActiveTab('complaints');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
              >
                Review Now
              </button>
            </div>
          )}

          {/* Quick List */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Live City Cleanliness Ingestion Stream</h3>
              <button
                onClick={() => setActiveTab('complaints')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>View All Complaints</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800">
              {complaints.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No complaints in Firestore yet.
                </div>
              ) : (
                complaints.slice(0, 6).map((c) => {
                  const meta = STATUS_META_MAP[c.status];
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedComplaint(c);
                        setCustomRewardAmount(c.rewardAmount || 200);
                        setAssignStaffId(c.assignedStaffId || activeFieldStaff[0]?.id || '');
                      }}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <img
                          src={c.photoBefore}
                          alt="Garbage spot"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-amber-400">{c.id}</span>
                            <span className="text-xs font-bold text-white truncate">
                              {c.category.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {c.location.address} • By {c.citizenName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                        >
                          {language === 'kn' ? meta.labelKn : meta.labelEn}
                        </span>
                        <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-semibold transition">
                          Inspect & Act
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: COMPLAINTS REVIEW ================= */}
      {activeTab === 'complaints' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by ID, Ward, Citizen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
              {['all', 'submitted', 'under_review', 'assigned', 'cleaning_in_progress', 'completed', 'reward_paid', 'rejected'].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      statusFilter === st
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'all'
                      ? 'All'
                      : language === 'kn'
                      ? STATUS_META_MAP[st as ComplaintStatus]?.labelKn
                      : STATUS_META_MAP[st as ComplaintStatus]?.labelEn}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/90 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Category & Location</th>
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Reward</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No complaints match the filter.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((c) => {
                    const meta = STATUS_META_MAP[c.status];
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                        <td className="py-3 px-4">
                          <img
                            src={c.photoBefore}
                            alt="garbage"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">
                            {c.category.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block max-w-[200px]">
                            {c.location.address}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-200 block font-medium">{c.citizenName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">+91 {c.citizenPhone}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                          >
                            {language === 'kn' ? meta.labelKn : meta.labelEn}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {c.assignedStaffName || <span className="text-slate-500 italic">Unassigned</span>}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          {c.rewardAmount ? formatINR(c.rewardAmount) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setCustomRewardAmount(c.rewardAmount || 200);
                              setAssignStaffId(c.assignedStaffId || activeFieldStaff[0]?.id || '');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-semibold transition"
                          >
                            Inspect & Act
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: STAFF APPLICATIONS REVIEW ================= */}
      {activeTab === 'staff_applications' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Field Staff Registrations & Vetting</h3>
                <p className="text-xs text-slate-400">
                  Applicants with status <strong>PENDING</strong> cannot log in until approved by Admin.
                </p>
              </div>
            </div>

            {staffApplications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No staff applications submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {staffApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={app.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                        alt={app.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/30 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-white">{app.name}</h4>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              app.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : app.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-amber-300 font-semibold">
                          Assigned Area: {app.assignedArea}
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Email: {app.email} • Mobile: +91 {app.phone} • Emp ID: {app.employeeId || 'N/A'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Address: {app.address} • Applied on: {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end md:self-auto">
                      {app.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => onApproveStaffApp(app.id, app.uid)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs btn-3d shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Approve Staff Access</span>
                          </button>
                          <button
                            onClick={() => onRejectStaffApp(app.id, app.uid)}
                            className="px-3 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 font-semibold text-xs flex items-center gap-1.5"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">
                          {app.status === 'approved' ? '✓ Staff Activated' : '✗ Application Declined'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: UPI PAYOUTS & UTR SETTLEMENT ================= */}
      {activeTab === 'payouts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints
              .filter(
                (c) =>
                  c.status === 'completed' ||
                  c.status === 'reward_approved' ||
                  c.status === 'reward_paid' ||
                  c.rewardStatus === 'approved' ||
                  c.rewardStatus === 'paid'
              )
              .map((c) => (
                <div
                  key={c.id}
                  className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-amber-400">{c.id}</span>
                      <p className="text-xs text-slate-300 font-semibold">{c.citizenName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400">
                        {formatINR(c.rewardAmount || 200)}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        UPI: {c.citizenUpi || 'citizen@upi'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-rose-400 font-bold">Reported Waste</span>
                      <img src={c.photoBefore} alt="before" className="w-full h-24 rounded-xl object-cover mt-1" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold">Cleaned Proof</span>
                      {c.photoAfter ? (
                        <img src={c.photoAfter} alt="after" className="w-full h-24 rounded-xl object-cover mt-1" />
                      ) : (
                        <div className="w-full h-24 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                          Awaiting proof
                        </div>
                      )}
                    </div>
                  </div>

                  {c.rewardStatus === 'paid' ? (
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300">
                      <div className="flex items-center justify-between font-bold">
                        <span>✓ Disbursed via {c.payoutMethod || 'UPI Transfer'}</span>
                        <span className="text-[10px] font-mono">Bank UTR: {c.payoutTransactionRef}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Payment Method</label>
                          <select
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          >
                            <option value="PhonePe">PhonePe UPI</option>
                            <option value="Google Pay">Google Pay UPI</option>
                            <option value="BHIM UPI">BHIM UPI</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Bank UTR Reference</label>
                          <input
                            type="text"
                            placeholder="e.g. 439201982736"
                            value={manualUtrInput}
                            onChange={(e) => setManualUtrInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleConfirmUpiPayment(c)}
                        disabled={isProcessing}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs btn-3d shadow-lg shadow-emerald-500/20"
                      >
                        {isProcessing ? 'Recording in Firestore...' : 'Confirm & Record Verified Payment'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: STAFF ROSTER ================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Active BBMP Ward Marshals ({activeFieldStaff.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeFieldStaff.map((staff) => {
                const assignedCount = complaints.filter((c) => c.assignedStaffId === staff.id).length;
                const completedCount = complaints.filter(
                  (c) => c.assignedStaffId === staff.id && (c.status === 'completed' || c.status === 'reward_paid')
                ).length;

                return (
                  <div key={staff.id} className="p-4 rounded-2xl glass-card border border-slate-800 flex space-x-3.5">
                    <img
                      src={staff.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                      alt={staff.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/30 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white truncate">{staff.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Active On Duty
                        </span>
                      </div>
                      <p className="text-xs text-amber-400 mt-0.5">{staff.zone}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Mobile: +91 {staff.phone}</p>
                      <div className="flex items-center space-x-4 mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                        <span>Assigned: <strong>{assignedCount}</strong></span>
                        <span>Resolved: <strong className="text-emerald-400">{completedCount}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: PUBLIC NOTICES ================= */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-1 glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <span>Broadcast Public Notice</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!annTitle.trim() || !annMessage.trim()) return;
                onAddAnnouncement({
                  id: `ann-${Date.now()}`,
                  title: annTitle.trim(),
                  titleKn: annTitleKn.trim() || annTitle.trim(),
                  message: annMessage.trim(),
                  messageKn: annMessageKn.trim() || annMessage.trim(),
                  date: new Date().toISOString().split('T')[0],
                  priority: annPriority,
                });
                setAnnTitle('');
                setAnnTitleKn('');
                setAnnMessage('');
                setAnnMessageKn('');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Cleanliness Drive at Indiranagar"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ಶೀರ್ಷಿಕೆ (ಕನ್ನಡ)</label>
                <input
                  type="text"
                  placeholder="ಉದಾ: ಇಂದಿರಾನಗರದಲ್ಲಿ ವಿಶೇಷ ಸ್ವಚ್ಛತಾ ಅಭಿಯಾನ"
                  value={annTitleKn}
                  onChange={(e) => setAnnTitleKn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Details (English)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Full announcement details..."
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level</label>
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="info">General Info</option>
                  <option value="alert">Strict Alert / Penalty</option>
                  <option value="event">Citizen Event / Drive</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs btn-3d shadow-lg shadow-red-600/20"
              >
                Publish Notice to All Portals
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Active Notices ({announcements.length})</h3>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-2xl glass-card border border-slate-800 flex justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400">
                        {ann.priority}
                      </span>
                      <span className="text-[10px] text-slate-500">{ann.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1.5">{ann.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">{ann.message}</p>
                    {ann.titleKn && (
                      <p className="text-xs text-amber-300/90 mt-2 font-medium">ಕನ್ನಡ: {ann.titleKn}</p>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteAnnouncement(ann.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 self-start"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 7: MAP ================= */}
      {activeTab === 'map' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <BengaluruMap complaints={complaints} height="520px" zoom={12} language={language} />
        </div>
      )}

      {/* ================= INSPECT & ACTION MODAL ================= */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-red-500/30 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono text-sm font-bold text-amber-400">{selectedComplaint.id}</span>
                <h3 className="text-lg font-bold text-white">Complaint Review & Action Console</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photos Before / After */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-rose-400 block mb-1">
                  Citizen Uploaded Evidence
                </span>
                <img
                  src={selectedComplaint.photoBefore}
                  alt="Before"
                  className="w-full h-48 rounded-2xl object-cover border border-rose-500/30"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 block mb-1">
                  Field Staff Cleaned Proof
                </span>
                {selectedComplaint.photoAfter ? (
                  <img
                    src={selectedComplaint.photoAfter}
                    alt="After"
                    className="w-full h-48 rounded-2xl object-cover border border-emerald-500/40"
                  />
                ) : (
                  <div className="w-full h-48 rounded-2xl bg-slate-900 border border-dashed border-slate-700 flex flex-col items-center justify-center text-xs text-slate-500 text-center p-4">
                    <span>Field cleaning in progress</span>
                    <span className="text-[10px] text-slate-600 mt-1">Proof will appear once Marshal completes task</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
              <div>
                <span className="text-slate-400 block">Location:</span>
                <span className="text-white font-semibold">{selectedComplaint.location.address}</span>
                <span className="text-amber-400 block text-[11px] mt-0.5">
                  GPS: {selectedComplaint.location.lat}° N, {selectedComplaint.location.lng}° E
                  {selectedComplaint.location.accuracy ? ` (±${selectedComplaint.location.accuracy}m)` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Reporting Citizen:</span>
                <span className="text-white font-semibold">{selectedComplaint.citizenName}</span>
                <span className="text-slate-300 block text-[11px]">UPI: {selectedComplaint.citizenUpi || 'Not set'}</span>
              </div>
            </div>

            {/* Admin Decision Actions */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {(selectedComplaint.status === 'submitted' || selectedComplaint.status === 'under_review') && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Step 1: Authenticate Report
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApprove(selectedComplaint)}
                      disabled={isProcessing}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs btn-3d shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve as Genuine</span>
                    </button>

                    <button
                      onClick={() => handleReject(selectedComplaint)}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject (Duplicate / Invalid)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Assign Field Staff */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Assign to Ward Marshal:
                </span>
                <div className="flex gap-2">
                  <select
                    value={assignStaffId}
                    onChange={(e) => setAssignStaffId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Choose Field Marshal --</option>
                    {activeFieldStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.zone})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssignStaff(selectedComplaint)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs btn-3d"
                  >
                    Assign Task
                  </button>
                </div>
              </div>

              {/* Step 3: Set Reward & Confirm Payment */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Citizen Reward & UPI Settlement:
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-36">
                    <label className="block text-[10px] text-slate-400">Reward Amount (₹)</label>
                    <input
                      type="number"
                      step={50}
                      value={customRewardAmount}
                      onChange={(e) => setCustomRewardAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold"
                    />
                  </div>

                  {selectedComplaint.rewardStatus !== 'paid' ? (
                    <div className="flex-1 flex gap-2 self-end">
                      <button
                        onClick={() => handleConfirmUpiPayment(selectedComplaint)}
                        disabled={isProcessing}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs btn-3d shadow-md"
                      >
                        {isProcessing ? 'Recording...' : 'Disburse & Record Verified UPI Payment'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 text-right self-end">
                      <span className="text-xs font-bold text-emerald-400">
                        ✓ Paid (UTR: {selectedComplaint.payoutTransactionRef})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

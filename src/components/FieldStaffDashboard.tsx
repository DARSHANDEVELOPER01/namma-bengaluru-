import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Complaint,
  Language,
} from '../types';
import { getTranslation } from '../utils/i18n';
import { STATUS_META_MAP } from '../utils/statusFlow';
import BengaluruMap from './BengaluruMap';
import { StorageService } from '../services/firebase';
import {
  HardHat,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  X,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  user: User;
  language: Language;
  complaints: Complaint[];
  onUpdateComplaint: (id: string, updates: Partial<Complaint>) => Promise<void>;
  onAddNotification: (notif: any) => Promise<void>;
}

export default function FieldStaffDashboard({
  user,
  language,
  complaints,
  onUpdateComplaint,
  onAddNotification,
}: Props) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'map'>('tasks');
  const [selectedTask, setSelectedTask] = useState<Complaint | null>(null);

  // Field Cleaning Progress Form
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string>('');
  const [selectedAfterFile, setSelectedAfterFile] = useState<File | null>(null);
  const [cleaningNotes, setCleaningNotes] = useState('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const t = getTranslation(language);

  // Filter tasks assigned to this staff member by their real Firebase UID or name
  const myTasks = complaints.filter(
    (c) => c.assignedStaffId === user.id || (!c.assignedStaffId && c.status === 'assigned')
  );

  const pendingTasks = myTasks.filter(
    (c) => c.status === 'assigned' || c.status === 'cleaning_in_progress'
  );
  const completedTasks = myTasks.filter(
    (c) => c.status === 'completed' || c.status === 'reward_approved' || c.status === 'reward_paid'
  );

  // Handle Mark In Progress
  const handleStartCleaning = async (task: Complaint) => {
    try {
      await onUpdateComplaint(task.id, {
        status: 'cleaning_in_progress',
        cleaningNotes: `Field cleanup team on-site. Resolution active by ${user.name}.`,
      });

      await onAddNotification({
        id: `notif-${Date.now()}`,
        targetRole: 'admin',
        title: `Cleaning Started: ${task.id}`,
        titleKn: `ಸ್ವಚ್ಛತೆ ಪ್ರಾರಂಭವಾಗಿದೆ: ${task.id}`,
        message: `${user.name} started cleaning at ${task.location.address}`,
        messageKn: `${user.name} ಅವರು ಸ್ಥಳದಲ್ಲಿ ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿದ್ದಾರೆ`,
        timestamp: new Date().toISOString(),
        read: false,
        complaintId: task.id,
        type: 'cleaning',
      });

      setActionSuccessMsg(`Status updated: Cleaning Work In Progress on ${task.id}`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg('Failed to update status: ' + err.message);
    }
  };

  // Upload after cleaning photo with file validation
  const handleAfterPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }

    setSelectedAfterFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAfterPhotoPreview(reader.result as string);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  // Mark Completed with Real Storage Upload & Firestore Update
  const handleCompleteCleaning = async (task: Complaint) => {
    if (!afterPhotoPreview && !selectedAfterFile) {
      setErrorMsg('Please upload an after-cleaning proof photograph before marking as completed.');
      return;
    }

    setIsSubmittingCompletion(true);
    setErrorMsg('');

    try {
      const storagePath = `cleaning-proof/${user.id}/${task.id}/after.jpg`;
      const uploadedAfterUrl = await StorageService.uploadImage(
        selectedAfterFile || afterPhotoPreview,
        storagePath
      );

      await onUpdateComplaint(task.id, {
        status: 'completed',
        photoAfter: uploadedAfterUrl,
        cleaningNotes: cleaningNotes.trim() || 'Site fully cleared and sanitized.',
        completedAt: new Date().toISOString(),
      });

      // Notify Admin in Firestore
      await onAddNotification({
        id: `notif-${Date.now()}`,
        targetRole: 'admin',
        title: `Cleanup Completed: ${task.id}`,
        titleKn: `ಸ್ವಚ್ಛತೆ ಪೂರ್ಣಗೊಂಡಿದೆ: ${task.id}`,
        message: `${user.name} has cleared ${task.location.address}. Real proof uploaded. Reward ready for approval.`,
        messageKn: `${task.location.address} ಸ್ವಚ್ಛಗೊಳಿಸಲಾಗಿದೆ. ಬಹುಮಾನ ಅನುಮೋದನೆಗೆ ಸಿದ್ಧ.`,
        timestamp: new Date().toISOString(),
        read: false,
        complaintId: task.id,
        type: 'cleaning',
      });

      // Notify Citizen in Firestore
      await onAddNotification({
        id: `notif-${Date.now() + 1}`,
        userId: task.citizenId,
        title: `Your Report ${task.id} has been Cleaned!`,
        titleKn: `ನಿಮ್ಮ ವರದಿ ${task.id} ಸ್ವಚ್ಛಗೊಳಿಸಲಾಗಿದೆ!`,
        message: `Field staff completed cleanup. Your reward is now queued for administrative payout.`,
        messageKn: `ಸಿಬ್ಬಂದಿ ಸ್ವಚ್ಛತಾ ಕಾರ್ಯ ಪೂರ್ಣಗೊಳಿಸಿದ್ದಾರೆ. ನಿಮ್ಮ ಬಹುಮಾನ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ.`,
        timestamp: new Date().toISOString(),
        read: false,
        complaintId: task.id,
        type: 'cleaning',
      });

      setActionSuccessMsg(`Task ${task.id} marked as COMPLETED! Cloud proof saved and Admin notified.`);
      setAfterPhotoPreview('');
      setSelectedAfterFile(null);
      setCleaningNotes('');
      setSelectedTask(null);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b'],
        });
      } catch (e) {}
    } catch (err: any) {
      console.error('Error completing cleaning:', err);
      setErrorMsg('Failed to complete task: ' + err.message);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Staff Profile Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/20 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-xl"
            />
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-1">
                <HardHat className="w-3.5 h-3.5" />
                <span>{t.staffWelcome}</span>
              </div>
              <h2 className="text-2xl font-black text-white">{user.name}</h2>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>{user.zone}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-amber-300">Duty Phone: +91 {user.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700/80 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Active</span>
              <span className="text-xl font-black text-amber-400">{pendingTasks.length}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700/80 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Resolved</span>
              <span className="text-xl font-black text-emerald-400">{completedTasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-xs font-bold text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'tasks'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {t.myTasks} ({myTasks.length})
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

      {/* ================= TAB 1: ASSIGNED TASKS ================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.length === 0 ? (
              <div className="col-span-full text-center py-12 glass-panel rounded-3xl text-slate-400 text-xs">
                No cleaning tasks currently assigned. Keep your area monitored!
              </div>
            ) : (
              myTasks.map((task) => {
                const meta = STATUS_META_MAP[task.status];
                const isCompleted =
                  task.status === 'completed' ||
                  task.status === 'reward_approved' ||
                  task.status === 'reward_paid';

                return (
                  <div
                    key={task.id}
                    className="glass-panel glass-card-hover rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-amber-400">{task.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                        >
                          {language === 'kn' ? meta.labelKn : meta.labelEn}
                        </span>
                      </div>

                      <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-700 mb-3">
                        <img src={task.photoBefore} alt="Garbage spot" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] text-rose-400 font-bold">
                          Citizen Report Photo
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">
                        {task.category.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{task.description}</p>

                      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <div className="flex items-center space-x-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{task.location.address}</span>
                        </div>
                        {task.location.landmark && (
                          <span className="text-[10px] text-slate-400 block pl-5">
                            Landmark: {task.location.landmark}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center space-x-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${task.location.lat},${task.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300 flex items-center justify-center space-x-1.5 transition"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {!isCompleted && (
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setAfterPhotoPreview('');
                              setSelectedAfterFile(null);
                              setCleaningNotes('');
                            }}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold btn-3d shadow-md shadow-amber-500/20"
                          >
                            Update Work
                          </button>
                        )}
                      </div>

                      {task.status === 'assigned' && (
                        <button
                          onClick={() => handleStartCleaning(task)}
                          className="w-full py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t.markInProgress}</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div className="py-1.5 text-center text-[11px] font-bold text-teal-400 bg-teal-500/10 rounded-xl border border-teal-500/20">
                          ✓ Site Cleaned & Proof Submitted
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: MAP VIEW ================= */}
      {activeTab === 'map' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-lg font-bold text-white">Your Assigned Tasks on Bengaluru Map</h3>
          <BengaluruMap complaints={myTasks} height="520px" zoom={13} language={language} />
        </div>
      )}

      {/* ================= RESOLUTION MODAL ================= */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400">{selectedTask.id}</span>
                <h3 className="text-lg font-bold text-white">Upload Cleaning Completion Proof</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before Photo */}
            <div>
              <span className="text-xs font-bold text-rose-400 block mb-1">
                Reported Site Photo (Before Cleaning)
              </span>
              <img
                src={selectedTask.photoBefore}
                alt="Before"
                className="w-full h-44 rounded-2xl object-cover border border-slate-700"
              />
            </div>

            {/* Upload After Photo Proof */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                Upload After Cleaning Photo (Saved to Firebase Storage) *
              </label>

              {afterPhotoPreview ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black max-w-sm mx-auto border border-emerald-500">
                  <img src={afterPhotoPreview} alt="After cleaning" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setAfterPhotoPreview('');
                      setSelectedAfterFile(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => afterFileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-slate-900/60 hover:bg-slate-900 flex flex-col items-center justify-center cursor-pointer transition text-center"
                >
                  <Camera className="w-8 h-8 text-amber-400 mb-2" />
                  <span className="text-xs font-bold text-white">{t.uploadAfterPhoto}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Take photo or upload camera capture</span>
                  <input
                    ref={afterFileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleAfterPhotoUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t.cleaningNotes}
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cleared 2 sacks of plastic and washed pavement with sanitizing powder."
                value={cleaningNotes}
                onChange={(e) => setCleaningNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingCompletion}
                onClick={() => handleCompleteCleaning(selectedTask)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black btn-3d shadow-lg shadow-emerald-500/20"
              >
                {isSubmittingCompletion ? 'Uploading to Firebase...' : t.markCompleted}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

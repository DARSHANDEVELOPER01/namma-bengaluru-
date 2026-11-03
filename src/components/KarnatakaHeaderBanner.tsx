import React, { useState } from 'react';
import { User, Language, AppNotification } from '../types';
import { getTranslation } from '../utils/i18n';
import {
  Bell,
  Globe,
  LogOut,
  Shield,
  User as UserIcon,
  HardHat,
  Sparkles,
  ExternalLink,
  Phone,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  user: User | null;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  onOpenAboutModal: () => void;
  onViewComplaintFromNotif?: (id: string) => void;
}

export default function KarnatakaHeaderBanner({
  user,
  language,
  onLanguageChange,
  onLogout,
  notifications,
  onMarkNotificationsRead,
  onOpenAboutModal,
  onViewComplaintFromNotif,
}: Props) {
  const [showNotifs, setShowNotifs] = useState(false);
  const t = getTranslation(language);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-amber-500/20 shadow-2xl transition-all">
      {/* Karnataka Dual Flag Ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/2 bg-red-600"></div>
        <div className="h-full w-1/2 bg-amber-400"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Government Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
            <div className="relative group cursor-pointer flex-shrink-0" onClick={onOpenAboutModal} title="BBMP Smart City Cleanliness Cell">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center p-1 text-center">
                  <span className="text-amber-400 font-extrabold text-[10px] sm:text-xs tracking-tighter leading-none">BBMP</span>
                  <div className="w-3 sm:w-4 h-0.5 bg-red-500 my-0.5"></div>
                  <span className="text-[8px] sm:text-[10px] text-red-400 font-bold leading-none">ಬೆಂಗಳೂರು</span>
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" title="Mission Online"></span>
            </div>

            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-red-400 bg-clip-text text-transparent truncate">
                    {language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು' : 'NAMMA BENGALURU'}
                  </span>
                  <span className="hidden lg:inline-block text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-300">
                    {language === 'kn' ? 'ಸ್ವಚ್ಛತಾ ಮಿಷನ್' : 'CLEANUP MISSION'}
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-300 font-medium hidden md:block truncate">
                {language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು, ನಮ್ಮ ಜವಾಬ್ದಾರಿ' : 'Our Bengaluru, Our Responsibility'}
                <span className="text-amber-400/80 mx-1.5">•</span>
                <span className="text-slate-400">{t.subTitle}</span>
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
            {/* Quick Emergency / Helpline Button */}
            <button
              onClick={onOpenAboutModal}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-amber-300 font-medium transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'kn' ? 'ಸಹಾಯವಾಣಿ: 1533' : 'Helpline: 1533'}</span>
            </button>

            {/* Language Switcher Pill */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to English"
              >
                ENG
              </button>
              <button
                onClick={() => onLanguageChange('kn')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'kn'
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ"
              >
                ಕನ್ನಡ
              </button>
            </div>

            {user && (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifs(!showNotifs);
                      if (!showNotifs) onMarkNotificationsRead();
                    }}
                    className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-amber-400 relative transition shadow-sm"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-[10px] font-extrabold text-white flex items-center justify-center animate-pulse border-2 border-slate-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown notification panel */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel shadow-2xl p-4 border border-slate-700/80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-bold text-white">
                            {language === 'kn' ? 'ಅಧಿಸೂಚನೆಗಳು' : 'Notifications'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {notifications.length} {language === 'kn' ? 'ಒಟ್ಟು' : 'total'}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto mt-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 py-4 text-center">
                            {language === 'kn' ? 'ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ' : 'No new notifications'}
                          </p>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (n.complaintId && onViewComplaintFromNotif) {
                                  onViewComplaintFromNotif(n.complaintId);
                                  setShowNotifs(false);
                                }
                              }}
                              className={`py-2.5 px-2 hover:bg-slate-800/50 rounded-xl cursor-pointer transition flex items-start space-x-2.5 ${
                                !n.read ? 'bg-amber-500/5' : ''
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">
                                  {language === 'kn' ? n.titleKn : n.title}
                                </p>
                                <p className="text-[11px] text-slate-300 line-clamp-2">
                                  {language === 'kn' ? n.messageKn : n.message}
                                </p>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Capsule & Role Badge */}
                <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                      {user.role === 'admin'
                        ? 'Admin Officer'
                        : user.role === 'field_staff'
                        ? 'Ward Marshal'
                        : 'Citizen Vigil'}
                    </span>
                  </div>

                  <div className="relative">
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                      alt={user.name}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-amber-500/30"
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-950">
                      {user.role === 'admin' ? (
                        <Shield className="w-3 h-3 text-red-500" />
                      ) : user.role === 'field_staff' ? (
                        <HardHat className="w-3 h-3 text-amber-400" />
                      ) : (
                        <UserIcon className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white transition"
                    title={t.logout}
                    aria-label={t.logout}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

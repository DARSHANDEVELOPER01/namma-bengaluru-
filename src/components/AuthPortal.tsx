import React, { useState } from 'react';
import { User, UserRole, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import ThreeBackground from './ThreeBackground';
import { AuthService, StaffApplicationData } from '../services/firebase';
import {
  Shield,
  User as UserIcon,
  HardHat,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  Camera,
  Upload,
  UserCheck,
} from 'lucide-react';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (user: User) => void;
  onOpenAboutModal: () => void;
}

export default function AuthPortal({
  language,
  onLanguageChange,
  onLoginSuccess,
  onOpenAboutModal,
}: Props) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Citizen Registration
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [regWard, setRegWard] = useState('Ward 112 - Domlur / Indiranagar');
  const [regUpi, setRegUpi] = useState('');

  // Staff Registration
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [staffConfirmPass, setStaffConfirmPass] = useState('');
  const [staffEmpId, setStaffEmpId] = useState('');
  const [staffArea, setStaffArea] = useState('BBMP East Zone (Indiranagar / Ulsoor)');
  const [staffAddress, setStaffAddress] = useState('');
  const [staffPhotoUrl, setStaffPhotoUrl] = useState('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const t = getTranslation(language);

  // REAL AUTHENTICATION SUBMIT (Admin, Citizen, Staff)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setErrorMessage('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      const user = await AuthService.login(email.trim(), password, selectedRole);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = err.message || 'Login failed. Please check your credentials.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found')) {
        msg = 'Invalid email or password. Please verify and try again.';
      } else if (msg.includes('auth/too-many-requests')) {
        msg = 'Access temporarily disabled due to multiple failed login attempts.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // REAL GOOGLE AUTH (Available for Citizen and Authorized Admin)
  const handleGoogleSignIn = async () => {
    if (!selectedRole) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      const user = await AuthService.loginWithGoogle(selectedRole);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMessage(err.message || 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // REAL CITIZEN REGISTRATION SUBMIT
  const handleCitizenRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (regPass !== regConfirmPass) {
      setErrorMessage(language === 'kn' ? 'ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ' : 'Passwords do not match.');
      return;
    }
    if (regPass.length < 6) {
      setErrorMessage(language === 'kn' ? 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು' : 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await AuthService.registerCitizen(
        regName.trim(),
        regEmail.trim().toLowerCase(),
        regPass,
        regPhone.trim(),
        regWard,
        regUpi.trim()
      );
      onLoginSuccess(newUser);
    } catch (err: any) {
      console.error('Citizen registration error:', err);
      let msg = err.message || 'Failed to create account.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please sign in instead.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // REAL FIELD STAFF REGISTRATION SUBMIT (Saved as PENDING)
  const handleStaffRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (staffPass !== staffConfirmPass) {
      setErrorMessage(language === 'kn' ? 'ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ' : 'Passwords do not match.');
      return;
    }
    if (staffPass.length < 6) {
      setErrorMessage(language === 'kn' ? 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು' : 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const app = await AuthService.registerStaffApplication(
        staffName.trim(),
        staffEmail.trim().toLowerCase(),
        staffPass,
        staffPhone.trim(),
        staffEmpId.trim(),
        staffArea,
        staffAddress.trim(),
        staffPhotoUrl
      );

      setSuccessNotice(
        language === 'kn'
          ? 'ಅರ್ಜಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ! ನಿಮ್ಮ ಖಾತೆಯು ಬಿಬಿಎಂಪಿ ಅಡ್ಮಿನ್ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ (PENDING). ಅನುಮೋದನೆಯ ನಂತರವೇ ಪ್ರವೇಶ ದೊರೆಯುತ್ತದೆ.'
          : 'Staff Application Submitted! Your application has been logged as PENDING administrative review. Access will be granted once approved by the BBMP Admin.'
      );
      setMode('login');
      // Pre-fill email
      setEmail(staffEmail.trim());
      setPassword('');
    } catch (err: any) {
      console.error('Staff registration error:', err);
      let msg = err.message || 'Staff registration failed.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please login or check your application status.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Staff photo file picker
  const handleStaffPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStaffPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-slate-950 text-white">
      {/* 3D Canvas Background */}
      <ThreeBackground />

      {/* Karnataka Sunset & Heritage Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-40 bg-cover bg-center"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 20%, rgba(220, 38, 38, 0.35) 0%, rgba(217, 119, 6, 0.25) 45%, rgba(15, 23, 42, 0.95) 90%), url('https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1920&q=80')`,
          backgroundBlendMode: 'overlay',
        }}
      />

      {/* Vidhana Soudha Architectural Silhouette Base */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none opacity-20 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-end justify-center">
        <svg viewBox="0 0 1200 160" className="w-full h-32 text-amber-500 fill-current opacity-30">
          <path d="M0,160 L0,140 L100,140 L100,120 L160,120 L160,100 L240,100 L240,80 L320,80 L320,110 L440,110 L440,50 L560,50 L560,20 L600,0 L640,20 L640,50 L760,50 L760,110 L880,110 L880,80 L960,80 L960,100 L1040,100 L1040,120 L1100,120 L1100,140 L1200,140 L1200,160 Z" />
        </svg>
      </div>

      {/* Top Banner Navigation */}
      <nav className="relative z-10 w-full px-4 sm:px-8 py-4 flex items-center justify-between backdrop-blur-md bg-slate-950/60 border-b border-amber-500/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl karnataka-flag-strip p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-amber-400 font-extrabold text-xs">ಬೆಂ</span>
            </div>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>{language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು' : 'NAMMA BENGALURU'}</span>
              <span className="text-xs text-amber-400 font-normal">| BBMP</span>
            </h2>
            <p className="text-[11px] text-amber-300/80 font-medium tracking-wide hidden sm:block">
              {language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು, ನಮ್ಮ ಜವಾಬ್ದಾರಿ' : 'Clean City, Green City, Smart City'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAboutModal}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-amber-300 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'kn' ? 'ಸಹಾಯ & ಸಂಪರ್ಕ' : 'Mission Info & Helpline'}</span>
          </button>

          {/* Bilingual Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-slate-700/80">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ENG
            </button>
            <button
              onClick={() => onLanguageChange('kn')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                language === 'kn'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full">
        {!selectedRole ? (
          /* ================= GATEWAY: SELECT PORTAL ================= */
          <div className="w-full text-center space-y-8 animate-in fade-in duration-300">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-950/80 to-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  {language === 'kn'
                    ? 'ಬೃಹತ್ ಬೆಂಗಳೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ • ಅಧಿಕೃತ ಸ್ವಚ್ಛತಾ ಪೋರ್ಟಲ್'
                    : 'Bruhat Bengaluru Mahanagara Palike • Official Cleanliness Portal'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">
                  {language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು ಸ್ವಚ್ಛತಾ ಮಿಷನ್' : 'NAMMA BENGALURU'}
                </span>
              </h1>

              <div className="text-xl sm:text-2xl font-bold text-amber-400">
                &ldquo;{language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು, ನಮ್ಮ ಜವಾಬ್ದಾರಿ' : 'Our Bengaluru, Our Responsibility'}&rdquo;
              </div>

              <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {language === 'kn'
                  ? 'ನೈಜ ಫೋಟೋ ಮತ್ತು ಜಿಪಿಎಸ್ ಸ್ಥಳದೊಂದಿಗೆ ಕಸವನ್ನು ವರದಿ ಮಾಡಿ, ಪರಿಶೀಲನೆಯ ನಂತರ ನೇರವಾಗಿ ಯುಪಿಐ ಮೂಲಕ ಬಹುಮಾನ ಪಡೆಯಿರಿ. ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ.'
                  : 'Report public waste using verified real-time GPS and camera photography. All authentication, photo uploads, field assignments, and UPI rewards are connected to live Firebase cloud infrastructure.'}
              </p>
            </div>

            {/* Portal Selection Header */}
            <div className="pt-2">
              <h3 className="text-lg font-bold text-slate-200">
                {t.selectPortal}
              </h3>
              <p className="text-xs text-slate-400">{t.portalDesc}</p>
            </div>

            {/* 3 Separate Role Portals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
              {/* 1. CITIZEN PORTAL */}
              <div
                onClick={() => {
                  setSelectedRole('citizen');
                  setMode('login');
                  setErrorMessage('');
                  setSuccessNotice('');
                  setEmail('');
                  setPassword('');
                }}
                className="group relative glass-card glass-card-hover rounded-3xl p-6 cursor-pointer border border-emerald-500/30 hover:border-emerald-400/80 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <UserIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Public Access
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition">
                      {t.citizenRole}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {t.citizenDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    {language === 'kn' ? 'ಲಾಗಿನ್ / ನೋಂದಣಿ' : 'Login / Register'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 2. ADMIN PORTAL */}
              <div
                onClick={() => {
                  setSelectedRole('admin');
                  setMode('login');
                  setErrorMessage('');
                  setSuccessNotice('');
                  setEmail('');
                  setPassword('');
                }}
                className="group relative glass-card glass-card-hover rounded-3xl p-6 cursor-pointer border border-red-500/30 hover:border-red-400/80 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                      Restricted Access
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-red-300 transition">
                      {t.adminRole}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {t.adminDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                    {language === 'kn' ? 'ಅಧಿಕಾರಿ ಲಾಗಿನ್' : 'Officer Sign In'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 3. FIELD STAFF PORTAL */}
              <div
                onClick={() => {
                  setSelectedRole('field_staff');
                  setMode('login');
                  setErrorMessage('');
                  setSuccessNotice('');
                  setEmail('');
                  setPassword('');
                }}
                className="group relative glass-card glass-card-hover rounded-3xl p-6 cursor-pointer border border-amber-500/30 hover:border-amber-400/80 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <HardHat className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Ward Marshals
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition">
                      {t.staffRole}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {t.staffDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                    {language === 'kn' ? 'ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ / ನೋಂದಣಿ' : 'Staff Login / Register'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= PORTAL FORM CARD ================= */
          <div className="w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
              {/* Back to Gateway */}
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setMode('login');
                  setErrorMessage('');
                  setSuccessNotice('');
                }}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white mb-6 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.backToHome}</span>
              </button>

              {/* Portal Header */}
              <div className="flex items-center space-x-3 mb-6">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    selectedRole === 'admin'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : selectedRole === 'field_staff'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {selectedRole === 'admin' ? (
                    <Shield className="w-6 h-6" />
                  ) : selectedRole === 'field_staff' ? (
                    <HardHat className="w-6 h-6" />
                  ) : (
                    <UserIcon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedRole === 'admin'
                      ? t.adminRole
                      : selectedRole === 'field_staff'
                      ? t.staffRole
                      : t.citizenRole}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {selectedRole === 'admin'
                      ? language === 'kn'
                        ? 'ಅಧಿಕೃತ ಬಿಬಿಎಂಪಿ ಅಧಿಕಾರಿಗಳಿಗೆ ಮಾತ್ರ'
                        : 'BBMP Control Room Administrator Login'
                      : selectedRole === 'field_staff'
                      ? mode === 'register'
                        ? 'Staff Registration Form (Requires Admin Approval)'
                        : 'Authorized Ward Marshal Access'
                      : mode === 'register'
                      ? 'Register Citizen Account'
                      : 'Sign In to Report Waste & Earn Rewards'}
                  </p>
                </div>
              </div>

              {/* Tabs for Citizen or Staff (Login vs Register) */}
              {selectedRole !== 'admin' && (
                <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                      setSuccessNotice('');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      mode === 'login'
                        ? selectedRole === 'field_staff'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                      setSuccessNotice('');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      mode === 'register'
                        ? selectedRole === 'field_staff'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {selectedRole === 'field_staff'
                      ? language === 'kn'
                        ? 'ಸಿಬ್ಬಂದಿ ನೋಂದಣಿ'
                        : 'Staff Registration'
                      : language === 'kn'
                      ? 'ಹೊಸ ನೋಂದಣಿ'
                      : 'Register New'}
                  </button>
                </div>
              )}

              {/* Success Notification Alert */}
              {successNotice && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-start space-x-2 text-xs text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center space-x-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ================= 1. FIELD STAFF REGISTRATION FORM ================= */}
              {selectedRole === 'field_staff' && mode === 'register' ? (
                <form onSubmit={handleStaffRegisterSubmit} className="space-y-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                    <p className="font-semibold">Notice for Field Staff Applicants:</p>
                    <p>
                      Applications are saved with status <strong>PENDING</strong>. You will not have dashboard access until verified and approved by the BBMP Administrator.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Gowda"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="staff@bbmp.gov.in"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mobile Number (+91) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="9900112233"
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={staffPass}
                        onChange={(e) => setStaffPass(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={staffConfirmPass}
                        onChange={(e) => setStaffConfirmPass(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Employee ID (If Applicable)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BBMP-MRSHL-1402"
                        value={staffEmpId}
                        onChange={(e) => setStaffEmpId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Assigned Area / Ward *
                      </label>
                      <select
                        value={staffArea}
                        onChange={(e) => setStaffArea(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="BBMP East Zone (Indiranagar / Ulsoor)">BBMP East Zone (Indiranagar / Ulsoor)</option>
                        <option value="BBMP South Zone (Koramangala / Jayanagar)">BBMP South Zone (Koramangala / Jayanagar)</option>
                        <option value="BBMP West Zone (Majestic / Gandhi Nagar)">BBMP West Zone (Majestic / Gandhi Nagar)</option>
                        <option value="BBMP North Zone (Malleshwaram / Yeshwantpur)">BBMP North Zone (Malleshwaram / Yeshwantpur)</option>
                        <option value="BBMP Mahadevapura (Whitefield / ITPL)">BBMP Mahadevapura (Whitefield / ITPL)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Residential / Office Depot Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ward Marshal Quarters, Old Madras Road, Bengaluru"
                      value={staffAddress}
                      onChange={(e) => setStaffAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  {/* Profile photo optional */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Profile Photograph (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStaffPhotoUpload}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-xs file:text-amber-300 hover:file:bg-slate-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm btn-3d transition shadow-lg shadow-amber-500/20"
                  >
                    {isLoading ? 'Submitting Application...' : 'Submit Staff Registration for Approval'}
                  </button>
                </form>
              ) : selectedRole === 'citizen' && mode === 'register' ? (
                /* ================= 2. CITIZEN REGISTRATION FORM ================= */
                <form onSubmit={handleCitizenRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {t.email} *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="citizen@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {t.phone} *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="9845012345"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password (min 6 chars) *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regConfirmPass}
                        onChange={(e) => setRegConfirmPass(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.ward}
                    </label>
                    <select
                      value={regWard}
                      onChange={(e) => setRegWard(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="Ward 112 - Domlur / Indiranagar">Ward 112 - Domlur / Indiranagar</option>
                      <option value="Ward 151 - Koramangala">Ward 151 - Koramangala</option>
                      <option value="Ward 45 - Malleshwaram">Ward 45 - Malleshwaram</option>
                      <option value="Ward 94 - Gandhi Nagar / Majestic">Ward 94 - Gandhi Nagar / Majestic</option>
                      <option value="Ward 84 - Whitefield / ITPL">Ward 84 - Whitefield / ITPL</option>
                      <option value="Ward 168 - Jayanagar 4th Block">Ward 168 - Jayanagar 4th Block</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.upiId} (For Direct Cash Rewards)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. name@okhdfcbank or 9845012345@paytm"
                      value={regUpi}
                      onChange={(e) => setRegUpi(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm btn-3d transition shadow-lg shadow-emerald-500/20"
                  >
                    {isLoading ? 'Creating Firebase Account...' : t.registerBtn}
                  </button>
                </form>
              ) : (
                /* ================= 3. REAL LOGIN FORM ================= */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.email}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder={
                          selectedRole === 'admin'
                            ? 'teamrockers@bbmp.gov.in'
                            : selectedRole === 'field_staff'
                            ? 'staff@bbmp.gov.in'
                            : 'citizen@example.com'
                        }
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.password}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  {selectedRole === 'admin' && (
                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-[11px] text-red-300 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>
                        {language === 'kn'
                          ? 'ಸಾರ್ವಜನಿಕ ನೋಂದಣಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಕೇವಲ ಅಧಿಕೃತ ಬಿಬಿಎಂಪಿ ಅಡ್ಮಿನ್‌ಗೆ ಮಾತ್ರ ಪ್ರವೇಶ.'
                          : 'Public admin registration disabled. Only verified BBMP administrators can sign in.'}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 rounded-xl font-black text-sm btn-3d transition shadow-lg ${
                      selectedRole === 'admin'
                        ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-500/20'
                        : selectedRole === 'field_staff'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    {isLoading ? 'Verifying with Firebase...' : t.loginBtn}
                  </button>

                  {/* Google Sign In option */}
                  <div className="pt-2 text-center">
                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-slate-950 px-2 text-slate-500 font-bold">Or Sign In With</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleGoogleSignIn}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center justify-center space-x-2 transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full py-4 px-4 text-center text-xs text-slate-500 backdrop-blur-md bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {language === 'kn'
              ? '© 2026 ಬೃಹತ್ ಬೆಂಗಳೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ (ಬಿಬಿಎಂಪಿ). ಅಧಿಕೃತ ಸ್ಮಾರ್ಟ್ ಸಿಟಿ ತಂತ್ರಜ್ಞಾನ.'
              : '© 2026 Bruhat Bengaluru Mahanagara Palike (BBMP). Secured with Firebase Cloud Platform.'}
          </span>
          <div className="flex items-center space-x-4">
            <span className="text-amber-400 font-medium">
              {language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು, ಸ್ವಚ್ಛ ಬೆಂಗಳೂರು' : 'Clean Bengaluru • Smart Bengaluru'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

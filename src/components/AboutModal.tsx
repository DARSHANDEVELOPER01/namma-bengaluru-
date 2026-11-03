import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';
import {
  Phone,
  Mail,
  MapPin,
  X,
  Shield,
  Sparkles,
  AlertTriangle,
  Award,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface Props {
  language: Language;
  onClose: () => void;
}

export default function AboutModal({ language, onClose }: Props) {
  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl karnataka-gradient p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-amber-400 font-extrabold text-sm">BBMP</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು ಸ್ವಚ್ಛತಾ ಮಿಷನ್' : 'NAMMA BENGALURU CLEANUP MISSION'}
              </h3>
              <p className="text-xs text-amber-300 font-medium">
                {language === 'kn' ? 'ನಮ್ಮ ಬೆಂಗಳೂರು, ನಮ್ಮ ಜವಾಬ್ದಾರಿ' : 'Clean City, Green City, Smart City'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Statement */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/30 to-slate-900 border border-amber-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed">
          <p className="font-semibold text-amber-300 mb-1">
            {language === 'kn' ? 'ಯೋಜನೆಯ ಉದ್ದೇಶ:' : 'Mission Statement & Objective:'}
          </p>
          <p>
            {language === 'kn'
              ? 'ನಮ್ಮ ಬೆಂಗಳೂರು ಸ್ವಚ್ಛತಾ ಮಿಷನ್ ನಾಗರಿಕರು, ಬಿಬಿಎಂಪಿ ವಾರ್ಡ್ ಮಾರ್ಷಲ್ಸ್ ಮತ್ತು ಅಧಿಕಾರಿಗಳನ್ನು ಸಂಯೋಜಿಸುವ ಸ್ಮಾರ್ಟ್ ತಂತ್ರಜ್ಞಾನ ವ್ಯವಸ್ಥೆಯಾಗಿದೆ. ಸಾರ್ವಜನಿಕ ಸ್ಥಳಗಳಲ್ಲಿನ ಕಸವನ್ನು ಜಿಪಿಎಸ್ ಫೋಟೋ ಮೂಲಕ ದಾಖಲಿಸಿ, ಪರಿಶೀಲನೆಗೊಂಡ ನಂತರ ನಾಗರಿಕರಿಗೆ ತಕ್ಷಣದ ಯುಪಿಐ ನಗದು ಬಹುಮಾನ ನೀಡಲಾಗುತ್ತದೆ.'
              : 'Namma Bengaluru Cleanup Mission is a state-of-the-art public-civic partnership platform designed by Bruhat Bengaluru Mahanagara Palike (BBMP). By combining citizen geotagged photography with rapid Marshal response units, we eradicate garbage black spots and reward proactive citizens directly via UPI.'}
          </p>
        </div>

        {/* 3 Steps Workflow */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            {language === 'kn' ? 'ಕಾರ್ಯ ವಿಧಾನ:' : 'How the System Works:'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="text-amber-400 font-black text-sm mb-1">1. Click & Report</div>
              <p className="text-slate-300 text-[11px]">
                Citizen captures live photo of waste and auto-locks GPS coordinates.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="text-cyan-400 font-black text-sm mb-1">2. Marshal Resolves</div>
              <p className="text-slate-300 text-[11px]">
                Assigned Ward Marshal clears the spot and submits after-cleaning proof photo.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="text-emerald-400 font-black text-sm mb-1">3. Instant UPI Reward</div>
              <p className="text-slate-300 text-[11px]">
                Admin approves payment (₹100 - ₹400) transferred directly to citizen's UPI ID.
              </p>
            </div>
          </div>
        </div>

        {/* BBMP Emergency Helpline & Contact Desk */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {t.helplineTitle}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <Phone className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">24x7 Citizen Helpline</span>
                <span className="font-bold text-white text-sm">1533 (Toll Free)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <Phone className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">BBMP Central Control Room</span>
                <span className="font-bold text-white text-sm">080-22660000 / 080-22221188</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Official Support Desk</span>
                <span className="font-bold text-white text-sm">cleancity@bbmp.gov.in</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Headquarters</span>
                <span className="font-bold text-white text-xs">N. R. Square, Corporation Circle, Bengaluru 560002</span>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Segregation Guidelines */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
          <span className="font-bold text-amber-400 block flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" />
            Mandatory Waste Segregation Guidelines (BBMP Bylaws 2020)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <strong className="text-emerald-400 block">Green Bin (Wet Waste):</strong>
              Kitchen scraps, vegetables, fruits, food remains, fallen leaves.
            </div>
            <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/30">
              <strong className="text-blue-400 block">Blue Bin (Dry Waste):</strong>
              Plastic, paper, milk packets, metal cans, glass, cardboard boxes.
            </div>
            <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30">
              <strong className="text-red-400 block">Red Bag (Sanitary):</strong>
              Diapers, bandages, sanitary napkins (wrapped in paper with red mark).
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs btn-3d"
          >
            Close & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { User } from 'firebase/auth';
import { AppState } from '../../types';
import { User as UserIcon, Sun, Moon, ShieldCheck, LogOut, ChevronRight, CalendarRange } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  data: AppState;
  onToggleTheme: () => void;
  onSetupPin: () => void;
  onLogout: () => void;
  onOpenHistory?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  data,
  onToggleTheme,
  onSetupPin,
  onLogout,
  onOpenHistory
}) => {
  return (
    <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="p-8 sm:p-12 flex flex-col items-center bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-800">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-8 border-white dark:border-slate-900 shadow-2xl overflow-hidden flex items-center justify-center mb-4 sm:mb-6">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={52} className="text-slate-300" />
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{user.displayName || 'Pengguna'}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{user.email}</p>
        </div>

        <div className="p-3 sm:p-4 space-y-1">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400">
                  <History size={20} />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                  Riwayat Aktivitas
                </span>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {data.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                {data.theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              </span>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onSetupPin}
            className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <ShieldCheck size={20} />
              </div>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Setel Pengamanan PIN</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase ${
                  data.security?.isPinEnabled ? 'bg-success/10 text-success' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {data.security?.isPinEnabled ? 'AKTIF' : 'TIDAK AKTIF'}
              </span>
              <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={onLogout}
            className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/20 text-danger transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 text-danger">
                <LogOut size={20} />
              </div>
              <span className="font-bold text-sm">Keluar dari Aplikasi</span>
            </div>
            <ChevronRight size={18} className="text-danger/40 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="p-8 text-center opacity-30">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">LimitWatch Digital Assets © 2026</p>
        </div>
      </div>
    </div>
  );
};

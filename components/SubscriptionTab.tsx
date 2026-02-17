
import React from 'react';
import { SupportedLanguage, UserStatus } from '../types';

interface SubscriptionTabProps {
  userStatus: UserStatus;
  language: SupportedLanguage;
  onSubscribe: () => void;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ userStatus, language, onSubscribe }) => {
  const getLabels = () => {
    switch (language) {
      case 'Bangla': return { 
        title: 'Smart Echo প্রিমিয়াম', 
        subtitle: 'আপনার গণিত শেখার অভিজ্ঞতাকে আরও উন্নত করুন bKash দিয়ে।',
        btn: 'bKash দিয়ে কিনুন – ১০০৳/মাস',
        activeTitle: 'আপনার প্রিমিয়াম সচল আছে',
        activeSubtitle: 'আপনি এখন আনলিমিটেড এক্সেস উপভোগ করছেন।'
      };
      default: return { 
        title: 'Smart Echo Premium', 
        subtitle: 'Elevate your math learning experience via bKash.',
        btn: 'Buy via bKash – ৳100/mo',
        activeTitle: 'Premium Active',
        activeSubtitle: 'You are enjoying unlimited access.'
      };
    }
  };

  const labels = getLabels();

  const features = [
    { icon: 'fa-infinity', title: 'Unlimited Solves', desc: 'Solve as many problems as you need, any time.' },
    { icon: 'fa-microphone', title: 'Mentor Voice Mode', desc: 'Listen to clear voice-friendly explanations.' },
    { icon: 'fa-comments', title: 'Interactive Chat', desc: 'Ask follow-up questions like "Why?" or "Explain step 2".' },
    { icon: 'fa-globe', title: 'Full Multi-language', desc: 'Switch languages seamlessly with advanced reasoning.' },
    { icon: 'fa-bolt', title: 'Live Live API', desc: 'Talk to the AI mentor in real-time for better flow.' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-40">
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 gradient-mono rounded-[32px] flex items-center justify-center text-white dark:text-black text-5xl shadow-2xl animate-pulse relative">
            <i className="fas fa-crown"></i>
            <div className="absolute inset-0 rounded-[32px] ring-4 ring-black/10 dark:ring-white/10 animate-ping"></div>
          </div>
          {userStatus === 'premium' && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white dark:border-[#0B0C10] flex items-center justify-center text-white text-base shadow-lg">
              <i className="fas fa-check"></i>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            {userStatus === 'premium' ? labels.activeTitle : labels.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
            {userStatus === 'premium' ? labels.activeSubtitle : labels.subtitle}
          </p>
        </div>
      </div>

      {userStatus === 'free' && (
        <div className="bg-[#E2136E]/5 dark:bg-[#E2136E]/10 p-6 rounded-[32px] border border-[#E2136E]/20 flex items-center gap-5 shadow-inner">
           <div className="w-12 h-12 bg-[#E2136E] rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-pink-500/20">
              <i className="fas fa-wallet"></i>
           </div>
           <div className="flex-1">
              <h4 className="font-black text-[#E2136E] text-sm uppercase tracking-widest">bKash Secure Gateway</h4>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Secure, fast, and instant activation.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {features.map((feat, i) => (
          <div 
            key={i} 
            className="group bg-white dark:bg-graphite p-6 rounded-[32px] border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-sm hover:border-black/30 dark:hover:border-white/30 transition-all hover:shadow-md"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 text-black dark:text-white flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-inner">
              <i className={`fas ${feat.icon}`}></i>
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 dark:text-white leading-tight">{feat.title}</h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {userStatus === 'free' && (
        <div className="pt-4">
          <button 
            onClick={onSubscribe}
            className="w-full py-6 rounded-[32px] gradient-pink text-white font-black text-xl shadow-2xl shadow-pink-500/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-shopping-cart"></i>
            {labels.btn}
          </button>
          <p className="text-center mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Securely powered by bKash &bull; Instant Access
          </p>
        </div>
      )}
    </div>
  );
};

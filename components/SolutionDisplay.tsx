
import React from 'react';
import { MathAnalysis, SupportedLanguage } from '../types';

interface SolutionDisplayProps {
  analysis: MathAnalysis;
  language: SupportedLanguage;
}

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ analysis, language }) => {
  const isRTL = language === 'Arabic' || language === 'Urdu';
  const hasSteps = analysis.steps && analysis.steps.length > 0;
  
  const labels = {
    problem: language === 'Arabic' ? 'تحليل المسألة' : language === 'Urdu' ? 'مسئلہ کی وضاحت' : language === 'Hindi' ? 'सवाल की व्याख्या' : language === 'Bangla' ? 'সমস্যার বিশ্লেষণ' : 'Analysis',
    correction: language === 'Arabic' ? 'تصحيح الأخطاء' : language === 'Urdu' ? 'غلطی کی اصلاح' : language === 'Hindi' ? 'गलती सुधार' : language === 'Bangla' ? 'ভুল সংশোধন' : 'Verification',
    steps: language === 'Arabic' ? 'خطوات الحل' : language === 'Urdu' ? 'حل کے مراحل' : language === 'Hindi' ? 'समाधान के चरण' : language === 'Bangla' ? 'সমাধানের ধাপসমূহ' : 'Solution Steps',
    answer: language === 'Arabic' ? 'النتيجة النهائية' : language === 'Urdu' ? 'حتمی نتیجہ' : language === 'Hindi' ? 'अंतिम परिणाम' : language === 'Bangla' ? 'চূড়ান্ত ফলাফল' : 'Final Result',
    tips: language === 'Arabic' ? 'نصيحة المعلم' : language === 'Urdu' ? 'استاد کی نصیحت' : language === 'Hindi' ? 'शिक्षक का सुझाव' : language === 'Bangla' ? 'শিক্ষকের পরামর্শ' : 'Mentor Insights',
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Detected Problem Transcription */}
      <div className="bg-white dark:bg-graphite p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden group">
        <div className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-slate-300 dark:text-white/40 shadow-sm">
            <i className={`fas ${hasSteps ? 'fa-quote-left' : 'fa-camera'} text-sm`}></i>
          </div>
          <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-300 dark:text-white/20">{labels.problem}</h3>
        </div>
        <p className={`font-black text-slate-800 dark:text-white leading-[1.1] tracking-tight ${hasSteps ? 'text-3xl' : 'text-2xl'}`}>
          {analysis.detectedProblem}
        </p>
      </div>

      {/* Mistake Correction Module */}
      {analysis.mistakeCorrection && (
        <div className="bg-indigo-50/50 dark:bg-white/5 p-10 rounded-[48px] border border-indigo-100 dark:border-white/10 relative overflow-hidden">
          <div className={`flex items-center gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 rounded-2xl bg-midnight dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl">
              <i className="fas fa-lightbulb text-sm"></i>
            </div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-indigo-900/40 dark:text-white/60">{labels.correction}</h3>
          </div>
          <p className="text-slate-700 dark:text-white/80 text-xl font-bold leading-relaxed italic">
            "{analysis.mistakeCorrection}"
          </p>
        </div>
      )}

      {/* Steps */}
      {hasSteps && (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-6">
             <h3 className="font-black text-[10px] uppercase tracking-[0.5em] text-slate-300 dark:text-white/10">{labels.steps}</h3>
             <span className="text-[9px] font-black text-slate-400 dark:text-white/40 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 uppercase tracking-widest">{analysis.steps.length} Phases</span>
          </div>
          
          <div className="space-y-4">
            {analysis.steps.map((step, idx) => (
              <div key={idx} className="bg-white dark:bg-graphite p-10 rounded-[40px] shadow-xl border border-gray-100 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <div className={`flex items-start gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                   <span className="flex-shrink-0 w-12 h-12 rounded-[20px] bg-midnight dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-lg border border-gray-200 dark:border-white/10 shadow-2xl">
                     {idx + 1}
                   </span>
                   <div className="space-y-3 pt-1">
                     <h4 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">{step.title}</h4>
                     <p className="text-slate-500 dark:text-white/40 leading-relaxed font-medium text-base">{step.description}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Answer Highlight */}
      {analysis.finalAnswer && (
        <div className="bg-white dark:bg-white p-16 rounded-[56px] text-black shadow-3xl text-center relative overflow-hidden group apple-scan">
          {/* Decorative Corners with position:absolute fixed via CSS */}
          <div className="corner-tl"></div>
          <div className="corner-tr"></div>
          <div className="corner-bl"></div>
          <div className="corner-br"></div>
          
          <div className="relative z-10 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20 block">{labels.answer}</span>
            <div className="text-6xl md:text-8xl font-black tracking-tighter leading-none break-words px-4">
              {analysis.finalAnswer}
            </div>
          </div>
        </div>
      )}
      
      {/* Mentor Insights */}
      {analysis.tips && analysis.tips.length > 0 && (
        <div className="bg-slate-100 dark:bg-midnight p-10 rounded-[48px] flex flex-col gap-6 border border-gray-200 dark:border-white/5">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/60 shrink-0 text-lg">
               <i className="fas fa-microchip"></i>
            </div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-300 dark:text-white/20">{labels.tips}</h3>
          </div>
          <ul className="space-y-4">
             {analysis.tips.map((tip, i) => (
               <li key={i} className="flex gap-4 items-start text-base font-bold text-slate-400 dark:text-white/50 italic leading-snug">
                 <span className="text-slate-300 dark:text-white/20 mt-1">•</span>
                 <span>{tip}</span>
               </li>
             ))}
          </ul>
        </div>
      )}
    </div>
  );
};

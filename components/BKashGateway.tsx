
import React, { useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';

interface BKashGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: SupportedLanguage;
}

type PaymentStep = 'number' | 'otp' | 'pin' | 'processing' | 'success';

export const BKashGateway: React.FC<BKashGatewayProps> = ({ isOpen, onClose, onSuccess, language }) => {
  const [step, setStep] = useState<PaymentStep>('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('number');
      setPhoneNumber('');
      setOtp('');
      setPin('');
      setIsVerifying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const t = {
    Bangla: {
      header: 'bKash পেমেন্ট',
      amount: 'পরিমান: ৳১০০.০০',
      numberLabel: 'আপনার bKash অ্যাকাউন্ট নম্বর দিন',
      otpLabel: 'আপনার মোবাইলে পাঠানো ওটিপি (OTP) দিন',
      pinLabel: 'আপনার bKash পিন (PIN) দিন',
      confirm: 'নিশ্চিত করুন',
      next: 'পরবর্তী',
      verifying: 'যাচাই করা হচ্ছে...',
      success: 'পেমেন্ট সফল হয়েছে!',
      close: 'বন্ধ করুন',
    },
    English: {
      header: 'bKash Payment',
      amount: 'Amount: ৳100.00',
      numberLabel: 'Enter your bKash Account Number',
      otpLabel: 'Enter the OTP sent to your phone',
      pinLabel: 'Enter your bKash PIN',
      confirm: 'Confirm',
      next: 'Next',
      verifying: 'Verifying...',
      success: 'Payment Successful!',
      close: 'Close',
    },
    Hindi: {
      header: 'bKash भुगतान',
      amount: 'राशि: ৳100.00',
      numberLabel: 'अपना bKash खाता नंबर दर्ज करें',
      otpLabel: 'ओटीपी दर्ज करें',
      pinLabel: 'पिन दर्ज करें',
      confirm: 'पुष्टि करें',
      next: 'अगला',
      verifying: 'सत्यापित किया जा रहा है...',
      success: 'भुगतान सफल!',
      close: 'बंद करें',
    },
    Urdu: {
      header: 'bKash ادائیگی',
      amount: 'رقم: ৳100.00',
      numberLabel: 'اپنا bKash اکاؤنٹ نمبر درج کریں',
      otpLabel: 'او ٹی پی درج کریں',
      pinLabel: 'پن درج کریں',
      confirm: 'تصدیق کریں',
      next: 'اگلا',
      verifying: 'تصدیق ہو رہی ہے...',
      success: 'ادائیگی کامیاب!',
      close: 'بند کریں',
    },
    Arabic: {
      header: 'دفع bKash',
      amount: 'المبلغ: ৳100.00',
      numberLabel: 'أدخل رقم حساب bKash الخاص بك',
      otpLabel: 'أدخل رمز التحقق',
      pinLabel: 'أدخل رقمك السري',
      confirm: 'تأكيد',
      next: 'التالي',
      verifying: 'جارٍ التحقق...',
      success: 'تم الدفع بنجاح!',
      close: 'إإغلاق',
    }
  }[language] || {
    header: 'bKash Payment',
    amount: 'Amount: ৳100.00',
    numberLabel: 'Enter your bKash Account Number',
    otpLabel: 'Enter the OTP sent to your phone',
    pinLabel: 'Enter your bKash PIN',
    confirm: 'Confirm',
    next: 'Next',
    verifying: 'Verifying...',
    success: 'Payment Successful!',
    close: 'Close',
  };

  const handleNext = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (step === 'number') setStep('otp');
      else if (step === 'otp') setStep('pin');
      else if (step === 'pin') {
        setStep('processing');
        setTimeout(() => {
          setStep('success');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }, 2000);
      }
    }, 800);
  };

  const isRTL = language === 'Arabic' || language === 'Urdu';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[360px] rounded-[48px] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* bKash Banner Header */}
        <div className="bg-[#E2136E] p-10 flex flex-col items-center gap-6 relative overflow-hidden">
          <i className="fas fa-wallet absolute -bottom-4 -left-4 text-white/5 text-[120px] rotate-12"></i>
          
          <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-20">
            <i className="fas fa-times text-lg"></i>
          </button>
          
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl p-4 z-10 transition-transform hover:scale-105">
            <img 
              src="https://logos-download.com/wp-content/uploads/2022/01/BKash_Logo.png" 
              alt="bKash" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('flex-col');
                const fallback = document.createElement('div');
                fallback.innerHTML = '<i class="fas fa-mobile-screen text-[#E2136E] text-2xl mb-1"></i><span class="text-[8px] font-black text-[#E2136E]">BKASH</span>';
                fallback.className = 'flex flex-col items-center justify-center h-full';
                e.currentTarget.parentElement?.appendChild(fallback);
              }}
            />
          </div>
          <div className="text-center text-white z-10 space-y-1">
            <h2 className="font-black text-xl tracking-tight leading-none">{t.header}</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50">Smart Echo Premium</p>
          </div>
        </div>

        {/* Amount Info */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center px-10">
           <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
             <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#E2136E] text-lg shadow-sm">
               <i className="fas fa-shopping-basket"></i>
             </div>
             <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Merchant</p>
                <p className="text-sm font-black text-slate-800">Smart Echo</p>
             </div>
           </div>
           <p className="text-2xl font-black text-[#E2136E] tracking-tighter">{t.amount}</p>
        </div>

        {/* Main Form Body */}
        <div className="p-10 flex-1 min-h-[300px] flex flex-col justify-center">
          {isVerifying ? (
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
               <div className="w-12 h-12 border-4 border-slate-100 border-t-[#E2136E] rounded-full animate-spin"></div>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{t.verifying}</p>
            </div>
          ) : (
            <>
              {step === 'number' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="text-center space-y-6">
                    <p className="text-base font-bold text-slate-600 px-4">{t.numberLabel}</p>
                    <div className="relative">
                      <input 
                        autoFocus
                        type="text" 
                        maxLength={11}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="01XXXXXXXXX"
                        className="w-full text-center text-3xl font-black tracking-[0.2em] py-4 border-b-2 border-slate-100 focus:border-[#E2136E] outline-none transition-all placeholder:text-slate-100 text-[#E2136E]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 'otp' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="text-center space-y-6">
                    <p className="text-base font-bold text-slate-600 px-4">{t.otpLabel}</p>
                    <input 
                      autoFocus
                      type="text" 
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXXXX"
                      className="w-full text-center text-4xl font-black tracking-[0.4em] py-4 border-b-2 border-slate-100 focus:border-[#E2136E] outline-none transition-all placeholder:text-slate-100 text-[#E2136E]"
                    />
                  </div>
                </div>
              )}

              {step === 'pin' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="text-center space-y-6">
                    <p className="text-base font-bold text-slate-600 px-4">{t.pinLabel}</p>
                    <input 
                      autoFocus
                      type="password" 
                      maxLength={5}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="•••••"
                      className="w-full text-center text-5xl font-black tracking-[0.2em] py-4 border-b-2 border-slate-100 focus:border-[#E2136E] outline-none transition-all text-[#E2136E]"
                    />
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center space-y-6 py-10 animate-in zoom-in-95 duration-500 text-center">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-5xl shadow-inner relative">
                    <i className="fas fa-check"></i>
                    <div className="absolute inset-0 rounded-full ring-8 ring-emerald-500/10 animate-ping"></div>
                  </div>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">{t.success}</p>
                </div>
              )}
            </>
          )}
        </div>

        {['number', 'otp', 'pin'].includes(step) && !isVerifying && (
          <div className="bg-slate-50 flex h-20">
            <button 
              onClick={onClose}
              className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-100 transition-colors border-r border-white"
            >
              {t.close}
            </button>
            <button 
              onClick={handleNext}
              disabled={
                (step === 'number' && phoneNumber.length < 11) || 
                (step === 'otp' && otp.length < 6) || 
                (step === 'pin' && pin.length < 5)
              }
              className={`flex-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                ((step === 'number' && phoneNumber.length === 11) || 
                 (step === 'otp' && otp.length === 6) || 
                 (step === 'pin' && pin.length === 5))
                ? 'bg-[#E2136E] text-white shadow-2xl' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {step === 'pin' ? t.confirm : t.next}
            </button>
          </div>
        )}

        <div className="bg-[#E2136E] p-4 text-center">
          <div className="flex items-center justify-center gap-3 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
            <i className="fas fa-lock text-[8px]"></i>
            Secure Gateway &bull; bKash
          </div>
        </div>
      </div>
    </div>
  );
};

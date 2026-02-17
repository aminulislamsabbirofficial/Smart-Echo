
import React, { useState, useRef, useEffect } from 'react';
import { MathAnalysis, SupportedLanguage, ChatMessage } from '../types.ts';
import { createTeacherChat, generateSpeech, decodeAudioData, withRetry } from '../services/geminiService.ts';

interface ChatInteractionProps {
  analysis: MathAnalysis;
  language: SupportedLanguage;
}

export const ChatInteraction: React.FC<ChatInteractionProps> = ({ analysis, language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isRTL = language === 'Arabic' || language === 'Urdu';

  const labels = {
    title: language === 'Arabic' ? 'هل لا تزال مرتبكًا؟ اسأل Smart Echo' : language === 'Urdu' ? 'کیا آپ اب بھی الجھن میں ہیں؟ Smart Echo سے پوچھیں' : language === 'Hindi' ? 'अभी भी उलझन में हैं? Smart Echo से पूछें' : language === 'Bangla' ? 'এখনও বিভ্রান্ত? Smart Echo কে জিজ্ঞাসা করো' : 'Still Confused? Ask Smart Echo',
    placeholder: language === 'Arabic' ? 'اكتب سؤالك هنا...' : language === 'Urdu' ? 'اپنا سوال یہاں ٹائپ کریں...' : language === 'Hindi' ? 'अपना प्रश्न यहाँ लिखें...' : language === 'Bangla' ? 'তোমার প্রশ্ন এখানে লিখো...' : 'Type your question here...',
    suggestions: [
      language === 'Bangla' ? 'ধাপ ১ আবার বুঝাও' : 'Explain Step 1',
      language === 'Bangla' ? 'ধাপ ২ আবার বুঝাও' : 'Explain Step 2',
      language === 'Bangla' ? 'অন্য নিয়ম দেখাও' : 'Show Another Method',
      language === 'Bangla' ? 'একইরকম উদাহরণ দাও' : 'Give Similar Example'
    ],
    quotaError: "Our classroom's daily budget is full! Please check your billing details."
  };

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = createTeacherChat(analysis, language);
    }
  }, [analysis, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setPlayingId(null);
  };

  const handlePlayVoice = async (message: ChatMessage) => {
    if (playingId === message.id) {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayingId(message.id);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const pcmData = await generateSpeech(message.text);
      const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setPlayingId(null);
      
      audioSourceRef.current = source;
      source.start();
    } catch (err) {
      console.error("Speech generation failed", err);
      setPlayingId(null);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await withRetry(async () => {
        return await chatRef.current.sendMessage({ message: text.trim() });
      });
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: result.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const status = err?.status || err?.error?.status;
      const isQuotaError = status === 429 || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("RESOURCES_EXHAUSTED");

      let errorText = "I'm sorry, I lost my train of thought for a moment. Can you ask that again?";
      
      if (isQuotaError) {
        errorText = labels.quotaError;
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: errorText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mt-12 space-y-6 animate-in slide-in-from-bottom-10 duration-700">
      <div className="flex items-center gap-4 px-4">
        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/20">
          <i className="fas fa-comments text-sm"></i>
        </div>
        <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-300 dark:text-white/10">{labels.title}</h3>
      </div>

      <div className="bg-white dark:bg-slate-900/50 rounded-[40px] border border-gray-200 dark:border-white/5 overflow-hidden shadow-xl flex flex-col">
        {/* Chat History */}
        <div className="flex-1 min-h-[200px] max-h-[500px] overflow-y-auto p-8 space-y-4 no-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6 opacity-30 dark:opacity-10">
              <i className="fas fa-graduation-cap text-6xl text-slate-800 dark:text-white"></i>
              <p className="text-sm font-bold leading-relaxed max-w-[240px] text-slate-500 dark:text-white">
                Our lesson isn't over. Ask anything about the solution steps!
              </p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-300`}
            >
              <div className={`relative max-w-[85%] px-6 py-4 rounded-[28px] shadow-sm text-sm font-medium leading-relaxed ${
                msg.sender === 'user' 
                ? 'bg-midnight dark:bg-white text-white dark:text-midnight rounded-tr-none' 
                : 'bg-slate-100 dark:bg-graphite text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-white/5 rounded-tl-none'
              }`}>
                {msg.text}
                
                {msg.sender === 'ai' && !msg.text.includes("budget is full") && (
                  <button 
                    onClick={() => handlePlayVoice(msg)}
                    className={`mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${
                      playingId === msg.id 
                      ? 'bg-midnight dark:bg-white text-white dark:text-midnight' 
                      : 'bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:opacity-80'
                    }`}
                  >
                    {playingId === msg.id ? (
                      <>
                        <div className="flex gap-1">
                          <span className="w-1 h-2.5 bg-current opacity-60 wave-bar"></span>
                        </div>
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-volume-up"></i>
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-graphite px-6 py-5 rounded-[28px] rounded-tl-none border border-gray-200 dark:border-white/5">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/20 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/20 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/20 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <div className="px-8 py-5 flex gap-3 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
          {labels.suggestions.map((s, idx) => (
            <button 
              key={idx}
              onClick={() => handleSend(s)}
              className="flex-shrink-0 px-5 py-2.5 rounded-full bg-white dark:bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 border border-gray-200 dark:border-white/5 shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-8 pt-4">
          <div className="relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={labels.placeholder}
              className="w-full bg-white dark:bg-graphite pl-8 pr-16 py-5 rounded-full border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-1 ring-black/5 dark:ring-white/10 transition-all font-bold text-sm text-slate-800 dark:text-white shadow-2xl"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !isTyping 
                ? 'bg-midnight dark:bg-white text-white dark:text-midnight shadow-lg hover:scale-105' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-white/10'
              }`}
            >
              <i className={`fas fa-paper-plane text-xs ${isRTL ? 'rotate-180' : ''}`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

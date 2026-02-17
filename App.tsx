
import React, { useState, useRef, useEffect } from 'react';
import { analyzeMathProblem, generateSpeech, decodeAudioData, getGeminiAI, createPcmBlob, decode } from './services/geminiService';
import { MathAnalysis, AudioState, SupportedLanguage, RecentSolution } from './types';
import { SolutionDisplay } from './components/SolutionDisplay';
import { ChatInteraction } from './components/ChatInteraction';
import { Modality, LiveServerMessage } from '@google/genai';

const LANGUAGES: SupportedLanguage[] = ['English', 'Bangla', 'Hindi', 'Urdu', 'Arabic'];

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MathAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('English');
  const [recentSolutions, setRecentSolutions] = useState<RecentSolution[]>([]);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCameraHelp, setShowCameraHelp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [showMicHelp, setShowMicHelp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('smart_echo_theme_mode');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) { return false; }
  });
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<{user: string, ai: string}[]>([]);
  
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const liveSessionRef = useRef<any>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveAudioContextRef = useRef<AudioContext | null>(null);
  const liveNextStartTimeRef = useRef<number>(0);
  const liveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smart_echo_history_v2');
      if (saved) setRecentSolutions(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smart_echo_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smart_echo_theme_mode', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      setAudioState(p => ({...p, error: "Camera access requires HTTPS. Please ensure you are on a secure connection."}));
      return;
    }

    setCameraError(null);
    setShowCameraHelp(false);

    const tryGetMedia = async (constraints: MediaStreamConstraints) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setIsCameraOpen(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        return true;
      } catch (err: any) {
        return err;
      }
    };

    let result = await tryGetMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });

    if (result instanceof Error && result.name !== 'NotAllowedError' && result.name !== 'PermissionDeniedError') {
      result = await tryGetMedia({ video: true, audio: false });
    }

    if (result instanceof Error) {
      const name = result.name || '';
      const msg = result.message || '';
      const isPermissionDenied = name === 'NotAllowedError' || name === 'PermissionDeniedError' || msg.toLowerCase().includes('denied');
      if (isPermissionDenied) setShowCameraHelp(true);
      else setCameraError(`Could not access camera. Please check your connection.`);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImage(dataUrl);
        stopCamera();
        setAnalysis(null);
        setShowCelebrate(false);
        stopAudio();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setShowCelebrate(false);
        stopAudio();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setAudioState(prev => ({ ...prev, error: null }));
    try {
      const result = await analyzeMathProblem(image, selectedLanguage);
      setAnalysis(result);
      if (result.steps && result.steps.length > 0) {
        const newSolution: RecentSolution = {
          id: Date.now().toString(),
          title: result.detectedProblem.slice(0, 30) + (result.detectedProblem.length > 30 ? '...' : ''),
          language: selectedLanguage,
          date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          image: image,
          analysis: result
        };
        const updated = [newSolution, ...recentSolutions.slice(0, 9)];
        setRecentSolutions(updated);
        localStorage.setItem('smart_echo_history_v2', JSON.stringify(updated));
        setShowCelebrate(true);
        setTimeout(() => setShowCelebrate(false), 3000);
      }
    } catch (err: any) {
      setAudioState(prev => ({ ...prev, error: "Teacher's voice had a tiny catch. Let's try again!" }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  };

  const handlePlayVoice = async () => {
    if (!analysis) return;
    if (audioState.isPlaying) {
      stopAudio();
      return;
    }
    setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      await audioContextRef.current.resume();
      const pcmData = await generateSpeech(analysis.voiceOutput);
      const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setAudioState(prev => ({ ...prev, isPlaying: false }));
      audioSourceRef.current = source;
      source.start();
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    } catch (err) {
      setAudioState(prev => ({ ...prev, error: "Teacher's voice unavailable." }));
    } finally {
      setAudioState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const startLiveMentor = async () => {
    if (!analysis) return;
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      setAudioState(p => ({...p, error: "Microphone access requires HTTPS."}));
      return;
    }
    if (liveStreamRef.current) liveStreamRef.current.getTracks().forEach(t => t.stop());
    setAudioState(p => ({...p, error: null}));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      liveStreamRef.current = stream;
      setIsLiveMode(true);
      setLiveTranscription([]);
      setShowMicHelp(false);
      const ai = getGeminiAI();
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await inputAudioCtx.resume();
      await outputAudioCtx.resume();
      liveAudioContextRef.current = outputAudioCtx;
      let currentInputTranscription = '';
      let currentOutputTranscription = '';
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => { if (session) session.sendRealtimeInput({ media: pcmBlob }); });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) currentInputTranscription += message.serverContent.inputTranscription.text;
            if (message.serverContent?.outputTranscription) currentOutputTranscription += message.serverContent.outputTranscription.text;
            if (message.serverContent?.turnComplete) {
              setLiveTranscription(prev => [...prev, { user: currentInputTranscription, ai: currentOutputTranscription }]);
              currentInputTranscription = ''; currentOutputTranscription = '';
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              liveNextStartTimeRef.current = Math.max(liveNextStartTimeRef.current, outputAudioCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioCtx, 24000, 1);
              const source = outputAudioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioCtx.destination);
              source.addEventListener('ended', () => liveSourcesRef.current.delete(source));
              source.start(liveNextStartTimeRef.current);
              liveNextStartTimeRef.current += audioBuffer.duration;
              liveSourcesRef.current.add(source);
            }
          },
          onclose: () => stopLiveMentor(),
          onerror: () => stopLiveMentor()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: `You are Smart Echo, a friendly AI Math Tutor. Help the student with: "${analysis.detectedProblem}"`
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err: any) {
      setShowMicHelp(true);
      setIsLiveMode(false);
    }
  };

  const stopLiveMentor = () => {
    if (liveSessionRef.current) { try { liveSessionRef.current.close(); } catch(e) {} liveSessionRef.current = null; }
    if (liveStreamRef.current) { liveStreamRef.current.getTracks().forEach(track => track.stop()); liveStreamRef.current = null; }
    liveSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    liveSourcesRef.current.clear();
    setIsLiveMode(false);
  };

  const reset = () => {
    setImage(null); setAnalysis(null); setShowCelebrate(false);
    stopLiveMentor(); stopAudio(); stopCamera();
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen pb-20 transition-colors duration-500">
      <header className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-white/5 shadow-xl">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={reset}>
          <div className="relative">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg transition-transform group-hover:scale-110">
               <i className="fas fa-graduation-cap text-lg"></i>
            </div>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800 dark:text-white">Smart Echo</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/5 transition-all">
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)} className="appearance-none bg-white dark:bg-graphite text-slate-800 dark:text-white px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] border border-gray-200 dark:border-white/5 shadow-sm focus:outline-none">
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {!analysis ? (
          <div className="space-y-16 animate-in fade-in duration-1000">
            <div className="text-center space-y-6">
               <h2 className="text-5xl md:text-7xl font-black leading-[1] tracking-tighter text-slate-900 dark:text-white">Solving math.<br/><span className="text-slate-400 dark:text-white/20">Brilliant feedback.</span></h2>
            </div>
            <div className="relative space-y-6">
              <input type="file" ref={galleryInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              <canvas ref={canvasRef} className="hidden" />
              {isCameraOpen ? (
                <div className="relative aspect-square md:aspect-[4/3] rounded-[48px] overflow-hidden bg-black shadow-3xl border border-white/5 animate-in zoom-in-95 duration-500">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
                    <button onClick={stopCamera} className="w-12 h-12 glass rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"><i className="fas fa-times"></i></button>
                  </div>
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8">
                     <button onClick={capturePhoto} className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-midnight shadow-2xl hover:scale-105 active:scale-90 transition-all group">
                        <div className="w-20 h-20 rounded-full border-4 border-midnight/10 flex items-center justify-center"><i className="fas fa-camera text-2xl"></i></div>
                     </button>
                  </div>
                </div>
              ) : !image ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={startCamera} className="w-full bg-white dark:bg-white h-64 rounded-[40px] flex flex-col items-center justify-center text-black gap-5 shadow-2xl hover:scale-[1.01] active:scale-95 transition-all group overflow-hidden relative border border-gray-100 dark:border-none">
                    <div className="w-24 h-24 bg-black/5 rounded-[28px] flex items-center justify-center text-4xl group-hover:scale-105 transition-transform relative apple-scan"><div className="corner-tl"></div><div className="corner-tr"></div><div className="corner-bl"></div><div className="corner-br"></div><i className="fas fa-camera text-black/90"></i></div>
                    <div className="text-center"><span className="font-black text-xl block">Take Photo</span></div>
                  </button>
                  <button onClick={() => galleryInputRef.current?.click()} className="w-full bg-slate-100 dark:bg-graphite h-64 rounded-[40px] flex flex-col items-center justify-center text-slate-800 dark:text-white gap-5 shadow-2xl border border-white/5 hover:scale-[1.01] active:scale-95 transition-all group overflow-hidden relative">
                    <div className="w-24 h-24 bg-white dark:bg-white/5 text-slate-400 dark:text-white/80 rounded-[28px] flex items-center justify-center text-4xl group-hover:scale-105 transition-transform border border-gray-200 dark:border-white/5"><i className="fas fa-images"></i></div>
                    <div className="text-center"><span className="font-black text-xl block">Gallery</span></div>
                  </button>
                </div>
              ) : (
                <div className="space-y-8 celebrate">
                  <div className="relative aspect-square md:aspect-[4/3] rounded-[48px] overflow-hidden bg-white dark:bg-midnight shadow-3xl border border-gray-100 dark:border-white/5">
                    <img src={image} alt="Problem" className="w-full h-full object-contain p-6" />
                    <button onClick={reset} className="absolute top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-red-500 hover:scale-110 active:scale-90 transition-all"><i className="fas fa-times text-xl"></i></button>
                  </div>
                  <button onClick={handleAnalyze} disabled={isAnalyzing} className={`w-full py-6 rounded-full font-black text-lg shadow-2xl transition-all ${isAnalyzing ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-white/10' : 'bg-midnight dark:bg-white text-white dark:text-midnight hover:-translate-y-1 active:scale-95'}`}>
                    {isAnalyzing ? "Teacher is analyzing..." : 'Explain My Problem'}
                  </button>
                </div>
              )}
            </div>
            {recentSolutions.length > 0 && !image && !isCameraOpen && (
              <div className="space-y-6 pt-10">
                <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-300 dark:text-white/10 px-4">Recents</h3>
                <div className="grid grid-cols-1 gap-3">
                  {recentSolutions.map(sol => (
                    <div key={sol.id} onClick={() => { setImage(sol.image); setAnalysis(sol.analysis); setSelectedLanguage(sol.language); }} className="bg-white dark:bg-graphite p-6 rounded-[32px] border border-gray-100 dark:border-white/[0.03] flex items-center gap-6 cursor-pointer hover:border-black/20 dark:hover:border-white/10 transition-all group shadow-sm">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-black flex-shrink-0 border border-gray-100 dark:border-white/5"><img src={sol.image} className="w-full h-full object-cover opacity-60 dark:opacity-30 group-hover:opacity-100 dark:group-hover:opacity-70 transition-opacity" /></div>
                      <div className="flex-1 min-w-0"><h4 className="font-bold truncate text-slate-800 dark:text-white/70 group-hover:text-black dark:group-hover:text-white">{sol.title}</h4></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
             <button onClick={reset} className="flex items-center gap-3 py-3 px-8 rounded-full glass text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30 hover:text-black dark:hover:text-white transition-all shadow-sm"><i className="fas fa-chevron-left text-[8px]"></i> <span>New Scan</span></button>
             <div className="relative overflow-hidden bg-white dark:bg-graphite rounded-[60px] p-12 text-slate-800 dark:text-white shadow-3xl flex flex-col items-center border border-gray-100 dark:border-white/5">
                <div className="relative z-10 flex flex-col items-center text-center w-full">
                   <div className="space-y-3 mb-12">
                      <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black shadow-xl"><i className="fas fa-graduation-cap text-2xl"></i></div>
                      <h3 className="text-3xl font-black tracking-tighter">Audio Feedback</h3>
                   </div>
                   <div className="flex gap-6">
                     <button onClick={handlePlayVoice} disabled={audioState.isLoading || isLiveMode} className={`group w-24 h-24 rounded-full flex items-center justify-center transition-all ${audioState.isPlaying ? 'bg-black dark:bg-white text-white dark:text-black scale-105 shadow-3xl' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white border border-gray-200 dark:border-white/10 shadow-xl hover:scale-105 active:scale-95'}`}>
                        {audioState.isLoading ? <i className="fas fa-spinner fa-spin"></i> : audioState.isPlaying ? <i className="fas fa-pause text-xl"></i> : <i className="fas fa-play ml-1 text-xl"></i>}
                     </button>
                     <button onClick={isLiveMode ? stopLiveMentor : startLiveMentor} className={`group w-24 h-24 rounded-full flex items-center justify-center transition-all ${isLiveMode ? 'bg-red-500 text-white scale-105 shadow-3xl' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white border border-gray-200 dark:border-white/10 shadow-xl hover:scale-105 active:scale-95'}`}>
                        <i className={`fas ${isLiveMode ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
                     </button>
                   </div>
                </div>
             </div>
             <SolutionDisplay analysis={analysis} language={selectedLanguage} />
             <ChatInteraction analysis={analysis} language={selectedLanguage} />
          </div>
        )}
      </main>

      {showMicHelp && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/98 backdrop-blur-3xl" onClick={() => setShowMicHelp(false)}></div>
          <div className="relative bg-white dark:bg-graphite w-full max-w-md rounded-[56px] overflow-hidden shadow-3xl border border-gray-100 dark:border-white/5 p-12 text-center space-y-8">
             <div className="w-24 h-24 rounded-[32px] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-4xl mx-auto"><i className="fas fa-microphone-slash"></i></div>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Mic Permission Needed</h3>
             <p className="text-sm font-medium text-slate-500 dark:text-white/30">Please allow microphone access in your browser settings to talk to the mentor.</p>
             <button onClick={() => { setShowMicHelp(false); startLiveMentor(); }} className="w-full py-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-[0.3em]">Try Again</button>
          </div>
        </div>
      )}

      {showCameraHelp && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/98 backdrop-blur-3xl" onClick={() => setShowCameraHelp(false)}></div>
          <div className="relative bg-white dark:bg-graphite w-full max-w-md rounded-[56px] overflow-hidden shadow-3xl border border-gray-100 dark:border-white/5 p-12 text-center space-y-8">
             <div className="w-24 h-24 rounded-[32px] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-4xl mx-auto"><i className="fas fa-camera"></i></div>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Camera Permission Needed</h3>
             <p className="text-sm font-medium text-slate-500 dark:text-white/30">Please allow camera access to take photos of your math problems.</p>
             <button onClick={() => { setShowCameraHelp(false); startCamera(); }} className="w-full py-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-[0.3em]">Try Again</button>
          </div>
        </div>
      )}

      {audioState.error && (
        <div className="fixed bottom-10 left-6 right-6 z-[60] animate-in slide-in-from-bottom-full duration-500">
           <div className="bg-white dark:bg-white/5 backdrop-blur-3xl text-slate-800 dark:text-white px-10 py-6 rounded-[40px] shadow-3xl flex items-center justify-between border border-gray-200 dark:border-white/10">
              <span className="font-bold text-sm">{audioState.error}</span>
              <button onClick={() => setAudioState(p => ({ ...p, error: null }))} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"><i className="fas fa-times opacity-40"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;

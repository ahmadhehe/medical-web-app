import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { startScreening, finalizeScreening } from '../../services/screening.service';

export default function AiScreening() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const toast      = useToast();
  const bottomRef  = useRef(null);
  const sessionStart = useRef(new Date());

  const [screeningId,      setScreeningId]      = useState(null);
  const [messages,         setMessages]         = useState([]);
  const [input,            setInput]            = useState('');
  const [streaming,        setStreaming]        = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [starting,         setStarting]         = useState(true);
  const [finalizing,       setFinalizing]       = useState(false);

  // Start session on mount
  useEffect(() => {
    if (!user) return;
    startScreening(user.id)
      .then(({ data }) => {
        setScreeningId(data.sessionId);
        setMessages([{ role: 'assistant', content: data.message }]);
      })
      .catch(() => toast('Failed to start screening session'))
      .finally(() => setStarting(false));
  }, [user]);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || streaming || !screeningId) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setStreaming(true);
    setStreamingContent('');

    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/screenings/${screeningId}/message`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error('Stream failed');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';
      let   full    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // hold incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.chunk) {
              full += payload.chunk;
              setStreamingContent(full);
            }
            if (payload.done) {
              setMessages(prev => [...prev, { role: 'assistant', content: full }]);
              setStreamingContent('');
              setStreaming(false);
            }
          } catch { /* malformed line — skip */ }
        }
      }
    } catch {
      toast('Failed to send message');
      setStreaming(false);
      setStreamingContent('');
    }
  }

  async function handleFinalize() {
    if (!screeningId || finalizing) return;
    setFinalizing(true);
    try {
      await finalizeScreening(screeningId);
      navigate(`/patient/screening/results?id=${screeningId}`);
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to finalize screening');
      setFinalizing(false);
    }
  }

  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-full overflow-hidden font-display">

      {/* ── Info sidebar ── */}
      <aside className="w-[260px] bg-primary/10 dark:bg-primary/5 border-r border-primary/20 flex flex-col shrink-0">
        <div className="p-5 border-b border-primary/20">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary">medical_services</span>
            <h2 className="text-primary text-base font-bold tracking-tight">MediConnect AI</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white p-2 rounded-lg">
              <span className="material-symbols-outlined text-sm">colors_spark</span>
            </div>
            <div>
              <h3 className="text-sm font-bold">AI Health Assistant</h3>
              <p className="text-[10px] text-primary/70 uppercase tracking-widest font-semibold">Ready to help</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          {/* Patient card */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-primary/10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Patient</p>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.fullName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm truncate">{user?.fullName}</h4>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Session info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-xl shrink-0">timer</span>
              <div className="text-xs">
                <p className="font-medium">Screening Session</p>
                <p className="opacity-70">Started {formatTime(sessionStart.current)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-xl shrink-0">verified_user</span>
              <div className="text-xs">
                <p className="font-medium">Privacy Protected</p>
                <p className="opacity-70">End-to-end encryption</p>
              </div>
            </div>
          </div>
        </div>

        {/* Finish button */}
        <div className="p-5 space-y-2 shrink-0">
          <button
            onClick={handleFinalize}
            disabled={messages.length < 3 || finalizing || streaming}
            className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {finalizing
              ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              : <span className="material-symbols-outlined text-base">assignment_turned_in</span>
            }
            Finish Screening
          </button>
          <div className="flex items-center gap-2 p-3 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg text-[10px] text-slate-500">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>HIPAA Compliant Session</span>
          </div>
        </div>
      </aside>

      {/* ── Chat area ── */}
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
        {/* Header */}
        <header className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <h1 className="font-bold text-lg">AI Pre-Screening</h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider">
            <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Opening loader */}
          {starting && (
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 py-3 px-4 rounded-xl rounded-tl-none flex items-center gap-1">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) =>
            msg.role === 'assistant' ? (
              <div key={i} className="flex items-start gap-3 max-w-[80%]">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl rounded-tl-none">
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-start justify-end gap-3 ml-auto max-w-[80%]">
                <div className="bg-primary p-4 rounded-xl rounded-tr-none text-white shadow-md shadow-primary/20">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.fullName?.[0]?.toUpperCase() ?? '?'}
                </div>
              </div>
            )
          )}

          {/* Streaming bubble */}
          {streaming && (
            <div className="flex items-start gap-3 max-w-[80%]">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl rounded-tl-none">
                {streamingContent
                  ? <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">{streamingContent}</p>
                  : (
                    <div className="flex items-center gap-1">
                      {[0, 150, 300].map(d => (
                        <div key={d} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <footer className="p-5 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSend} className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={streaming || starting}
                placeholder="Type your response..."
                className="w-full h-14 pl-6 pr-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary rounded-xl text-sm placeholder:text-slate-400 outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming || starting}
                className="absolute right-2 top-2 size-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform disabled:opacity-40"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">
              AI responses are for screening only — not medical advice.
            </p>
          </form>
        </footer>
      </main>
    </div>
  );
}

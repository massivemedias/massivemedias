import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Sparkles, Image, Camera, Send, Plus, Settings2,
  Upload, Download, Loader2, X, AlertCircle,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { chatStream, processSticker, generateMockup, checkHealth } from '../services/iaService';

const AI_BASE_URL = 'https://ai.massivemedias.com';

const TABS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'stickers', icon: Sparkles, label: 'Stickers' },
  { id: 'prints', icon: Image, label: 'Prints' },
  { id: 'lens', icon: Camera, label: 'Lens' },
];

const SCENES = [
  { value: 'living_room', fr: 'Salon', en: 'Living Room', es: 'Salon' },
  { value: 'bedroom', fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio' },
  { value: 'office', fr: 'Bureau', en: 'Office', es: 'Oficina' },
];

const SHADERS = [
  { value: 'none', label: 'Aucun' },
  { value: 'holographic', label: 'Holographic' },
  { value: 'glossy', label: 'Glossy' },
  { value: 'broken_glass', label: 'Broken Glass' },
];

// ---------------------------------------------------------------------------
// Drop Zone reusable
// ---------------------------------------------------------------------------
function DropZone({ accept, onFile, file, onClear, label }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        dragOver ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }}
      />
      {file ? (
        <div className="flex flex-col items-center gap-3">
          <img
            src={URL.createObjectURL(file)}
            alt="preview"
            className="max-h-48 rounded-lg object-contain"
          />
          <div className="flex items-center gap-2 text-sm text-grey-muted">
            <span>{file.name}</span>
            <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-red-400 hover:text-red-300">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-grey-muted">
          <Upload size={32} />
          <p className="text-sm">{label || 'Glisser un fichier ici ou cliquer'}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Tab
// ---------------------------------------------------------------------------
function ChatTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [model, setModel] = useState('mistral:7b-instruct-q4_K_M');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [systemPrompt, setSystemPrompt] = useState('Tu es un assistant utile. Reponds en francais.');
  const bottomRef = useRef(null);
  const controllerRef = useRef(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { if (messages.length > 0) scrollToBottom(); }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg = { role: 'user', content: text };
    const assistantMsg = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    controllerRef.current = chatStream(
      { message: text, model, temperature, max_tokens: maxTokens, system_prompt: systemPrompt, history },
      {
        onToken: (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') last.content += token;
            return updated;
          });
        },
        onDone: () => setStreaming(false),
        onError: (err) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') last.content = `Erreur: ${err.message}`;
            return updated;
          });
          setStreaming(false);
        },
      }
    );
  }, [input, streaming, messages, model, temperature, maxTokens, systemPrompt]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    if (controllerRef.current) controllerRef.current.abort();
    setMessages([]);
    setStreaming(false);
  };

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto rounded-xl bg-black/20 p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-grey-muted text-sm">
              Envoie un message pour commencer
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-accent/20 text-heading'
                  : 'bg-black/30 text-heading'
              }`}>
                {msg.content || (streaming && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:0.4s]" />
                  </span>
                ) : null)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleNewChat}
            className="p-2.5 rounded-xl bg-black/20 text-grey-muted hover:text-heading transition-colors"
            title="Nouvelle conversation"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl transition-colors lg:hidden ${
              showSettings ? 'bg-accent/20 text-accent' : 'bg-black/20 text-grey-muted hover:text-heading'
            }`}
          >
            <Settings2 size={18} />
          </button>
          <div className="flex-1 flex items-end gap-2 rounded-xl bg-black/20 p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ecris ton message..."
              rows={1}
              className="flex-1 bg-transparent text-heading text-sm resize-none outline-none placeholder:text-grey-muted max-h-32"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="p-1.5 rounded-lg bg-accent text-white disabled:opacity-40 transition-opacity"
            >
              {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Settings sidebar */}
      <aside className={`w-64 flex-shrink-0 space-y-4 ${showSettings ? 'block' : 'hidden lg:block'}`}>
        <div className="rounded-xl bg-black/20 p-4 space-y-4">
          <h3 className="text-xs font-semibold text-grey-muted uppercase tracking-wider">Parametres</h3>

          {/* Model */}
          <div>
            <label className="text-xs text-grey-muted block mb-1">Modele</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-black/30 text-heading text-sm rounded-lg px-3 py-2 outline-none border border-white/5"
            >
              <option value="mistral:7b-instruct-q4_K_M">Mistral 7B Instruct</option>
              <option value="mistral:latest">Mistral Latest</option>
              <option value="llama3:8b">Llama 3 8B</option>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="text-xs text-grey-muted block mb-1">Temperature: {temperature}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* Max tokens */}
          <div>
            <label className="text-xs text-grey-muted block mb-1">Max tokens: {maxTokens}</label>
            <input
              type="range"
              min="64"
              max="4096"
              step="64"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* System prompt */}
          <div>
            <label className="text-xs text-grey-muted block mb-1">System prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full bg-black/30 text-heading text-sm rounded-lg px-3 py-2 outline-none resize-none border border-white/5"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stickers Tab
// ---------------------------------------------------------------------------
function StickersTab() {
  const [file, setFile] = useState(null);
  const [strokeColor, setStrokeColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [shader, setShader] = useState('none');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await processSticker(file, { stroke_color: strokeColor, stroke_width: strokeWidth, shader });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <DropZone
          accept="image/*"
          file={file}
          onFile={setFile}
          onClear={() => { setFile(null); setResult(null); }}
          label="Glisser une image ici (PNG, WebP, JPG)"
        />

        <div className="rounded-xl bg-black/20 p-4 space-y-4">
          <h3 className="text-xs font-semibold text-grey-muted uppercase tracking-wider">Options</h3>

          <div className="flex items-center gap-3">
            <label className="text-sm text-grey-muted">Couleur contour</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent"
            />
            <span className="text-xs text-grey-muted font-mono">{strokeColor}</span>
          </div>

          <div>
            <label className="text-xs text-grey-muted block mb-1">Epaisseur stroke: {strokeWidth}mm</label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="text-xs text-grey-muted block mb-2">Shader</label>
            <div className="flex gap-2">
              {SHADERS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setShader(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    shader === s.value ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!file || loading}
          className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? 'Generation...' : 'Generer le sticker'}
        </button>
      </div>

      {/* Resultat */}
      <div className="rounded-xl bg-black/20 p-4 flex items-center justify-center min-h-[300px]">
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {result ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={`${AI_BASE_URL}${result.output_url}`}
              alt="sticker"
              className="max-h-64 object-contain"
            />
            <a
              href={`${AI_BASE_URL}${result.output_url}`}
              download
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors"
            >
              <Download size={14} />
              Telecharger
            </a>
          </div>
        ) : !error && (
          <p className="text-grey-muted text-sm">Le resultat apparaitra ici</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prints Tab - Mockup AI via Strapi/Gemini
// ---------------------------------------------------------------------------
const ADMIN_SCENES = [
  { value: 'living_room', label: 'Salon' },
  { value: 'bedroom', label: 'Chambre' },
  { value: 'office', label: 'Bureau' },
  { value: 'dining', label: 'Salle a manger' },
  { value: 'studio', label: 'Studio' },
  { value: 'zen', label: 'Zen' },
];

const FRAME_COLORS = [
  { value: 'black', label: 'Noir', color: '#000' },
  { value: 'white', label: 'Blanc', color: '#fff' },
];

function PrintsTab() {
  const { tx } = useLang();
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [scene, setScene] = useState('living_room');
  const [frameColor, setFrameColor] = useState('black');
  const [loading, setLoading] = useState(false);
  const [mockupData, setMockupData] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // Timer pour afficher le temps ecoule
  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [loading]);

  // Quand un fichier est uploade, creer un object URL temporaire
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImageUrl('');
  }, [file]);

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setMockupData(null);

    try {
      // Convertir le fichier en base64 et envoyer comme URL data
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // L'admin utilise l'API Strapi directement
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';
      const res = await fetch(`${apiUrl}/mockup/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: base64,
          scene,
          frameColor,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success && data.image) {
        setMockupData(`data:${data.image.mimeType};base64,${data.image.data}`);
      } else {
        throw new Error('No image returned');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!mockupData) return;
    const link = document.createElement('a');
    link.href = mockupData;
    link.download = `mockup-${scene}-${frameColor}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <DropZone
          accept="image/*"
          file={file}
          onFile={setFile}
          onClear={() => { setFile(null); setMockupData(null); setError(null); }}
          label="Glisser une image d'oeuvre ici"
        />

        <div className="rounded-xl bg-black/20 p-4 space-y-4">
          {/* Scene */}
          <div>
            <h3 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">Scene</h3>
            <div className="flex flex-wrap gap-2">
              {ADMIN_SCENES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScene(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scene === s.value ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frame color */}
          <div>
            <h3 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">Cadre</h3>
            <div className="flex gap-2">
              {FRAME_COLORS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrameColor(f.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    frameColor === f.value ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-grey-muted/30"
                    style={{ backgroundColor: f.color }}
                  />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="text-[10px] text-grey-muted space-y-1">
            <p>API: Gemini 2.0 Flash (via Strapi)</p>
            <p>Decor aleatoire parmi 4 variantes par scene</p>
            <p>Rate limit: 30 req/min, 5/heure cote client</p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!file || loading}
          className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generation... ({elapsed}s)
            </>
          ) : (
            <>
              <Image size={16} />
              Generer le mockup
            </>
          )}
        </button>
      </div>

      {/* Resultat */}
      <div className="rounded-xl bg-black/20 p-4 flex items-center justify-center min-h-[300px]">
        {error && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
            <button
              onClick={handleGenerate}
              disabled={!file}
              className="text-accent text-xs hover:underline"
            >
              Reessayer
            </button>
          </div>
        )}
        {mockupData ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <img
              src={mockupData}
              alt="mockup"
              className="max-h-[500px] rounded-lg object-contain w-full"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors"
              >
                <Download size={14} />
                Telecharger
              </button>
              <button
                onClick={handleGenerate}
                disabled={!file || loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-heading text-sm hover:bg-white/15 transition-colors"
              >
                <Image size={14} />
                Regenerer
              </button>
            </div>
            <p className="text-grey-muted text-[10px]">
              Scene: {scene} | Cadre: {frameColor} | Genere en {elapsed}s
            </p>
          </div>
        ) : !error && !loading && (
          <p className="text-grey-muted text-sm">Le resultat apparaitra ici</p>
        )}
        {loading && !mockupData && !error && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-accent" />
            <p className="text-heading text-sm">{elapsed}s...</p>
            <p className="text-grey-muted text-xs">Gemini genere votre mockup</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lens Tab (placeholder)
// ---------------------------------------------------------------------------
function LensTab() {
  return (
    <div className="rounded-xl bg-black/20 p-8 text-center space-y-4">
      <div className="inline-flex p-4 rounded-2xl bg-accent/10">
        <Camera size={40} className="text-accent" />
      </div>
      <h3 className="text-lg font-heading font-bold text-heading">
        Pipeline photo immobiliere HDR
      </h3>
      <p className="text-sm text-grey-muted max-w-md mx-auto">
        Upload 3 a 5 brackets d'exposition pour generer une image HDR optimisee Centris.
      </p>
      <p className="text-xs text-accent font-semibold uppercase tracking-wider">Bientot disponible</p>

      {/* Layout prevu */}
      <div className="mt-8 opacity-30 pointer-events-none space-y-4 max-w-lg mx-auto">
        <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-grey-muted text-sm">
          Zone upload multi-fichiers (3-5 brackets)
        </div>
        <div className="flex flex-wrap gap-3 justify-center text-xs text-grey-muted">
          <span className="px-3 py-1.5 rounded-lg bg-black/20">Perspective</span>
          <span className="px-3 py-1.5 rounded-lg bg-black/20">Balance blancs</span>
          <span className="px-3 py-1.5 rounded-lg bg-black/20">Window Pull</span>
          <span className="px-3 py-1.5 rounded-lg bg-black/20">Sky Replacement</span>
        </div>
        <button className="px-6 py-3 rounded-xl bg-accent/40 text-white/60 text-sm font-semibold" disabled>
          Lancer le traitement
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
function AdminMassiveIA() {
  const [activeTab, setActiveTab] = useState('chat');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    checkHealth().then(setHealth).catch(() => setHealth({ status: 'error' }));
  }, []);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 750px)' }}>
      {/* Status indicator (titre gere par AdminLayout) */}
      {health && (
        <div className="flex items-center gap-1.5 mb-4">
          <span className={`w-2 h-2 rounded-full ${
            health.status === 'ok' ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className={`text-xs font-medium ${
            health.status === 'ok' ? 'text-green-400' : 'text-red-400'
          }`}>
            {health.status === 'ok' ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 mb-4 flex-shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-accent text-white'
                  : 'bg-black/20 text-grey-muted hover:text-heading hover:bg-black/30'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex-1 min-h-0"
      >
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'stickers' && <StickersTab />}
        {activeTab === 'prints' && <PrintsTab />}
        {activeTab === 'lens' && <LensTab />}
      </motion.div>
    </div>
  );
}

export default AdminMassiveIA;

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Sparkles, Image, Camera, Send, Plus, Settings2,
  Upload, Download, Loader2, X, AlertCircle, ImageDown, QrCode,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { chatStream, processSticker, generateMockup, checkHealth } from '../services/iaService';

const AI_BASE_URL = 'https://ai.massivemedias.com';

const TABS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'stickers', icon: Sparkles, label: 'Stickers' },
  { id: 'prints', icon: Image, label: 'Prints' },
  { id: 'resize', icon: ImageDown, label: 'Resize' },
  { id: 'qrcode', icon: QrCode, label: 'QR Code' },
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
// Auto-generation des qu'une image est deposee (salon + cadre noir)
// Dots pour switcher entre cadre noir et blanc
// ---------------------------------------------------------------------------
function PrintsTab() {
  const { tx } = useLang();
  const [file, setFile] = useState(null);
  const [frameColor, setFrameColor] = useState('black');
  const [loading, setLoading] = useState(false);
  const [mockupData, setMockupData] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [base64Cache, setBase64Cache] = useState(null); // image resizee en cache
  const timerRef = useRef(null);
  const isGeneratingRef = useRef(false);

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

  // Resizer l'image et retourner le base64
  const resizeToBase64 = (f) => new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 1500;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(f);
  });

  const generateMockup = async (base64, frame = 'black') => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';
      const res = await fetch(`${apiUrl}/mockup/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: base64,
          scene: 'living_room',
          frameColor: frame,
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
      isGeneratingRef.current = false;
    }
  };

  // Auto-generation des qu'un fichier est depose
  const handleFile = async (f) => {
    setFile(f);
    setMockupData(null);
    setError(null);
    setFrameColor('black');
    try {
      const b64 = await resizeToBase64(f);
      setBase64Cache(b64);
      generateMockup(b64, 'black');
    } catch (err) {
      setError('Erreur de lecture du fichier');
    }
  };

  // Changer de cadre = regenerer
  const handleFrameSwitch = (newColor) => {
    if (newColor === frameColor || loading || !base64Cache) return;
    setFrameColor(newColor);
    setMockupData(null);
    generateMockup(base64Cache, newColor);
  };

  const handleClear = () => {
    setFile(null);
    setMockupData(null);
    setError(null);
    setBase64Cache(null);
  };

  const handleDownload = () => {
    if (!mockupData) return;
    const link = document.createElement('a');
    link.href = mockupData;
    link.download = `mockup-${frameColor}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pas encore de fichier: afficher la drop zone
  if (!file) {
    return (
      <div className="max-w-xl mx-auto">
        <DropZone
          accept="image/*"
          file={null}
          onFile={handleFile}
          onClear={handleClear}
          label="Deposer une image pour voir le mockup"
        />
        <p className="text-grey-muted text-[10px] text-center mt-3">
          L'image sera affichee dans un salon avec cadre noir automatiquement
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mockup genere OU loading */}
      <div className="rounded-xl bg-black/20 p-4 flex items-center justify-center min-h-[400px]">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-accent" />
            <p className="text-heading text-sm">Generation... {elapsed}s</p>
            <p className="text-grey-muted text-xs">Cadre {frameColor === 'black' ? 'noir' : 'blanc'} dans un salon</p>
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
            <button
              onClick={() => base64Cache && generateMockup(base64Cache, frameColor)}
              className="text-accent text-xs hover:underline"
            >
              Reessayer
            </button>
          </div>
        )}
        {mockupData && !loading && (
          <img
            src={mockupData}
            alt="mockup"
            className="max-h-[550px] rounded-lg object-contain w-full"
          />
        )}
      </div>

      {/* Dots cadre noir / blanc */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleFrameSwitch('black')}
          disabled={loading}
          className="flex flex-col items-center gap-1.5 group"
          title="Cadre noir"
        >
          <span className={`w-5 h-5 rounded-full border-2 bg-black transition-all ${
            frameColor === 'black' ? 'border-accent scale-110' : 'border-grey-muted/40 group-hover:border-grey-muted'
          }`} />
          <span className={`text-[10px] transition-colors ${
            frameColor === 'black' ? 'text-accent font-semibold' : 'text-grey-muted'
          }`}>Noir</span>
        </button>
        <button
          onClick={() => handleFrameSwitch('white')}
          disabled={loading}
          className="flex flex-col items-center gap-1.5 group"
          title="Cadre blanc"
        >
          <span className={`w-5 h-5 rounded-full border-2 bg-white transition-all ${
            frameColor === 'white' ? 'border-accent scale-110' : 'border-grey-muted/40 group-hover:border-grey-muted'
          }`} />
          <span className={`text-[10px] transition-colors ${
            frameColor === 'white' ? 'text-accent font-semibold' : 'text-grey-muted'
          }`}>Blanc</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {mockupData && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors"
          >
            <Download size={14} />
            Telecharger
          </button>
        )}
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-grey-muted text-sm hover:text-heading transition-colors"
        >
          <X size={14} />
          Nouvelle image
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resize Tab - Redimensionner + compresser en WebP
// ---------------------------------------------------------------------------
function ResizeTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [origSize, setOrigSize] = useState({ w: 0, h: 0, bytes: 0 });
  const [maxWidth, setMaxWidth] = useState(1600);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState(null); // { blob, url, w, h, bytes }
  const [processing, setProcessing] = useState(false);

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setOrigSize({ w: 0, h: 0, bytes: f.size });
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new window.Image();
    img.onload = () => setOrigSize(prev => ({ ...prev, w: img.naturalWidth, h: img.naturalHeight }));
    img.src = url;
  };

  const handleProcess = () => {
    if (!file || !preview) return;
    setProcessing(true);
    setResult(null);
    const img = new window.Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > maxWidth) {
        const ratio = maxWidth / w;
        w = maxWidth;
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setResult({ blob, url, w, h, bytes: blob.size });
        setProcessing(false);
      }, 'image/webp', quality / 100);
    };
    img.src = preview;
  };

  const handleDownload = () => {
    if (!result) return;
    const name = (file?.name || 'image').replace(/\.[^/.]+$/, '') + '.webp';
    const a = document.createElement('a');
    a.href = result.url;
    a.download = name;
    a.click();
  };

  const fmt = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {/* Drop zone */}
        <DropZone
          accept="image/*"
          file={file}
          onFile={handleFile}
          onClear={() => { setFile(null); setPreview(null); setResult(null); }}
          label="Deposer une image a redimensionner"
        />

        {/* Info original */}
        {file && (
          <div className="rounded-xl bg-black/20 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-grey-muted">Original</span>
              <span className="text-heading font-mono">{origSize.w}x{origSize.h} - {fmt(origSize.bytes)}</span>
            </div>

            {/* Max width */}
            <div>
              <label className="text-xs text-grey-muted block mb-1">Largeur max: {maxWidth}px</label>
              <input
                type="range" min="200" max="4000" step="100" value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[9px] text-grey-muted">
                <span>200px</span>
                <div className="flex gap-2">
                  {[800, 1200, 1600, 2400].map(v => (
                    <button key={v} onClick={() => setMaxWidth(v)}
                      className={`px-1.5 py-0.5 rounded ${maxWidth === v ? 'bg-accent text-white' : 'hover:text-heading'}`}>{v}</button>
                  ))}
                </div>
                <span>4000px</span>
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="text-xs text-grey-muted block mb-1">Qualite WebP: {quality}%</label>
              <input
                type="range" min="10" max="100" step="5" value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[9px] text-grey-muted">
                <span>10%</span>
                <div className="flex gap-2">
                  {[50, 70, 80, 90].map(v => (
                    <button key={v} onClick={() => setQuality(v)}
                      className={`px-1.5 py-0.5 rounded ${quality === v ? 'bg-accent text-white' : 'hover:text-heading'}`}>{v}%</button>
                  ))}
                </div>
                <span>100%</span>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={processing}
              className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : <ImageDown size={16} />}
              {processing ? 'Conversion...' : 'Convertir en WebP'}
            </button>
          </div>
        )}
      </div>

      {/* Resultat */}
      <div className="rounded-xl bg-black/20 p-4 flex items-center justify-center min-h-[300px]">
        {result ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <img src={result.url} alt="result" className="max-h-[400px] rounded-lg object-contain w-full" />
            <div className="flex items-center gap-4 text-sm">
              <span className="text-heading font-mono">{result.w}x{result.h}</span>
              <span className={`font-semibold ${result.bytes < origSize.bytes ? 'text-green-400' : 'text-orange-400'}`}>
                {fmt(result.bytes)}
              </span>
              {result.bytes < origSize.bytes && (
                <span className="text-green-400 text-xs">
                  -{Math.round((1 - result.bytes / origSize.bytes) * 100)}%
                </span>
              )}
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              <Download size={16} />
              Telecharger .webp
            </button>
          </div>
        ) : (
          <p className="text-grey-muted text-sm">Le resultat apparaitra ici</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QR Code Tab
// ---------------------------------------------------------------------------
function QRCodeTab() {
  const [url, setUrl] = useState('https://massivemedias.com');
  const [dotStyle, setDotStyle] = useState('rounded'); // 'square' | 'rounded' | 'dots'
  const [cornerStyle, setCornerStyle] = useState('rounded');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [size, setSize] = useState(400);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const canvasRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const generateQR = useCallback(async () => {
    if (!url.trim() || !canvasRef.current) return;
    setGenerating(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = canvasRef.current;

      // Error correction L = minimum de points
      await QRCode.toCanvas(canvas, url.trim(), {
        width: size,
        margin: 2,
        errorCorrectionLevel: logoUrl ? 'M' : 'L', // M si logo (besoin de plus de redondance)
        color: { dark: fgColor, light: bgColor },
      });

      // Appliquer les styles de points
      const ctx = canvas.getContext('2d');
      if (dotStyle !== 'square') {
        const imageData = ctx.getImageData(0, 0, size, size);
        const moduleCount = Math.round(size / (size / Math.sqrt(imageData.data.length / 4)));
        // Redessiner avec des ronds
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tCtx = tempCanvas.getContext('2d');

        await QRCode.toCanvas(tempCanvas, url.trim(), {
          width: size, margin: 2,
          errorCorrectionLevel: logoUrl ? 'M' : 'L',
          color: { dark: fgColor, light: bgColor },
        });

        // Lire les modules du QR
        const qrData = await QRCode.create(url.trim(), { errorCorrectionLevel: logoUrl ? 'M' : 'L' });
        const modules = qrData.modules;
        const modSize = modules.size;
        const cellSize = (size - 4) / (modSize + 4); // marge 2 de chaque cote
        const offset = cellSize * 2; // marge

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);

        for (let row = 0; row < modSize; row++) {
          for (let col = 0; col < modSize; col++) {
            if (modules.get(row, col)) {
              const x = offset + col * cellSize;
              const y = offset + row * cellSize;
              ctx.fillStyle = fgColor;
              if (dotStyle === 'dots') {
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.35, 0, Math.PI * 2);
                ctx.fill();
              } else {
                // rounded
                const r = cellSize * 0.3;
                ctx.beginPath();
                ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, r);
                ctx.fill();
              }
            }
          }
        }
      }

      // Logo au centre
      if (logoUrl) {
        const logo = new window.Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const logoSize = size * 0.2;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;
          // Fond blanc derriere le logo
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.roundRect(x - 4, y - 4, logoSize + 8, logoSize + 8, 8);
          ctx.fill();
          ctx.drawImage(logo, x, y, logoSize, logoSize);
        };
        logo.src = logoUrl;
      }
    } catch (err) {
      console.error('QR generation error:', err);
    } finally {
      setGenerating(false);
    }
  }, [url, dotStyle, fgColor, bgColor, size, logoUrl]);

  // Regenerer a chaque changement
  useEffect(() => {
    const timer = setTimeout(generateQR, 300);
    return () => clearTimeout(timer);
  }, [generateQR]);

  // Logo upload
  const handleLogo = (f) => {
    setLogoFile(f);
    setLogoUrl(URL.createObjectURL(f));
  };

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `qr-${url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-')}.png`;
    a.click();
  };

  const handleDownloadSVG = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const svg = await QRCode.toString(url.trim(), {
        type: 'svg',
        width: size,
        margin: 2,
        errorCorrectionLevel: 'L',
        color: { dark: fgColor, light: bgColor },
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-${url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-')}.svg`;
      a.click();
    } catch (err) {
      console.error('SVG export error:', err);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Config */}
      <div className="space-y-4">
        {/* URL */}
        <div>
          <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">URL</label>
          <input
            type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://massivemedias.com"
            className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2.5 outline-none border border-white/5 focus:border-accent"
          />
        </div>

        <div className="rounded-xl bg-black/20 p-4 space-y-4">
          {/* Forme des points */}
          <div>
            <label className="text-xs text-grey-muted uppercase tracking-wider block mb-2">Forme des points</label>
            <div className="flex gap-2">
              {[
                { id: 'square', label: 'Carre' },
                { id: 'rounded', label: 'Arrondi' },
                { id: 'dots', label: 'Rond' },
              ].map(s => (
                <button key={s.id} onClick={() => setDotStyle(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dotStyle === s.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Couleurs */}
          <div className="flex gap-4">
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">Couleur</label>
              <div className="flex items-center gap-2">
                <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                <span className="text-grey-muted text-xs font-mono">{fgColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">Fond</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                <span className="text-grey-muted text-xs font-mono">{bgColor}</span>
              </div>
            </div>
          </div>

          {/* Taille */}
          <div>
            <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">Taille: {size}px</label>
            <input type="range" min="200" max="1000" step="50" value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-accent" />
          </div>

          {/* Logo */}
          <div>
            <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">Logo au centre</label>
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <div className="flex items-center gap-2">
                  <img src={logoUrl} alt="logo" className="w-8 h-8 rounded object-contain" />
                  <button onClick={() => { setLogoFile(null); setLogoUrl(''); }}
                    className="text-red-400 text-xs hover:underline">Retirer</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 text-grey-muted text-xs cursor-pointer hover:text-heading transition-colors">
                  <Upload size={12} /> Ajouter un logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleLogo(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Download */}
        <div className="flex gap-2">
          <button onClick={handleDownloadPNG}
            className="flex-1 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors">
            <Download size={16} /> PNG
          </button>
          <button onClick={handleDownloadSVG}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-500 transition-colors">
            <Download size={16} /> SVG
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center">
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <canvas ref={canvasRef} style={{ width: `${Math.min(size, 400)}px`, height: `${Math.min(size, 400)}px` }} />
        </div>
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
      {/* Status indicator - seulement si en ligne */}
      {health?.status === 'ok' && (
        <div className="flex items-center gap-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs font-medium text-green-400">En ligne</span>
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
        {activeTab === 'resize' && <ResizeTab />}
        {activeTab === 'qrcode' && <QRCodeTab />}
        {activeTab === 'lens' && <LensTab />}
      </motion.div>
    </div>
  );
}

export default AdminMassiveIA;

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Sparkles, Image, Camera, Send, Plus, Settings2,
  Upload, Download, Loader2, X, AlertCircle, ImageDown, QrCode,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { chatStream, generateMockup, checkHealth } from '../services/iaService';

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
  { value: 'stars', label: 'Stars' },
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
// Stickers Tab - Generation 100% client-side via Canvas 2D
// Applique stroke (contour) + shader FX (holographic/glossy/broken_glass/stars)
// ---------------------------------------------------------------------------

// Charge une File/Blob dans une HTMLImageElement
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// Dessine le sticker avec un contour (stroke) autour des pixels non-transparents
// Technique: on dessine la silhouette coloree decalee dans 8 directions, puis l'image originale par dessus
function drawStickerWithStroke(ctx, img, strokeColor, strokeWidth) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const drawW = w - strokeWidth * 2;
  const drawH = h - strokeWidth * 2;

  if (strokeWidth > 0) {
    // Canvas temporaire pour dessiner l'image en silhouette coloree
    const tmp = document.createElement('canvas');
    tmp.width = drawW;
    tmp.height = drawH;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(img, 0, 0, drawW, drawH);
    // Teinte la silhouette en strokeColor
    tctx.globalCompositeOperation = 'source-in';
    tctx.fillStyle = strokeColor;
    tctx.fillRect(0, 0, drawW, drawH);

    // Dilatation: dessiner le silhouette decalee dans 16 directions pour un contour rond
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const dx = Math.cos(angle) * strokeWidth;
      const dy = Math.sin(angle) * strokeWidth;
      ctx.drawImage(tmp, strokeWidth + dx, strokeWidth + dy, drawW, drawH);
    }
  }

  // Dessiner l'image originale par dessus
  ctx.drawImage(img, strokeWidth, strokeWidth, drawW, drawH);
}

// Applique un shader FX sur le canvas (les pixels opaques du sticker)
function applyShader(ctx, shader, w, h) {
  if (shader === 'none') return;

  ctx.save();

  if (shader === 'holographic') {
    // Gradient conique arc-en-ciel - opacite reduite pour laisser l'image visible
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.28;
    let grad;
    if (typeof ctx.createConicGradient === 'function') {
      grad = ctx.createConicGradient(0, w / 2, h / 2);
      grad.addColorStop(0.00, '#ff00cc');
      grad.addColorStop(0.14, '#ff6600');
      grad.addColorStop(0.28, '#ffee00');
      grad.addColorStop(0.42, '#00ff88');
      grad.addColorStop(0.57, '#00ccff');
      grad.addColorStop(0.71, '#5500ff');
      grad.addColorStop(0.85, '#ff0088');
      grad.addColorStop(1.00, '#ff00cc');
    } else {
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0.0, '#ff00cc');
      grad.addColorStop(0.2, '#ff6600');
      grad.addColorStop(0.4, '#ffee00');
      grad.addColorStop(0.6, '#00ff88');
      grad.addColorStop(0.8, '#00ccff');
      grad.addColorStop(1.0, '#5500ff');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Highlight diagonal blanc - subtil
    ctx.globalAlpha = 0.10;
    const high = ctx.createLinearGradient(0, 0, w, h);
    high.addColorStop(0.0, 'rgba(255,255,255,0)');
    high.addColorStop(0.4, 'rgba(255,255,255,1)');
    high.addColorStop(0.5, 'rgba(255,255,255,0)');
    high.addColorStop(0.6, 'rgba(255,255,255,0.8)');
    high.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = high;
    ctx.fillRect(0, 0, w, h);
  }

  else if (shader === 'glossy') {
    ctx.globalCompositeOperation = 'source-atop';

    // 1. Nappe de lumiere generale en haut (gradient vertical)
    const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    topGrad.addColorStop(0.0,  'rgba(255,255,255,0.60)');
    topGrad.addColorStop(0.30, 'rgba(255,255,255,0.20)');
    topGrad.addColorStop(0.55, 'rgba(255,255,255,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // 2. Reflet ovale centre-haut (specular highlight - comme un reflet de lampe)
    ctx.save();
    const cx = w * 0.5;
    const cy = h * 0.20;
    const radX = w * 0.38;
    const radY = h * 0.14;
    ctx.scale(1, radY / radX); // transformer en ellipse
    const ovalGrd = ctx.createRadialGradient(cx, cy * (radX / radY), 0, cx, cy * (radX / radY), radX);
    ovalGrd.addColorStop(0,    'rgba(255,255,255,0.55)');
    ovalGrd.addColorStop(0.45, 'rgba(255,255,255,0.18)');
    ovalGrd.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = ovalGrd;
    ctx.beginPath();
    ctx.arc(cx, cy * (radX / radY), radX, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Legere ombre en bas (profondeur)
    const bottomGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
  }

  else if (shader === 'broken_glass') {
    // Facettes cristal holographiques (verre brise - geometric rainbow shards)
    ctx.globalCompositeOperation = 'source-atop';

    // RNG deterministe base sur les dimensions (meme pattern a chaque generation)
    let seed = ((w * 31337) ^ (h * 42069)) >>> 0;
    const rnd = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };

    const FACETS = 34;
    const hueShift = rnd() * 360;
    const refSize = Math.min(w, h);

    // 1. Facettes triangulaires colorees (chaque shard reflete une couleur differente)
    for (let i = 0; i < FACETS; i++) {
      const cx = rnd() * w;
      const cy = rnd() * h;
      const size = refSize * (0.07 + rnd() * 0.20);
      const a0 = rnd() * Math.PI * 2;
      const a1 = a0 + Math.PI * (0.35 + rnd() * 1.0);
      const a2 = a1 + Math.PI * (0.35 + rnd() * 1.0);
      const r0 = size * (0.6 + rnd() * 0.5);
      const r1 = size * (0.5 + rnd() * 0.6);
      const r2 = size * (0.4 + rnd() * 0.7);

      ctx.save();
      ctx.globalAlpha = 0.18 + rnd() * 0.32;
      const hue = (hueShift + i * (360 / FACETS) + rnd() * 25) % 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 62%)`;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
      ctx.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
      ctx.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Lignes de cassure blanches (bords entre les shards)
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineCap = 'round';
    const CRACKS = 12;
    for (let c = 0; c < CRACKS; c++) {
      const x0 = rnd() * w;
      const y0 = rnd() * h;
      const angle = rnd() * Math.PI * 2;
      const mainLen = refSize * (0.08 + rnd() * 0.28);
      ctx.save();
      ctx.globalAlpha = 0.35 + rnd() * 0.30;
      ctx.lineWidth = 0.4 + rnd() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + Math.cos(angle) * mainLen, y0 + Math.sin(angle) * mainLen);
      // Branche secondaire
      const branchT = 0.3 + rnd() * 0.45;
      const bx = x0 + Math.cos(angle) * mainLen * branchT;
      const by = y0 + Math.sin(angle) * mainLen * branchT;
      const bAngle = angle + (rnd() > 0.5 ? 1 : -1) * (0.4 + rnd() * 0.7);
      const bLen = mainLen * (0.25 + rnd() * 0.45);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(bAngle) * bLen, by + Math.sin(bAngle) * bLen);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 3. Leger voile blanc pour unifier les shards (effet "verre")
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = 'rgba(220,230,255,1)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  else if (shader === 'stars') {
    // Etoiles 4 pointes SOLIDES multicolores - comme le vrai film FX stars holographique
    ctx.globalCompositeOperation = 'source-atop';

    let seed = ((w * 12345) ^ (h * 67890)) >>> 0;
    const rnd = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };

    const refSize = Math.min(w, h);

    // Palette arc-en-ciel saturee (comme le film FX stars)
    const palette = [
      '#ff1a1a', // rouge vif
      '#ff5500', // orange
      '#ffdd00', // jaune
      '#00ee33', // vert
      '#00ccff', // cyan
      '#2244ff', // bleu
      '#9900ee', // violet
      '#ff00bb', // rose/magenta
      '#ffffff', // blanc
      '#ffff55', // jaune pale
      '#55ffee', // cyan pale
      '#ff88aa', // rose pale
    ];

    // Dessine une etoile 4 pointes (polygone solide, pointes fines et allongees)
    const draw4Star = (x, y, outerR, innerR, angle = -Math.PI / 4) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = angle + (i * Math.PI) / 4;
        const r = i % 2 === 0 ? outerR : innerR;
        if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
    };

    // --- Couche 1: etoiles 4 pointes regulieres (masse principale)
    const nStars = 90;
    for (let i = 0; i < nStars; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const outerR = refSize * (0.007 + rnd() * 0.020);
      const innerR = outerR * (0.14 + rnd() * 0.10); // pointes tres fines
      const color = palette[Math.floor(rnd() * palette.length)];
      const alpha = 0.55 + rnd() * 0.40;
      const rot = rnd() * Math.PI * 0.5; // rotation aleatoire legere

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      draw4Star(x, y, outerR, innerR, rot);
      ctx.fill();
      ctx.restore();
    }

    // --- Couche 2: croix simples (+) pour varier les formes
    const nCrosses = 30;
    for (let i = 0; i < nCrosses; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = refSize * (0.004 + rnd() * 0.010);
      const t = Math.max(1, r * 0.28); // epaisseur bras
      const color = palette[Math.floor(rnd() * palette.length)];
      const alpha = 0.45 + rnd() * 0.50;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x - r, y - t / 2, r * 2, t);
      ctx.fillRect(x - t / 2, y - r, t, r * 2);
      ctx.restore();
    }

    // --- Couche 3: petits points ronds (glitter entre les etoiles)
    const nDots = 45;
    for (let i = 0; i < nDots; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = refSize * (0.002 + rnd() * 0.005);
      const color = palette[Math.floor(rnd() * palette.length)];
      const alpha = 0.40 + rnd() * 0.55;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- Couche 4: grandes etoiles accentuees (quelques points de brillance forts)
    const nAccent = 10;
    for (let i = 0; i < nAccent; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const outerR = refSize * (0.020 + rnd() * 0.022);
      const innerR = outerR * 0.15;
      const color = palette[Math.floor(rnd() * palette.length)];
      const alpha = 0.75 + rnd() * 0.20;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      draw4Star(x, y, outerR, innerR, rnd() * Math.PI * 0.5);
      ctx.fill();
      // Halo blanc leger autour des grandes
      ctx.globalAlpha = alpha * 0.30;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      draw4Star(x, y, outerR * 1.5, innerR * 1.5, rnd() * Math.PI * 0.5);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

// Genere le sticker final dans un canvas off-screen et retourne un Blob URL
async function generateStickerBlob(file, { strokeColor, strokeWidth, shader }) {
  const img = await loadImageFromFile(file);
  // Limite la taille max a 1200px pour performance / poids
  const MAX = 1200;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const scale = Math.min(1, MAX / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);

  // Padding autour pour accommoder le stroke
  const pad = strokeWidth || 0;
  const canvas = document.createElement('canvas');
  canvas.width = w + pad * 2;
  canvas.height = h + pad * 2;
  const ctx = canvas.getContext('2d');

  // Dessiner sticker + stroke
  // drawStickerWithStroke utilise (canvas.width - strokeWidth*2) pour calculer l'image
  // donc on lui passe le canvas global avec le padding deja inclus
  drawStickerWithStroke(ctx, img, strokeColor, pad);

  // Appliquer shader
  applyShader(ctx, shader, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Impossible de generer le PNG'));
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}

function StickersTab() {
  const [file, setFile] = useState(null);
  const [strokeColor, setStrokeColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [shader, setShader] = useState('none');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // Blob URL
  const [error, setError] = useState(null);

  // Cleanup blob URL au unmount / changement de resultat
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result);
    };
  }, [result]);

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    // Revoke l'ancien blob
    if (result) URL.revokeObjectURL(result);
    setResult(null);
    try {
      const blobUrl = await generateStickerBlob(file, { strokeColor, strokeWidth, shader });
      setResult(blobUrl);
    } catch (err) {
      setError(err?.message || 'Erreur lors de la generation');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (result) URL.revokeObjectURL(result);
    setResult(null);
    setError(null);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <DropZone
          accept="image/*"
          file={file}
          onFile={(f) => { setFile(f); setError(null); }}
          onClear={handleClearFile}
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
            <label className="text-xs text-grey-muted block mb-1">Epaisseur contour: {strokeWidth}px</label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="text-xs text-grey-muted block mb-2">Shader</label>
            <div className="flex flex-wrap gap-2">
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
      <div
        className={`rounded-xl overflow-hidden relative ${!result ? 'bg-black/20 p-4 flex items-center justify-center min-h-[300px]' : ''}`}
        style={result ? {
          backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, 10px 0px',
        } : undefined}
      >
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm p-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {result ? (<>
          <img
            src={result}
            alt="sticker"
            className="w-full h-auto block"
          />
          <a
            href={result}
            download={`sticker-${shader}.png`}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-semibold hover:bg-black/80 transition-colors"
          >
            <Download size={12} />
            Telecharger
          </a>
        </>) : !error && (
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
// QR Code Tab - Generateur avance
// ---------------------------------------------------------------------------
function QRCodeTab() {
  const [url, setUrl] = useState('https://massivemedias.com');
  const [shortUrl, setShortUrl] = useState('');
  const [qrTab, setQrTab] = useState('content'); // content | colors | design | logo
  const [dotStyle, setDotStyle] = useState('rounded');
  const [ecLevel, setEcLevel] = useState('L');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [transparentBg, setTransparentBg] = useState(false);
  const [size, setSize] = useState(1000);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const canvasRef = useRef(null);

  // URL effective: raccourcie si disponible, sinon originale
  const effectiveUrl = shortUrl || url;

  const generateQR = useCallback(async () => {
    if (!effectiveUrl.trim() || !canvasRef.current) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = canvasRef.current;
      const ecl = logoUrl ? 'Q' : ecLevel; // Q minimum si logo

      // Generer les modules
      const qrData = await QRCode.create(effectiveUrl.trim(), { errorCorrectionLevel: ecl });
      const modules = qrData.modules;
      const modSize = modules.size;
      const margin = 2;
      const totalMods = modSize + margin * 2;
      const cellSize = size / totalMods;

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Fond
      if (transparentBg) {
        ctx.clearRect(0, 0, size, size);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      }

      // Dessiner les modules selon le style
      for (let row = 0; row < modSize; row++) {
        for (let col = 0; col < modSize; col++) {
          if (!modules.get(row, col)) continue;
          const x = (col + margin) * cellSize;
          const y = (row + margin) * cellSize;
          ctx.fillStyle = fgColor;

          if (dotStyle === 'dots') {
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.38, 0, Math.PI * 2);
            ctx.fill();
          } else if (dotStyle === 'rounded') {
            const r = cellSize * 0.32;
            ctx.beginPath();
            ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, r);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }

      // Logo au centre
      if (logoUrl) {
        const logo = new window.Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const logoSize = size * 0.25;
          const lx = (size - logoSize) / 2;
          const ly = (size - logoSize) / 2;
          if (transparentBg) {
            ctx.clearRect(lx - 6, ly - 6, logoSize + 12, logoSize + 12);
          } else {
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(lx - 6, ly - 6, logoSize + 12, logoSize + 12, 10);
            ctx.fill();
          }
          ctx.drawImage(logo, lx, ly, logoSize, logoSize);
        };
        logo.src = logoUrl;
      }
    } catch (err) {
      console.error('QR error:', err);
    }
  }, [effectiveUrl, dotStyle, ecLevel, fgColor, bgColor, size, logoUrl, transparentBg]);

  useEffect(() => { const t = setTimeout(generateQR, 200); return () => clearTimeout(t); }, [generateQR]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `qr-${effectiveUrl.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-').slice(0, 30)}.png`;
    a.click();
  };

  const handleDownloadSVG = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const svg = await QRCode.toString(effectiveUrl.trim(), {
        type: 'svg', width: size, margin: 2,
        errorCorrectionLevel: logoUrl ? 'Q' : ecLevel,
        color: { dark: fgColor, light: bgColor },
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-${effectiveUrl.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-').slice(0, 30)}.svg`;
      a.click();
    } catch (err) { console.error('SVG error:', err); }
  };

  const TABS_QR = [
    { id: 'content', label: 'Contenu' },
    { id: 'design', label: 'Design' },
    { id: 'colors', label: 'Couleurs' },
    { id: 'logo', label: 'Logo' },
  ];

  return (
    <div className="grid lg:grid-cols-[1fr_auto] gap-6">
      {/* Config gauche */}
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-black/20">
          {TABS_QR.map(t => (
            <button key={t.id} onClick={() => setQrTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                qrTab === t.id ? 'bg-accent text-white' : 'text-grey-muted hover:text-heading'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* Tab: Contenu */}
        {qrTab === 'content' && (
          <div className="rounded-xl bg-black/20 p-4 space-y-4">
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">URL / Texte</label>
              <input type="text" value={url} onChange={(e) => { setUrl(e.target.value); setShortUrl(''); }}
                placeholder="https://massivemedias.com"
                className="w-full rounded-lg bg-black/30 text-heading text-sm px-3 py-2.5 outline-none border border-white/5 focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
                Correction d'erreur
                <span className="text-grey-muted/50 normal-case ml-1">(Low = moins de points)</span>
              </label>
              <div className="flex gap-1.5">
                {[
                  { id: 'L', label: 'Low', desc: 'Simple' },
                  { id: 'M', label: 'Medium', desc: 'Standard' },
                  { id: 'Q', label: 'Quartile', desc: 'Logo' },
                  { id: 'H', label: 'High', desc: 'Max' },
                ].map(e => (
                  <button key={e.id} onClick={() => setEcLevel(e.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      ecLevel === e.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                    }`}>
                    <span className="block">{e.label}</span>
                    <span className="block text-[9px] opacity-60">{e.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">Taille: {size}px</label>
              <input type="range" min="200" max="1200" step="50" value={size}
                onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-accent" />
              <div className="flex justify-between text-[9px] text-grey-muted mt-1">
                {[200, 400, 600, 800, 1200].map(v => (
                  <button key={v} onClick={() => setSize(v)}
                    className={`px-1.5 py-0.5 rounded ${size === v ? 'bg-accent text-white' : 'hover:text-heading'}`}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Design */}
        {qrTab === 'design' && (
          <div className="rounded-xl bg-black/20 p-4 space-y-4">
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-2">Forme des points</label>
              <div className="flex gap-2">
                {[
                  { id: 'square', label: 'Carre', icon: '■' },
                  { id: 'rounded', label: 'Arrondi', icon: '▢' },
                  { id: 'dots', label: 'Rond', icon: '●' },
                ].map(s => (
                  <button key={s.id} onClick={() => setDotStyle(s.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all ${
                      dotStyle === s.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                    }`}>
                    <span className="text-xl">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Couleurs */}
        {qrTab === 'colors' && (
          <div className="rounded-xl bg-black/20 p-4 space-y-4">
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-2">Points (Foreground)</label>
              <div className="flex items-center gap-3">
                <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10" />
                <input type="text" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
                  className="w-24 rounded-lg bg-black/30 text-heading text-xs font-mono px-2 py-1.5 outline-none border border-white/5" />
                <div className="flex gap-1">
                  {['#000000', '#F00098', '#3D0079', '#FFFFFF'].map(c => (
                    <button key={c} onClick={() => setFgColor(c)}
                      className={`w-7 h-7 rounded-full border-2 ${fgColor === c ? 'border-accent' : 'border-white/10'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-grey-muted uppercase tracking-wider">Fond (Background)</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-grey-muted">Transparent</span>
                  <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${transparentBg ? 'bg-accent' : 'bg-white/10'}`}
                    onClick={() => setTransparentBg(!transparentBg)}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${transparentBg ? 'translate-x-4.5 ml-auto mr-0.5' : 'ml-0.5'}`} />
                  </div>
                </label>
              </div>
              {!transparentBg && (
                <div className="flex items-center gap-3">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10" />
                  <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    className="w-24 rounded-lg bg-black/30 text-heading text-xs font-mono px-2 py-1.5 outline-none border border-white/5" />
                  <div className="flex gap-1">
                    {['#FFFFFF', '#000000', '#3D0079', '#F5F0EB'].map(c => (
                      <button key={c} onClick={() => setBgColor(c)}
                        className={`w-7 h-7 rounded-full border-2 ${bgColor === c ? 'border-accent' : 'border-white/10'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Logo */}
        {qrTab === 'logo' && (
          <div className="rounded-xl bg-black/20 p-4 space-y-4">
            <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">Logo au centre</label>
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <img src={logoUrl} alt="logo" className="w-16 h-16 rounded-lg object-contain bg-white/5 p-1" />
                <div>
                  <p className="text-heading text-xs mb-1">{logoFile?.name}</p>
                  <button onClick={() => { setLogoFile(null); setLogoUrl(''); }}
                    className="text-red-400 text-xs hover:underline flex items-center gap-1"><X size={10} /> Retirer</button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-white/10 cursor-pointer hover:border-white/20 transition-colors">
                <Upload size={24} className="text-grey-muted" />
                <span className="text-grey-muted text-xs">Deposer un logo (PNG, JPG, SVG)</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files[0]) { setLogoFile(e.target.files[0]); setLogoUrl(URL.createObjectURL(e.target.files[0])); }
                }} />
              </label>
            )}
            <p className="text-grey-muted text-[10px]">Le niveau de correction passe automatiquement a Quartile quand un logo est present</p>
          </div>
        )}

        {/* Download */}
        <div className="flex gap-2">
          <button onClick={handleDownloadPNG}
            className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors">
            <Download size={16} /> PNG
          </button>
          <button onClick={handleDownloadSVG}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-500 transition-colors">
            <Download size={16} /> SVG
          </button>
        </div>
      </div>

      {/* Preview droite */}
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl p-6 shadow-lg" style={{
          background: transparentBg
            ? 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 20px 20px'
            : '#fff'
        }}>
          <canvas ref={canvasRef} style={{ width: '400px', height: '400px' }} />
        </div>
        <p className="text-grey-muted text-[10px] text-center max-w-[300px]">
          {effectiveUrl.length} caracteres | {ecLevel} correction | {size}px
        </p>
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

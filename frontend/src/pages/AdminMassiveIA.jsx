import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Sparkles, Image, Camera, Send, Plus, Settings2,
  Upload, Download, Loader2, X, AlertCircle, ImageDown, QrCode, Shirt,
  BarChart3, Trash2, ExternalLink, Copy, Check,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { chatStream, generateMockup, checkHealth } from '../services/iaService';
import MerchMockupTool from '../components/merch/MerchMockupTool';
import StickerPreviewCanvas from '../components/StickerPreviewCanvas';
import api from '../services/api';

const TABS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'stickers', icon: Sparkles, label: 'Stickers' },
  { id: 'prints', icon: Image, label: 'Prints' },
  { id: 'merch', icon: Shirt, label: 'Merch' },
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
  { value: 'dots', label: 'Dots' },
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
    // Gradient conique arc-en-ciel centre - version originale qui fonctionnait bien
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
    // Stars FX: etoiles BLANCHES/ARGENTEES avec iridescence holographique
    // Comme le vrai film FX stars: les etoiles sont blanches, c'est la refraction qui genere la couleur

    let seed = ((w * 12345) ^ (h * 67890)) >>> 0;
    const rnd = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };

    const refSize = Math.min(w, h);

    // Canvas temporaire pour dessiner les etoiles de facon isolee
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tc = tmp.getContext('2d');

    // Fonction dessiner etoile 4 pointes sur un contexte donne
    const draw4Star = (c, x, y, outerR, innerR, angle = 0) => {
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = angle + (i * Math.PI) / 4;
        const r = i % 2 === 0 ? outerR : innerR;
        if (i === 0) c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      c.closePath();
    };

    // --- Couche 1: etoiles 4 pointes blanches/argentees (masse principale)
    const nStars = 100;
    for (let i = 0; i < nStars; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const outerR = refSize * (0.007 + rnd() * 0.022);
      const innerR = outerR * (0.13 + rnd() * 0.10);
      const alpha = 0.60 + rnd() * 0.35;
      const rot = rnd() * Math.PI * 0.5;
      // Couleur: blanc pur ou argente leger
      const brightness = Math.round(220 + rnd() * 35);
      tc.save();
      tc.globalAlpha = alpha;
      tc.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
      draw4Star(tc, x, y, outerR, innerR, rot);
      tc.fill();
      tc.restore();
    }

    // --- Couche 2: croix fines (+) argentees pour varier
    const nCrosses = 35;
    for (let i = 0; i < nCrosses; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = refSize * (0.004 + rnd() * 0.010);
      const t = Math.max(0.8, r * 0.25);
      const alpha = 0.45 + rnd() * 0.50;
      tc.save();
      tc.globalAlpha = alpha;
      tc.fillStyle = 'rgba(255,255,255,1)';
      tc.fillRect(x - r, y - t / 2, r * 2, t);
      tc.fillRect(x - t / 2, y - r, t, r * 2);
      tc.restore();
    }

    // --- Couche 3: petits points brillants (glitter)
    const nDots = 50;
    for (let i = 0; i < nDots; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = refSize * (0.002 + rnd() * 0.005);
      const alpha = 0.50 + rnd() * 0.45;
      tc.save();
      tc.globalAlpha = alpha;
      tc.fillStyle = 'rgba(255,255,255,1)';
      tc.beginPath();
      tc.arc(x, y, r, 0, Math.PI * 2);
      tc.fill();
      tc.restore();
    }

    // --- Couche 4: grandes etoiles accentuees tres brillantes
    const nAccent = 10;
    for (let i = 0; i < nAccent; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const outerR = refSize * (0.022 + rnd() * 0.024);
      const innerR = outerR * 0.14;
      tc.save();
      tc.globalAlpha = 0.85 + rnd() * 0.15;
      tc.fillStyle = 'rgba(255,255,255,1)';
      draw4Star(tc, x, y, outerR, innerR, rnd() * Math.PI * 0.5);
      tc.fill();
      // Halo diffus autour des grandes etoiles
      tc.globalAlpha = 0.20;
      const halo = tc.createRadialGradient(x, y, 0, x, y, outerR * 2.5);
      halo.addColorStop(0, 'rgba(255,255,255,0.8)');
      halo.addColorStop(1, 'rgba(255,255,255,0)');
      tc.fillStyle = halo;
      tc.beginPath();
      tc.arc(x, y, outerR * 2.5, 0, Math.PI * 2);
      tc.fill();
      tc.restore();
    }

    // Appliquer l'iridescence holographique SUR les etoiles seulement (source-atop sur le canvas temp)
    if (typeof tc.createConicGradient === 'function') {
      tc.globalCompositeOperation = 'source-atop';
      tc.globalAlpha = 0.22; // tres subtil: les etoiles restent majoritairement blanches
      const holoGrad = tc.createConicGradient(Math.PI * 0.3, w * 0.8, -h * 0.2);
      holoGrad.addColorStop(0.00, '#ff00cc');
      holoGrad.addColorStop(0.14, '#ff6600');
      holoGrad.addColorStop(0.28, '#ffee00');
      holoGrad.addColorStop(0.42, '#00ff88');
      holoGrad.addColorStop(0.57, '#00ccff');
      holoGrad.addColorStop(0.71, '#5500ff');
      holoGrad.addColorStop(0.85, '#ff0088');
      holoGrad.addColorStop(1.00, '#ff00cc');
      tc.fillStyle = holoGrad;
      tc.fillRect(0, 0, w, h);
    }

    // Composer les etoiles sur le sticker principal (source-atop = seulement sur pixels opaques du sticker)
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 1;
    ctx.drawImage(tmp, 0, 0);
  }

  else if (shader === 'dots') {
    // Dots FX: simples points blancs de tailles variees
    ctx.globalCompositeOperation = 'source-atop';

    let seed = ((w * 54321) ^ (h * 98765)) >>> 0;
    const rnd = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };

    const refSize = Math.min(w, h);

    // 280 points blancs de tailles variees, plus ou moins opaques
    const n = 280;
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      // Taille: majorite petite, quelques moyens, rares gros
      const t = rnd();
      let r;
      if (t < 0.70) r = refSize * (0.0015 + rnd() * 0.0035); // petits
      else if (t < 0.95) r = refSize * (0.005 + rnd() * 0.008); // moyens
      else r = refSize * (0.013 + rnd() * 0.010); // gros
      const alpha = 0.55 + rnd() * 0.40;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
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
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [shader, setShader] = useState('none');
  const [livePngUrl, setLivePngUrl] = useState(null); // Blob URL exporte par le canvas live (pour telechargement)
  const [error, setError] = useState(null);

  // Converti le fichier File -> object URL stable pour StickerPreviewCanvas.
  // Revoque l'ancienne URL quand on change de fichier pour eviter les fuites.
  const imageUrl = useMemo(() => {
    if (!file) return null;
    try { return URL.createObjectURL(file); } catch { return null; }
  }, [file]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
      }
    };
  }, [imageUrl]);

  // Le canvas live appelle ce callback a chaque redraw (a chaque changement de stroke/shader).
  // On stocke le blob URL pour que le bouton "Telecharger" soit toujours a jour sans click "Generer".
  const handleLiveThumb = useCallback((blobUrl) => {
    setLivePngUrl(blobUrl);
  }, []);

  const handleClearFile = () => {
    setFile(null);
    setLivePngUrl(null);
    setError(null);
  };

  // Reset du stroke/shader quand on change de fichier pour eviter confusion
  useEffect(() => {
    if (!file) {
      setLivePngUrl(null);
    }
  }, [file]);

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

        {/* Bouton telecharger - actif des qu'un preview live est genere */}
        {livePngUrl ? (
          <a
            href={livePngUrl}
            download={`sticker-${shader}.png`}
            className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
          >
            <Download size={16} />
            Telecharger PNG
          </a>
        ) : (
          <button
            disabled
            className="w-full py-3 rounded-xl bg-accent/40 text-white/60 font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            {file ? 'Preparation du preview...' : 'Deposer une image pour commencer'}
          </button>
        )}
      </div>

      {/* Preview LIVE - se met a jour en temps reel quand on change stroke/shader */}
      <div
        className={`rounded-xl relative ${!imageUrl ? 'bg-black/20 p-4 flex items-center justify-center min-h-[300px]' : 'overflow-visible p-4'}`}
        style={imageUrl ? {
          backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, 10px 0px',
          borderRadius: '0.75rem',
        } : undefined}
      >
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm p-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {imageUrl ? (
          <StickerPreviewCanvas
            imageUrl={imageUrl}
            shape="diecut"
            finish={shader === 'dots' ? 'glossy' : shader}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            onThumbChange={handleLiveThumb}
            enableTilt={true}
            className="w-full"
          />
        ) : !error && (
          <p className="text-grey-muted text-sm">Le preview apparaitra ici une fois l'image deposee</p>
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
// Resize Tab - Redimensionner + convertir en PNG / JPG / WebP / SVG
// Auto-conversion debounced au changement de parametres
// ---------------------------------------------------------------------------

const RESIZE_FORMATS = [
  {
    key: 'webp', label: 'WebP', ext: '.webp',
    desc: 'Optimal pour le web', badge: 'Recommande',
    badgeColor: 'bg-green-500/20 text-green-400',
    color: 'text-green-400', border: 'border-green-500/20',
  },
  {
    key: 'jpg', label: 'JPG', ext: '.jpg',
    desc: 'Universel, compatible partout',
    color: 'text-yellow-400', border: 'border-yellow-500/20',
  },
  {
    key: 'png', label: 'PNG', ext: '.png',
    desc: 'Lossless, supporte la transparence',
    color: 'text-blue-400', border: 'border-blue-500/20',
  },
  {
    key: 'svg', label: 'SVG', ext: '.svg',
    desc: 'Image raster encapsulee dans SVG',
    color: 'text-purple-400', border: 'border-purple-500/20',
  },
];

function ResizeTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [origSize, setOrigSize] = useState({ w: 0, h: 0, bytes: 0 });
  const [maxWidth, setMaxWidth] = useState(1600);
  const [quality, setQuality] = useState(80);
  const [formats, setFormats] = useState(null); // { png, jpg, webp, svg }
  const [processing, setProcessing] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState(null); // data URL mis a jour instantanement
  const processTimeout = useRef(null);
  const imgRef = useRef(null); // HTMLImageElement cache pour renders rapides

  const fmtBytes = (b) => {
    if (!b && b !== 0) return '...';
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Render instantane (synchrone) via toDataURL - pour le live preview
  const renderLive = (mw, q) => {
    const img = imgRef.current;
    if (!img) return;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > mw) { const r = mw / w; w = mw; h = Math.round(h * r); }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    // toDataURL est synchrone - preview instantane
    setLivePreviewUrl(canvas.toDataURL('image/webp', q / 100));
  };

  // Process complet (async blobs) pour les tailles des cartes format
  const runProcess = (mw, q) => {
    const img = imgRef.current;
    if (!img) return;
    setProcessing(true);
    setFormats(null);
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > mw) { const r = mw / w; w = mw; h = Math.round(h * r); }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);

    const toBlob = (mime, qv) => new Promise(res =>
      canvas.toBlob(blob => res(blob ? { url: URL.createObjectURL(blob), bytes: blob.size, w, h } : null), mime, qv)
    );

    const makeSVG = () => {
      const d = canvas.toDataURL('image/png');
      const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${d}" width="${w}" height="${h}"/></svg>`;
      const b = new Blob([s], { type: 'image/svg+xml' });
      return { url: URL.createObjectURL(b), bytes: b.size, w, h };
    };

    Promise.all([
      toBlob('image/png'),
      toBlob('image/jpeg', q / 100),
      toBlob('image/webp', q / 100),
    ]).then(([png, jpg, webp]) => {
      setFormats({ png, jpg, webp, svg: makeSVG() });
      setProcessing(false);
    });
  };

  const handleFile = (f) => {
    setFile(f);
    setFormats(null);
    setLivePreviewUrl(null);
    setOrigSize({ w: 0, h: 0, bytes: f.size });
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setOrigSize(prev => ({ ...prev, w: img.naturalWidth, h: img.naturalHeight }));
      renderLive(maxWidth, quality);
      clearTimeout(processTimeout.current);
      processTimeout.current = setTimeout(() => runProcess(maxWidth, quality), 300);
    };
    img.src = url;
  };

  // Re-process quand les parametres changent
  useEffect(() => {
    if (!imgRef.current) return;
    // Preview instantane
    renderLive(maxWidth, quality);
    // Blobs pour les tailles (debounce)
    clearTimeout(processTimeout.current);
    processTimeout.current = setTimeout(() => runProcess(maxWidth, quality), 500);
    return () => clearTimeout(processTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxWidth, quality]);

  const download = (fmtData, ext) => {
    if (!fmtData) return;
    const base = (file?.name || 'image').replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = fmtData.url;
    a.download = base + ext;
    a.click();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Colonne gauche: drop + controls */}
      <div className="space-y-4">
        <DropZone
          accept="image/*"
          file={file}
          onFile={handleFile}
          onClear={() => { setFile(null); setPreview(null); setFormats(null); }}
          label="Deposer une image a convertir (PNG, JPG, WebP, TIFF...)"
        />

        {file && (
          <div className="rounded-xl bg-black/20 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-grey-muted">Original</span>
              <span className="text-heading font-mono">{origSize.w}x{origSize.h} &mdash; {fmtBytes(origSize.bytes)}</span>
            </div>

            <div>
              <label className="text-xs text-grey-muted block mb-1">Largeur max: {maxWidth}px</label>
              <input
                type="range" min="200" max="4000" step="100" value={maxWidth}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaxWidth(v);
                  renderLive(v, quality); // preview instantane
                }}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[9px] text-grey-muted mt-0.5">
                <span>200px</span>
                <div className="flex gap-1.5">
                  {[800, 1200, 1600, 2400].map(v => (
                    <button key={v} onClick={() => setMaxWidth(v)}
                      className={`px-1.5 py-0.5 rounded transition-colors ${maxWidth === v ? 'bg-accent text-white' : 'hover:text-heading'}`}>{v}</button>
                  ))}
                </div>
                <span>4000px</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-grey-muted block mb-1">Qualite JPG / WebP: {quality}%</label>
              <input
                type="range" min="10" max="100" step="5" value={quality}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setQuality(v);
                  renderLive(maxWidth, v); // preview instantane
                }}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[9px] text-grey-muted mt-0.5">
                <span>10%</span>
                <div className="flex gap-1.5">
                  {[50, 70, 80, 90].map(v => (
                    <button key={v} onClick={() => setQuality(v)}
                      className={`px-1.5 py-0.5 rounded transition-colors ${quality === v ? 'bg-accent text-white' : 'hover:text-heading'}`}>{v}%</button>
                  ))}
                </div>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Colonne droite: cartes format */}
      <div className="space-y-3">
        {preview && origSize.w > 0 && (
          <div className="rounded-xl overflow-hidden relative"
            style={{
              backgroundImage: 'linear-gradient(45deg,#1a1a1a 25%,transparent 25%),linear-gradient(-45deg,#1a1a1a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1a1a1a 75%),linear-gradient(-45deg,transparent 75%,#1a1a1a 75%)',
              backgroundSize: '14px 14px',
              backgroundPosition: '0 0,0 7px,7px -7px,7px 0',
            }}>
            <img
              src={livePreviewUrl || preview}
              alt="apercu"
              className="max-h-[180px] w-full object-contain transition-none"
            />
            {livePreviewUrl && (
              <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur-sm text-green-400 px-1.5 py-0.5 rounded">
                WebP {quality}% - {Math.min(maxWidth, origSize.w)}px
              </span>
            )}
          </div>
        )}

        {file ? (
          <div className="grid grid-cols-2 gap-2">
            {RESIZE_FORMATS.map(fd => {
              const fmtData = formats?.[fd.key];
              const savings = fmtData && origSize.bytes > 0
                ? Math.round((1 - fmtData.bytes / origSize.bytes) * 100)
                : null;
              return (
                <div key={fd.key}
                  className={`rounded-xl bg-black/20 border ${fd.border} p-3 flex flex-col gap-2`}>
                  <div className="flex items-start justify-between gap-1">
                    <span className={`text-sm font-bold ${fd.color}`}>{fd.label}</span>
                    {fd.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${fd.badgeColor}`}>
                        {fd.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-grey-muted leading-tight">{fd.desc}</p>

                  {/* Taille */}
                  <div className="flex items-center justify-between min-h-[20px]">
                    {processing ? (
                      <Loader2 size={11} className="animate-spin text-grey-muted" />
                    ) : fmtData ? (
                      <>
                        <span className="text-sm font-mono font-semibold text-heading">
                          {fmtBytes(fmtData.bytes)}
                        </span>
                        {savings !== null && (
                          <span className={`text-[10px] font-bold ${
                            savings > 5 ? 'text-green-400' :
                            savings < -5 ? 'text-orange-400' :
                            'text-grey-muted'
                          }`}>
                            {savings > 0 ? `-${savings}%` : savings < 0 ? `+${Math.abs(savings)}%` : '='}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-grey-muted text-xs">-</span>
                    )}
                  </div>

                  {/* Dimensions si disponibles */}
                  {fmtData && (
                    <span className="text-[9px] text-grey-muted font-mono">
                      {fmtData.w}x{fmtData.h}px
                    </span>
                  )}

                  <button
                    onClick={() => download(fmtData, fd.ext)}
                    disabled={!fmtData || processing}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-30 bg-white/5 hover:bg-white/10 ${fd.color}`}
                  >
                    <Download size={11} />
                    Telecharger
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-black/20 flex items-center justify-center min-h-[300px]">
            <p className="text-grey-muted text-sm">Le resultat apparaitra ici</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QR Code Tab - Generateur avance + Tracking dynamique
// ---------------------------------------------------------------------------
// DEFAULTS (fixes par le lead tech - ne pas changer sans accord):
//   - Taille = 1200px (qualite print/affiche sans pixellisation)
//   - Style = 'square' (Simple, lisible par tous les readers)
//   - Error Correction = 'L' (Low) par defaut
//   - Error Correction = 'H' (High) FORCE automatiquement si logo present
//     -> un logo occupe 20-25% de la surface, seul EC='H' (30% recovery) garantit
//        la lisibilite par tous les scanners meme a mauvais angle
// ---------------------------------------------------------------------------

const QR_DEFAULT_SIZE = 1200;
const QR_DEFAULT_STYLE = 'square';
const QR_DEFAULT_EC = 'L';
const QR_EC_WITH_LOGO = 'H';

function QRCodeTab() {
  const [url, setUrl] = useState('https://massivemedias.com');
  const [title, setTitle] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [encodedUrl, setEncodedUrl] = useState(''); // URL que le QR encode VRAIMENT (tracking ou direct)
  const [currentShortId, setCurrentShortId] = useState(''); // si tracking, le shortId du dernier QR cree
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [qrTab, setQrTab] = useState('content'); // content | design | colors | logo | list
  const [dotStyle, setDotStyle] = useState(QR_DEFAULT_STYLE);
  const [ecLevel, setEcLevel] = useState(QR_DEFAULT_EC);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [transparentBg, setTransparentBg] = useState(false);
  const [size, setSize] = useState(QR_DEFAULT_SIZE);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const canvasRef = useRef(null);

  // Mes QR Codes list state
  const [myList, setMyList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  // REGLE METIER: si logo present, force EC = 'H'. L'etat ecLevel reste utilisable
  // par l'utilisateur pour son choix initial, mais effectiveEC prend le dessus pour
  // la generation. Affichage informe aussi l'utilisateur que l'override est actif.
  const effectiveEC = logoUrl ? QR_EC_WITH_LOGO : ecLevel;

  // URL effectivement encodee dans le QR:
  // - Si tracking ON et un QR a ete cree: utilise la trackingUrl retournee par l'API
  // - Sinon: l'URL brute saisie par l'utilisateur
  const effectiveUrl = (trackingEnabled && encodedUrl) ? encodedUrl : url;

  /**
   * Creation d'un QR tracke via l'API backend. Appele quand:
   * - Tracking enabled ET l'url saisie change (debounced)
   * - Ou via bouton manuel "Creer QR tracke"
   */
  const createTrackedQR = useCallback(async () => {
    if (!url.trim() || !trackingEnabled) return;
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await api.post('/qr-codes/create', {
        destinationUrl: url.trim(),
        title: title.trim() || undefined,
      });
      setEncodedUrl(res.data.trackingUrl);
      setCurrentShortId(res.data.shortId);
      // Rafraichir la liste si on etait en train de la consulter
      fetchMyList();
    } catch (err) {
      console.error('createTrackedQR error:', err);
      setCreateError(err?.response?.data?.error?.message || err?.message || 'Erreur de creation');
      // Fallback: encode direct pour que l'utilisateur ait quand meme un QR
      setEncodedUrl('');
      setCurrentShortId('');
    } finally {
      setCreateLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, title, trackingEnabled]);

  const fetchMyList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await api.get('/qr-codes/list');
      setMyList(res.data?.data || []);
    } catch (err) {
      console.error('fetchMyList error:', err);
      setMyList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  const deleteQr = useCallback(async (documentId) => {
    if (!window.confirm('Supprimer ce QR code et tous ses scans?')) return;
    try {
      await api.delete(`/qr-codes/${documentId}`);
      fetchMyList();
    } catch (err) {
      console.error('deleteQr error:', err);
      window.alert('Erreur lors de la suppression');
    }
  }, [fetchMyList]);

  const copyTrackingUrl = useCallback((shortId) => {
    const backend = import.meta.env.VITE_API_URL || 'https://massivemedias-api.onrender.com';
    const fullUrl = `${backend.replace(/\/api\/?$/, '').replace(/\/$/, '')}/api/qr/${shortId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(shortId);
    setTimeout(() => setCopiedId(''), 1800);
  }, []);

  useEffect(() => {
    if (qrTab === 'list') fetchMyList();
  }, [qrTab, fetchMyList]);

  // Quand l'URL ou le titre change ET que le tracking est ON, on re-cree le QR (debounced).
  // Si tracking OFF, on flush encodedUrl pour que le QR encode directement l'URL saisie.
  useEffect(() => {
    if (!trackingEnabled) {
      setEncodedUrl('');
      setCurrentShortId('');
      return;
    }
    const t = setTimeout(() => { createTrackedQR(); }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, trackingEnabled]);

  const generateQR = useCallback(async () => {
    if (!effectiveUrl.trim() || !canvasRef.current) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = canvasRef.current;

      // REGLE METIER: logo present => EC='H' force. Si absent, EC utilisateur.
      const ecForGeneration = effectiveEC;

      const qrData = await QRCode.create(effectiveUrl.trim(), { errorCorrectionLevel: ecForGeneration });
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

      // Logo au centre - dessin ameliore:
      // - Taille proportionnelle max 22% (sous les 25% recommandes pour EC='H' - 30% recovery)
      // - Background blanc arrondi avec padding de 4% de la taille du logo (lisible + net)
      // - Dessin direct dans le callback onload pour eviter la race avec le redessin des modules
      if (logoUrl) {
        const logo = new window.Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const logoRatio = 0.22; // max 22% - sous le seuil des 25%
          const logoSize = size * logoRatio;
          const lx = (size - logoSize) / 2;
          const ly = (size - logoSize) / 2;
          const padding = Math.round(logoSize * 0.12); // ~12% de la taille logo comme padding
          const bgSize = logoSize + padding * 2;
          const bgX = lx - padding;
          const bgY = ly - padding;
          const bgRadius = Math.round(bgSize * 0.18);

          if (transparentBg) {
            ctx.clearRect(bgX, bgY, bgSize, bgSize);
          } else {
            // Background rounded rectangle pour que le logo se detache des pixels QR
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(bgX, bgY, bgSize, bgSize, bgRadius);
            ctx.fill();
          }

          // Dessin du logo lui-meme
          ctx.drawImage(logo, lx, ly, logoSize, logoSize);
        };
        logo.onerror = () => { console.warn('Logo failed to load, QR generated without logo'); };
        logo.src = logoUrl;
      }
    } catch (err) {
      console.error('QR error:', err);
    }
  }, [effectiveUrl, dotStyle, effectiveEC, fgColor, bgColor, size, logoUrl, transparentBg]);

  useEffect(() => { const t = setTimeout(generateQR, 200); return () => clearTimeout(t); }, [generateQR]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    const labelUrl = effectiveUrl.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-').slice(0, 30);
    a.download = `qr-${labelUrl}.png`;
    a.click();
  };

  // FIX-QR-SVG (27 avril 2026) : generateur SVG custom pour eliminer les
  // artefacts horizontaux dans Illustrator.
  //
  // Probleme avec QRCode.toString({ type: 'svg' }) : la lib produit des
  // commandes path optimisees par run-length-encoding sur les rangees
  // (`h N` traversant plusieurs modules adjacents). Quand Illustrator parse,
  // chaque rangee devient un long rectangle horizontal -> les modules
  // apparaissent comme des bandes empilees au lieu de carres distincts.
  //
  // Notre approche :
  //   1. QRCode.create(text) -> { modules: BitMatrix } (donnees brutes)
  //   2. Iterer sur chaque module noir individuellement
  //   3. Construire UN SEUL <path> compound avec un sub-path FERME (Z) par
  //      module : "M x y h 1 v 1 h -1 Z M x2 y2 h 1 v 1 h -1 Z ..."
  //      Aucune fusion possible entre modules adjacents -> pas d'artefact.
  //   4. Variantes pour dotStyle 'dots' et 'rounded' avec courbes bezier.
  //   5. shape-rendering="crispEdges" sur le <svg> pour rendu net.
  //   6. stroke="none" explicite partout (jamais de contour parasite).
  //   7. Logo embed via <image> + rect blanc arrondi derriere si logoUrl.
  //
  // Resultat : Illustrator voit un compound path avec N sub-paths discrets,
  // chacun = 1 module net. Pretes pour impression professionnelle.
  const handleDownloadSVG = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const qrData = await QRCode.create(effectiveUrl.trim(), { errorCorrectionLevel: effectiveEC });
      const modules = qrData.modules;
      const modSize = modules.size;
      const margin = 2; // quiet zone en modules (cf comportement original toString)
      const totalSize = modSize + margin * 2;

      // Helpers de geometrie en unites "module" (1 module = 1 unit dans le viewBox).
      // L'unite reelle est definie par width/height en pixels, ce qui garantit la
      // precision mathematique sans arrondi flottant.

      // Sub-path carre ferme : 1 module plein
      const squarePath = (col, row) => {
        const x = col + margin;
        const y = row + margin;
        return `M${x} ${y}h1v1h-1Z`;
      };

      // Sub-path rounded rect ferme avec coins arrondis (radius en unites module).
      // Utilise des arcs (A) pour les 4 coins. Plus compact que les cubics beziers
      // et donne un cercle parfait dans Illustrator. Les bords interieurs restent
      // droits (h/v) entre les arcs.
      const roundedPath = (col, row, r) => {
        const x = col + margin;
        const y = row + margin;
        const inset = (1 - 0.96) / 2; // 2% inset comme le canvas (cellSize - 1 sur 1)
        const x1 = x + inset, y1 = y + inset;
        const w = 1 - inset * 2;
        // Sub-path : start au coin haut-gauche apres l'arc
        return `M${x1 + r} ${y1}` +
          `h${w - 2 * r}` +
          `a${r} ${r} 0 0 1 ${r} ${r}` +
          `v${w - 2 * r}` +
          `a${r} ${r} 0 0 1 ${-r} ${r}` +
          `h${-(w - 2 * r)}` +
          `a${r} ${r} 0 0 1 ${-r} ${-r}` +
          `v${-(w - 2 * r)}` +
          `a${r} ${r} 0 0 1 ${r} ${-r}` +
          `Z`;
      };

      // Sub-path cercle ferme : 2 arcs demi-cercles. Equivalent geometrique
      // d'un <circle> mais inclu dans le compound path pour rester sur 1 seul
      // <path>. Diametre = 0.76 module (meme ratio que le canvas dots: 0.38 radius).
      const circlePath = (col, row, radius) => {
        const cx = col + margin + 0.5;
        const cy = row + margin + 0.5;
        return `M${cx - radius} ${cy}` +
          `a${radius} ${radius} 0 1 0 ${radius * 2} 0` +
          `a${radius} ${radius} 0 1 0 ${-radius * 2} 0` +
          `Z`;
      };

      // Construire le compound path complet en accumulant les sub-paths.
      // get(row, col) - on respecte l'ordre de la lib qrcode (cf canvas ligne 1547).
      let pathData = '';
      const ROUNDED_RADIUS = 0.32;
      const DOT_RADIUS = 0.38;
      for (let row = 0; row < modSize; row++) {
        for (let col = 0; col < modSize; col++) {
          if (!modules.get(row, col)) continue;
          if (dotStyle === 'dots') {
            pathData += circlePath(col, row, DOT_RADIUS);
          } else if (dotStyle === 'rounded') {
            pathData += roundedPath(col, row, ROUNDED_RADIUS);
          } else {
            pathData += squarePath(col, row);
          }
        }
      }

      // Construire le SVG. ViewBox en unites module pour la precision math.
      // width/height en pixels pour le rendu cible. shape-rendering="crispEdges"
      // sur le <svg> racine s'applique a tous les enfants -> bords mathematiquement
      // parfaits sans antialiasing. fill explicite, stroke="none" explicite.
      const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const safeFg = escapeXml(fgColor);
      const safeBg = escapeXml(bgColor);

      // Background : rect plein si pas transparent. stroke="none" explicite.
      const bgRect = transparentBg
        ? ''
        : `<rect width="${totalSize}" height="${totalSize}" fill="${safeBg}" stroke="none"/>`;

      // Logo (optionnel) : image SVG embeddee + rect blanc arrondi derriere
      // pour lisibilite. Meme ratio que le canvas (22% taille, padding 12%).
      let logoMarkup = '';
      if (logoUrl) {
        const logoRatio = 0.22;
        const logoSize = totalSize * logoRatio;
        const lx = (totalSize - logoSize) / 2;
        const ly = (totalSize - logoSize) / 2;
        const padding = logoSize * 0.12;
        const bgSize = logoSize + padding * 2;
        const bgX = lx - padding;
        const bgY = ly - padding;
        const bgRadius = bgSize * 0.18;
        const safeLogoBg = transparentBg ? 'white' : safeBg;
        logoMarkup =
          `<rect x="${bgX}" y="${bgY}" width="${bgSize}" height="${bgSize}" rx="${bgRadius}" ry="${bgRadius}" fill="${safeLogoBg}" stroke="none"/>` +
          `<image x="${lx}" y="${ly}" width="${logoSize}" height="${logoSize}" href="${escapeXml(logoUrl)}" preserveAspectRatio="xMidYMid meet"/>`;
      }

      const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
  ${bgRect}
  <path d="${pathData}" fill="${safeFg}" stroke="none" shape-rendering="crispEdges"/>
  ${logoMarkup}
</svg>`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const labelUrl = effectiveUrl.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-').slice(0, 30);
      a.download = `qr-${labelUrl}.svg`;
      a.click();
      // Cleanup memoire apres un court delai (laisse le navigateur trigger le DL)
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err) { console.error('SVG error:', err); }
  };

  const TABS_QR = [
    { id: 'content', label: 'Contenu' },
    { id: 'design', label: 'Design' },
    { id: 'colors', label: 'Couleurs' },
    { id: 'logo', label: 'Logo' },
    { id: 'list', label: 'Mes QR' },
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
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">URL de destination</label>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://massivemedias.com"
                className="w-full rounded-lg bg-black/30 text-heading text-sm px-3 py-2.5 outline-none border border-white/5 focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">Titre (optionnel)</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Carte affaires Michael"
                className="w-full rounded-lg bg-black/30 text-heading text-sm px-3 py-2.5 outline-none border border-white/5 focus:border-accent" />
            </div>

            {/* Toggle tracking dynamique */}
            <div className="rounded-lg bg-black/30 p-3 border border-accent/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${trackingEnabled ? 'bg-accent' : 'bg-white/10'}`}
                    onClick={() => setTrackingEnabled(!trackingEnabled)}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${trackingEnabled ? 'translate-x-4 ml-0.5' : 'ml-0.5'}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-heading text-xs font-semibold flex items-center gap-1">
                    <BarChart3 size={12} className="text-accent" />
                    QR tracke (recommande)
                  </p>
                  <p className="text-grey-muted text-[10px] mt-0.5">
                    Le QR encode une URL courte qui passe par notre serveur pour compter les scans,
                    puis redirige vers ta destination. Tu peux voir les stats dans "Mes QR".
                  </p>
                  {trackingEnabled && currentShortId && (
                    <p className="text-accent text-[10px] mt-1 font-mono">
                      QR cree: /qr/{currentShortId}
                    </p>
                  )}
                  {trackingEnabled && createLoading && (
                    <p className="text-grey-muted text-[10px] mt-1 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Creation en cours...
                    </p>
                  )}
                  {createError && (
                    <p className="text-red-400 text-[10px] mt-1">
                      {createError}
                    </p>
                  )}
                </div>
              </label>
            </div>

            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
                Correction d'erreur
                <span className="text-grey-muted/50 normal-case ml-1">(Low = moins de points)</span>
                {logoUrl && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[9px] normal-case">
                    force a HIGH (logo detecte)
                  </span>
                )}
              </label>
              <div className="flex gap-1.5">
                {[
                  { id: 'L', label: 'Low', desc: 'Simple' },
                  { id: 'M', label: 'Medium', desc: 'Standard' },
                  { id: 'Q', label: 'Quartile', desc: 'Fiable' },
                  { id: 'H', label: 'High', desc: 'Max / Logo' },
                ].map(e => {
                  const isActive = effectiveEC === e.id;
                  const isDisabled = !!logoUrl && e.id !== 'H';
                  return (
                    <button key={e.id} onClick={() => !isDisabled && setEcLevel(e.id)}
                      disabled={isDisabled}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive ? 'bg-accent text-white' :
                        isDisabled ? 'bg-black/10 text-grey-muted/40 cursor-not-allowed' :
                        'bg-black/20 text-grey-muted hover:text-heading'
                      }`}>
                      <span className="block">{e.label}</span>
                      <span className="block text-[9px] opacity-60">{e.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">Taille: {size}px</label>
              <input type="range" min="200" max="1600" step="50" value={size}
                onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-accent" />
              <div className="flex justify-between text-[9px] text-grey-muted mt-1">
                {[400, 600, 800, 1200, 1600].map(v => (
                  <button key={v} onClick={() => setSize(v)}
                    className={`px-1.5 py-0.5 rounded ${size === v ? 'bg-accent text-white' : 'hover:text-heading'}`}>{v}</button>
                ))}
              </div>
              <p className="text-[10px] text-grey-muted mt-1">Defaut: 1200px (qualite print)</p>
            </div>
          </div>
        )}

        {/* Tab: Mes QR Codes (liste + stats) */}
        {qrTab === 'list' && (
          <div className="rounded-xl bg-black/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-heading text-sm font-semibold flex items-center gap-2">
                <BarChart3 size={14} className="text-accent" />
                Mes QR codes tracks
              </h3>
              <button onClick={fetchMyList} disabled={listLoading}
                className="text-[10px] text-accent hover:underline disabled:opacity-50">
                {listLoading ? 'Chargement...' : 'Rafraichir'}
              </button>
            </div>
            {myList.length === 0 && !listLoading && (
              <div className="text-center py-8 text-grey-muted text-xs">
                Aucun QR tracke encore. Cree-en un dans l'onglet "Contenu" avec le tracking active.
              </div>
            )}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {myList.map((q) => (
                <div key={q.documentId} className="rounded-lg bg-black/30 p-3 border border-white/5 hover:border-accent/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-heading text-xs font-semibold truncate">{q.title || q.destinationUrl}</p>
                      <a href={q.destinationUrl} target="_blank" rel="noopener noreferrer"
                        className="text-grey-muted text-[10px] truncate block hover:text-accent"
                        title={q.destinationUrl}>
                        {q.destinationUrl}
                      </a>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                        {q.scansCount} scan{q.scansCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-grey-muted">
                    <span className="font-mono">/qr/{q.shortId}</span>
                    <span>
                      {new Date(q.createdAt).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {q.lastScannedAt && ` · dernier: ${new Date(q.lastScannedAt).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <button onClick={() => copyTrackingUrl(q.shortId)}
                      className="flex-1 py-1.5 rounded text-[10px] bg-black/30 text-grey-muted hover:text-accent hover:bg-black/40 flex items-center justify-center gap-1">
                      {copiedId === q.shortId ? <><Check size={10} /> Copie</> : <><Copy size={10} /> URL tracke</>}
                    </button>
                    <a href={q.destinationUrl} target="_blank" rel="noopener noreferrer"
                      className="py-1.5 px-2 rounded text-[10px] bg-black/30 text-grey-muted hover:text-accent hover:bg-black/40 flex items-center gap-1"
                      title="Ouvrir destination">
                      <ExternalLink size={10} />
                    </a>
                    <button onClick={() => deleteQr(q.documentId)}
                      className="py-1.5 px-2 rounded text-[10px] bg-black/30 text-grey-muted hover:text-red-400 hover:bg-black/40 flex items-center gap-1"
                      title="Supprimer">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
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
            <p className="text-grey-muted text-[10px]">Quand un logo est present, la correction d'erreur est automatiquement forcee a HIGH (30%) pour garantir la lisibilite du QR code meme avec le logo au centre.</p>
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
        <p className="text-grey-muted text-[10px] text-center max-w-[320px]">
          {effectiveUrl.length} caracteres | {effectiveEC} correction{logoUrl ? ' (auto logo)' : ''} | {size}px{trackingEnabled && currentShortId ? ' | tracke' : ''}
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
      <p className="text-xs text-accent font-semibold uppercase tracking-wider">Bientôt disponible</p>

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
        {activeTab === 'merch' && <MerchMockupTool />}
        {activeTab === 'resize' && <ResizeTab />}
        {activeTab === 'qrcode' && <QRCodeTab />}
        {activeTab === 'lens' && <LensTab />}
      </motion.div>
    </div>
  );
}

export default AdminMassiveIA;

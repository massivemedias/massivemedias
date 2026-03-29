const AI_BASE_URL = 'https://ai.massivemedias.com';

export async function checkHealth() {
  const res = await fetch(`${AI_BASE_URL}/health`);
  return res.json();
}

/**
 * Chat streaming via ReadableStream (SSE).
 * Appelle onToken(text) pour chaque chunk, onDone() a la fin.
 * Retourne un AbortController pour annuler.
 */
export function chatStream({ message, model, temperature, max_tokens, system_prompt, history }, { onToken, onDone, onError }) {
  const controller = new AbortController();

  fetch(`${AI_BASE_URL}/api/v1/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      model: model || 'mistral:7b-instruct-q4_K_M',
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 1024,
      system_prompt: system_prompt || 'Tu es un assistant utile. Reponds en francais.',
      history: history || [],
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) onToken(parsed.token);
          } catch {
            // Chunk brut (pas JSON) - traiter comme texte
            if (data) onToken(data);
          }
        }
      }
      onDone?.();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError?.(err);
    });

  return controller;
}

export async function processSticker(file, { stroke_color = '#FFFFFF', stroke_width = 3, shader = 'none' } = {}) {
  const form = new FormData();
  form.append('file', file);
  form.append('stroke_color', stroke_color);
  form.append('stroke_width', String(Math.round(stroke_width)));
  form.append('shader', shader);

  const res = await fetch(`${AI_BASE_URL}/api/v1/stickers/process`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function generateMockup(file, scene = 'living_room') {
  const form = new FormData();
  form.append('file', file);
  form.append('scene', scene);

  const res = await fetch(`${AI_BASE_URL}/api/v1/prints/mockup`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

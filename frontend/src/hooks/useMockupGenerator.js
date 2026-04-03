/**
 * useMockupGenerator - Custom hook pour la generation de mockups AI
 *
 * Features:
 * - Appel API avec retry automatique (2 tentatives)
 * - Rate limiting cote client (max 5 generations / heure)
 * - Cache simple en memoire (meme image + scene + frame = pas de re-generation)
 * - Gestion loading/error/success
 * - Timeout 60s
 */
import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

// Rate limiting: 5 generations par heure par session
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 heure

// Cache en memoire pour eviter les re-generations identiques
const cache = new Map();
const rateLimitLog = [];

function isRateLimited() {
  const now = Date.now();
  // Nettoyer les entrees expirees
  while (rateLimitLog.length > 0 && rateLimitLog[0] < now - RATE_WINDOW) {
    rateLimitLog.shift();
  }
  return rateLimitLog.length >= RATE_LIMIT;
}

function logGeneration() {
  rateLimitLog.push(Date.now());
}

function getRemainingGenerations() {
  const now = Date.now();
  while (rateLimitLog.length > 0 && rateLimitLog[0] < now - RATE_WINDOW) {
    rateLimitLog.shift();
  }
  return Math.max(0, RATE_LIMIT - rateLimitLog.length);
}

function getCacheKey(imageUrl, scene, frameColor) {
  return `${imageUrl}|${scene}|${frameColor}`;
}

export default function useMockupGenerator() {
  const [mockupData, setMockupData] = useState(null); // "data:image/...;base64,..."
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scene, setScene] = useState('living_room');
  const abortRef = useRef(null);

  const generate = useCallback(async (imageUrl, selectedScene, frameColor = 'black') => {
    if (!imageUrl) return;

    const sceneToUse = selectedScene || scene;

    // Verifier le cache
    const key = getCacheKey(imageUrl, sceneToUse, frameColor);
    if (cache.has(key)) {
      setMockupData(cache.get(key));
      setError('');
      return;
    }

    // Rate limiting
    if (isRateLimited()) {
      setError('rate_limited');
      return;
    }

    // Annuler la requete precedente si en cours
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    setMockupData(null);

    let lastErr = null;
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await api.post('/mockup/generate', {
          imageUrl,
          scene: sceneToUse,
          frameColor,
        }, {
          timeout: 60000,
          signal: controller.signal,
        });

        if (res.data?.success && res.data?.image) {
          const { mimeType, data } = res.data.image;
          const dataUri = `data:${mimeType};base64,${data}`;
          setMockupData(dataUri);
          cache.set(key, dataUri);
          logGeneration();
          setLoading(false);
          return;
        }

        lastErr = 'generation_failed';
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') {
          setLoading(false);
          return;
        }
        lastErr = err.response?.status === 429 ? 'rate_limited' : 'network_error';
        // Attendre 2s avant retry
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    setError(lastErr || 'generation_failed');
    setLoading(false);
  }, [scene]);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setMockupData(null);
    setError('');
  }, [cancel]);

  return {
    mockupData,
    loading,
    error,
    scene,
    setScene,
    generate,
    cancel,
    reset,
    remaining: getRemainingGenerations(),
  };
}

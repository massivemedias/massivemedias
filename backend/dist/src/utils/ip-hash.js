"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countDistinctVisitors = exports.normalizeWindow = exports.VISITOR_WINDOWS = exports.hashIpSalted = void 0;
// ADMIN-VISITORS (9 juillet 2026) : hash IP conforme Loi 25, partage.
// Meme algo que hashIp() de api/qr-code (sha256 sale via QR_IP_HASH_SALT).
// JAMAIS d'IP en clair stockee ou loggee : on ne garde que ce hash.
const crypto_1 = __importDefault(require("crypto"));
/**
 * sha256(ip_nettoyee + salt) -> 64 hex. Retourne '' si l'IP ou le salt
 * manque (sans salt le hash serait reversible par force brute, on prefere
 * ne rien stocker qu'un hash faible). Le salt vit dans QR_IP_HASH_SALT
 * (variable Render, jamais dans le code).
 */
function hashIpSalted(ip, salt) {
    const clean = (ip || '').replace(/^::ffff:/, '').trim();
    if (!clean || !salt)
        return '';
    return crypto_1.default.createHash('sha256').update(clean + salt).digest('hex');
}
exports.hashIpSalted = hashIpSalted;
/**
 * Fenetres de comptage supportees par le widget admin (heures).
 * Cle -> millisecondes. Toute cle hors de cette table est refusee.
 */
exports.VISITOR_WINDOWS = {
    '1h': 60 * 60 * 1000,
    '3h': 3 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
};
/**
 * Normalise une fenetre demandee par le client vers une cle valide.
 * Defaut '3h' (celle du brief) pour toute valeur inconnue/absente.
 */
function normalizeWindow(raw) {
    const key = String(raw || '').trim();
    return exports.VISITOR_WINDOWS[key] ? key : '3h';
}
exports.normalizeWindow = normalizeWindow;
/**
 * Compte les ipHash DISTINCTS dans une liste de hits sur une fenetre.
 * Pur (testable sans DB) : recoit les hits deja charges, filtre par
 * hitAt >= now - window, deduplique les ipHash non vides.
 */
function countDistinctVisitors(hits, windowKey, now) {
    const span = exports.VISITOR_WINDOWS[windowKey] || exports.VISITOR_WINDOWS['3h'];
    const cutoff = now - span;
    const seen = new Set();
    for (const h of hits) {
        if (!h.ipHash)
            continue;
        const t = h.hitAt ? new Date(h.hitAt).getTime() : 0;
        if (t >= cutoff)
            seen.add(h.ipHash);
    }
    return seen.size;
}
exports.countDistinctVisitors = countDistinctVisitors;

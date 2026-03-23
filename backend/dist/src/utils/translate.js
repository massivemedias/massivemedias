"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateJson = exports.translateText = void 0;
const deepl = __importStar(require("deepl-node"));
let translator = null;
let circuitBroken = false; // Stop trying after quota/auth errors
function getTranslator() {
    if (circuitBroken)
        return null;
    if (translator)
        return translator;
    const key = process.env.DEEPL_AUTH_KEY;
    if (!key) {
        console.warn('DEEPL_AUTH_KEY not set - auto-translation disabled');
        circuitBroken = true;
        return null;
    }
    translator = new deepl.Translator(key);
    return translator;
}
async function translateText(text, targetLang = 'en-US') {
    if (!text || !text.trim())
        return null;
    const t = getTranslator();
    if (!t)
        return null;
    try {
        const result = await t.translateText(text, 'fr', targetLang);
        return result.text;
    }
    catch (err) {
        const msg = err.message || '';
        console.error(`DeepL translation error (${targetLang}):`, msg);
        // Circuit breaker: stop retrying on quota/auth errors
        if (msg.includes('Quota') || msg.includes('quota') || msg.includes('403') || msg.includes('456')) {
            console.warn('DeepL circuit breaker activated - disabling translations for this session');
            circuitBroken = true;
        }
        return null;
    }
}
exports.translateText = translateText;
async function translateJson(obj, targetLang = 'en-US') {
    if (obj == null)
        return null;
    const t = getTranslator();
    if (!t)
        return null;
    try {
        if (typeof obj === 'string') {
            return await translateText(obj, targetLang);
        }
        if (Array.isArray(obj)) {
            const results = [];
            for (const item of obj) {
                results.push(await translateJson(item, targetLang));
            }
            return results;
        }
        if (typeof obj === 'object') {
            const result = {};
            for (const [key, val] of Object.entries(obj)) {
                if (typeof val === 'string' && val.trim()) {
                    result[key] = await translateText(val, targetLang);
                }
                else {
                    result[key] = val;
                }
            }
            return result;
        }
        return obj;
    }
    catch (err) {
        console.error(`DeepL JSON translation error (${targetLang}):`, err.message);
        return null;
    }
}
exports.translateJson = translateJson;

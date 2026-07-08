"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSkuPrice = exports.hashIpForLog = exports.getAffichePriceUnit = void 0;
// =======================================================
// SEC-04 (8 juillet 2026) : registre central des familles de SKU vendables
// au checkout public. WHITELIST STRICTE : tout productId doit correspondre
// a une famille connue avec un prix calculable serveur, sinon la creation
// de session echoue en 400 avec un message clair. Fini le fallback
// "validPrice = item.totalPrice || 0" (prix client accepte tel quel sur
// Stripe LIVE = faille de manipulation de prix).
//
// Les DEUX chemins de checkout (createPaymentIntent et createCheckoutSession
// dans api/order/controllers/order.ts) passent par resolveSkuPrice. Aucune
// divergence de validation entre les deux boucles.
//
// Regle d'or : le prix force serveur = la grille de VENTE affichee par le
// front (le client ne paie JAMAIS plus que ce qu'il voit). Les grilles
// miroir vivent dans pricing-config.ts.
// =======================================================
const crypto_1 = __importDefault(require("crypto"));
const pricing_config_1 = require("./pricing-config");
const okRes = (family, price) => ({
    ok: true,
    family,
    price: Math.round(price * 100) / 100,
});
const rejectRes = (family, reject) => ({ ok: false, family, reject });
// Quantite panier saine : entier >= 1 (le front envoie deja des entiers,
// on se blinde contre les payloads forges).
function cleanQty(item) {
    const q = Math.floor(Number(item === null || item === void 0 ? void 0 : item.quantity));
    return Number.isFinite(q) && q >= 1 ? q : 1;
}
// Prix UNITAIRE Affiches Standard au palier le plus eleve <= qty.
// Portage exact de getAffichePrice (frontend/src/data/products.js) : memes
// validations, meme selection de palier.
function getAffichePriceUnit(formatKey, qty, paliers) {
    if (!paliers || typeof paliers !== 'object' || Array.isArray(paliers))
        return null;
    if (typeof formatKey !== 'string' || formatKey.length === 0)
        return null;
    if (typeof qty !== 'number' || !Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0)
        return null;
    const formatPaliers = paliers[formatKey];
    if (!formatPaliers || typeof formatPaliers !== 'object' || Array.isArray(formatPaliers))
        return null;
    const validPaliers = Object.entries(formatPaliers)
        .map(([k, v]) => [Number(k), v])
        .filter(([k, v]) => Number.isInteger(k) && k > 0 && typeof v === 'number' && Number.isFinite(v) && v > 0)
        .sort((a, b) => a[0] - b[0]);
    if (validPaliers.length === 0)
        return null;
    let selectedPrice = null;
    for (const [palier, price] of validPaliers) {
        if (palier <= qty)
            selectedPrice = price;
        else
            break;
    }
    return selectedPrice;
}
exports.getAffichePriceUnit = getAffichePriceUnit;
// Mapping format SKU (minuscule) -> cle palier CMS (majuscule), miroir de
// FORMAT_ID_TO_PALIER_KEY (ConfiguratorFineArt.jsx).
const AFFICHE_FORMAT_TO_PALIER_KEY = {
    a4: 'A4',
    a3: 'A3',
    a3plus: 'A3+',
    a2: 'A2',
};
// Hash IP conforme Loi 25 pour le logging des refus : sha256(ip + salt),
// jamais d'IP en clair. Reutilise le salt existant QR_IP_HASH_SALT (deja
// configure sur Render pour les scans QR) - zero nouveau secret.
function hashIpForLog(ip) {
    const clean = String(ip || '').trim();
    const salt = process.env.QR_IP_HASH_SALT || '';
    if (!clean || !salt)
        return '';
    return crypto_1.default.createHash('sha256').update(clean + salt).digest('hex').slice(0, 16);
}
exports.hashIpForLog = hashIpForLog;
/**
 * Resout le prix serveur d'un item du panier public.
 * - { ok: true, price, family } : prix TOTAL force serveur pour cet item.
 * - { ok: false, reject, family } : item refuse, message client FR pret a
 *   afficher (CheckoutForm montre error.message dans son bandeau rouge).
 * Ne trust JAMAIS item.totalPrice, sauf tolerance d'arrondi artist-print
 * (1 cent) heritee de la validation CMS existante.
 */
async function resolveSkuPrice(item, deps = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const pid = typeof (item === null || item === void 0 ? void 0 : item.productId) === 'string' ? item.productId : '';
    const qty = cleanQty(item);
    if (!pid) {
        return rejectRes('inconnu', 'Un article du panier n\'a pas d\'identifiant de produit. Vide ton panier et recommence.');
    }
    // --- Stickers custom / artiste : grille officielle 3 paliers de taille.
    // SEC-04 : palier inconnu = REJET (avant : fallback prix client + warn).
    if (pid === 'sticker-custom' || pid === 'sticker-artist') {
        const finishLower = String(item.finish || '').toLowerCase();
        const tierPrice = (0, pricing_config_1.lookupStickerPriceBySize)(finishLower, item.quantity, item.size);
        if (tierPrice == null) {
            return rejectRes('sticker-custom', `Combinaison taille/quantite invalide pour les stickers (taille: ${item.size || '?'}, quantite: ${item.quantity || '?'}). Choisis un palier du configurateur.`);
        }
        return okRes('sticker-custom', tierPrice);
    }
    // --- Collection Massive (STICKERS-SHOP-B) : 2 $ / design.
    if (pid.startsWith('sticker-massive-')) {
        return okRes('sticker-massive', qty * pricing_config_1.STICKER_COLLECTION_UNIT_PRICE);
    }
    // --- Mystery packs : 3 tailles fixes, taille inconnue rejetee.
    if (pid.startsWith('mystery-pack-')) {
        const packSize = parseInt(pid.replace('mystery-pack-', ''), 10);
        const packPrice = pricing_config_1.MYSTERY_PACK_PRICES[packSize];
        if (packPrice == null) {
            return rejectRes('mystery-pack', `Mystery pack invalide: ${pid}`);
        }
        return okRes('mystery-pack', packPrice * qty);
    }
    // --- Cartes d'affaires : paliers stricts par variante.
    if (pid.startsWith('business-card-')) {
        const cardTiers = pricing_config_1.BUSINESS_CARD_TIERS[pid];
        const tierPrice = cardTiers ? cardTiers[qty] : null;
        if (tierPrice == null) {
            return rejectRes('business-card', `Palier cartes d'affaires invalide (${pid}, quantite ${qty}). Quantites valides: 100, 250, 500${pid.endsWith('premium') ? '' : ', 1000'}.`);
        }
        return okRes('business-card', tierPrice);
    }
    // --- Flyers A6 : grille stricte recto / recto-verso.
    if (pid === 'flyer-a6') {
        const finishLower = String(item.finish || '').toLowerCase();
        const isRectoVerso = finishLower.includes('recto-verso') || finishLower.includes('double');
        const grid = isRectoVerso ? pricing_config_1.FLYER_RECTO_VERSO_TIERS : pricing_config_1.FLYER_TIERS;
        const tierPrice = grid[qty];
        if (tierPrice == null) {
            return rejectRes('flyer', `Quantite de flyers invalide (${qty}). Quantites valides: 50, 100, 150, 250, 500.`);
        }
        return okRes('flyer', tierPrice);
    }
    // --- Packs stickers d'artiste (configurateur) : grille + interpolation,
    // minimum 10. Le timestamp du SKU n'influence pas le prix (grille unique).
    if (pid.startsWith('artist-sticker-pack-')) {
        const price = (0, pricing_config_1.getArtistStickerPackPrice)(qty);
        if (price == null) {
            return rejectRes('artist-sticker-pack', `Minimum 10 stickers par pack d'artiste (quantite recue: ${qty}).`);
        }
        return okRes('artist-sticker-pack', price);
    }
    // --- Prints d'artiste : validation CMS complete (deplacee de la boucle
    // createCheckoutSession, comportement identique, maintenant appliquee aux
    // DEUX chemins de checkout).
    if (pid.startsWith('artist-print-')) {
        if (!deps.getArtists) {
            return rejectRes('artist-print', 'Validation du prix impossible, reessayez plus tard');
        }
        try {
            const artists = await deps.getArtists();
            let matchedArtist = null;
            let printId = '';
            for (const a of artists) {
                if (pid.startsWith(`artist-print-${a.slug}-`)) {
                    if (!matchedArtist || a.slug.length > matchedArtist.slug.length) {
                        matchedArtist = a;
                        printId = pid.replace(`artist-print-${a.slug}-`, '');
                    }
                }
            }
            if (!matchedArtist || !printId) {
                return rejectRes('artist-print', `Print introuvable: ${pid}`);
            }
            const prints = Array.isArray(matchedArtist.prints) ? matchedArtist.prints : [];
            const print = prints.find((p) => p.id === printId);
            if (!print) {
                return rejectRes('artist-print', `Print ${printId} introuvable chez ${matchedArtist.slug}`);
            }
            if (print.sold === true) {
                return rejectRes('artist-print', `Cette oeuvre a deja ete vendue et n'est plus disponible.`);
            }
            // RACE-01 : reservee par un autre checkout actif = refus temporaire.
            const reservedUntilTs = print.reservedUntil ? new Date(print.reservedUntil).getTime() : 0;
            if (reservedUntilTs > Date.now()) {
                const minsLeft = Math.max(1, Math.ceil((reservedUntilTs - Date.now()) / 60000));
                return rejectRes('artist-print', `Cette oeuvre est actuellement reservee par un autre client (dispo dans ${minsLeft} min si le paiement echoue).`);
            }
            const pricing = matchedArtist.pricing || {};
            const tier = print.fixedTier || 'studio';
            const format = print.fixedFormat || 'a4';
            const tierPrices = tier === 'museum' ? (pricing.museum || {}) : (pricing.studio || {});
            const basePrice = tierPrices[format] || 0;
            const frameMap = pricing.framePriceByFormat || {};
            const expectedFramePrice = (print.withFrame || item.shape)
                ? ((_c = (_a = frameMap[format]) !== null && _a !== void 0 ? _a : (_b = pricing_config_1.FINE_ART_SALE_GRID[format]) === null || _b === void 0 ? void 0 : _b.frame) !== null && _c !== void 0 ? _c : 30)
                : 0;
            let expectedUnitPrice;
            if (print.unique === true && typeof print.customPrice === 'number') {
                expectedUnitPrice = print.customPrice;
            }
            else {
                expectedUnitPrice = basePrice + expectedFramePrice;
            }
            if (print.onSale && typeof print.salePercent === 'number') {
                expectedUnitPrice = Math.round(expectedUnitPrice * (1 - print.salePercent / 100) * 100) / 100;
            }
            const effQty = (print.unique === true || print.private === true) ? 1 : qty;
            const expectedTotal = Math.round(expectedUnitPrice * effQty * 100) / 100;
            // Tolerance 1 cent pour les arrondis client (comportement herite).
            if (Math.abs((Number(item.totalPrice) || 0) - expectedTotal) > 0.01) {
                (_e = (_d = deps.log) === null || _d === void 0 ? void 0 : _d.warn) === null || _e === void 0 ? void 0 : _e.call(_d, `Prix manipule detecte: ${pid} client=${item.totalPrice} expected=${expectedTotal}`);
                return okRes('artist-print', expectedTotal);
            }
            return okRes('artist-print', Number(item.totalPrice));
        }
        catch (_) {
            return rejectRes('artist-print', 'Validation du prix impossible, reessayez plus tard');
        }
    }
    // --- Affiches Standard (volume B2B) : paliers CMS uniquement, format
    // encode dans le SKU (affiche-standard-<format>).
    if (pid === 'affiche-standard') {
        const sku = typeof item.sku === 'string' ? item.sku : '';
        const format = sku.startsWith('affiche-standard-') ? sku.replace('affiche-standard-', '') : '';
        const palierKey = AFFICHE_FORMAT_TO_PALIER_KEY[format.toLowerCase()];
        if (!palierKey) {
            return rejectRes('affiche-standard', `Format d'affiche invalide (${format || 'absent'}). Formats valides: A4, A3, A3+, A2.`);
        }
        if (!deps.getProductBySlug) {
            return rejectRes('affiche-standard', 'Validation du prix impossible, reessayez plus tard');
        }
        try {
            const product = await deps.getProductBySlug('affiche-standard');
            const paliers = ((_f = product === null || product === void 0 ? void 0 : product.pricingData) === null || _f === void 0 ? void 0 : _f.afficheStandardPaliers) || null;
            const unit = getAffichePriceUnit(palierKey, qty, paliers);
            if (unit == null) {
                return rejectRes('affiche-standard', `Quantite invalide pour les Affiches Standard (${qty} x ${palierKey}).`);
            }
            return okRes('affiche-standard', unit * qty);
        }
        catch (_) {
            return rejectRes('affiche-standard', 'Validation du prix impossible, reessayez plus tard');
        }
    }
    // --- Fine Art (Studio / Musee) : grille de vente par format, cadre inclus
    // selon le SKU fine-art-<tier>-<format>[-frame-<color>].
    if (pid === 'fine-art-print') {
        const sku = typeof item.sku === 'string' ? item.sku : '';
        const m = sku.match(/^fine-art-(studio|museum)-([a-z0-9+]+?)(-frame-(black|white))?$/);
        if (!m) {
            return rejectRes('fine-art', 'Configuration Fine Art illisible. Repasse par le configurateur.');
        }
        const tier = m[1];
        const format = m[2];
        const withFrame = !!m[3];
        const entry = pricing_config_1.FINE_ART_SALE_GRID[format];
        if (!entry) {
            return rejectRes('fine-art', `Format Fine Art invalide: ${format}.`);
        }
        const base = tier === 'studio' ? entry.studio : entry.museum;
        if (base == null) {
            return rejectRes('fine-art', `Le format ${format} n'est pas disponible en Serie Studio.`);
        }
        const unit = base + (withFrame ? entry.frame : 0);
        return okRes('fine-art', unit * qty);
    }
    // --- Depot de reservation flash tattoo : montant fixe, quantite forcee 1.
    if (pid.startsWith('deposit-flash-')) {
        return okRes('deposit-flash', pricing_config_1.DEPOSIT_FLASH_PRICE);
    }
    // --- Cartes cadeaux : montant libre ENTIER encode dans le SKU, borne.
    if (pid.startsWith('gift-card-')) {
        const amountStr = pid.replace('gift-card-', '');
        const amount = /^\d+$/.test(amountStr) ? parseInt(amountStr, 10) : NaN;
        if (!Number.isInteger(amount) || amount < pricing_config_1.GIFT_CARD_MIN || amount > pricing_config_1.GIFT_CARD_MAX) {
            return rejectRes('gift-card', `Montant de carte cadeau invalide (${amountStr}). Entre ${pricing_config_1.GIFT_CARD_MIN} $ et ${pricing_config_1.GIFT_CARD_MAX} $, en dollars entiers.`);
        }
        return okRes('gift-card', amount * qty);
    }
    // --- Produits en solde (ids litteraux).
    if (pricing_config_1.SALE_ITEM_PRICES[pid] != null) {
        return okRes('sale-item', pricing_config_1.SALE_ITEM_PRICES[pid] * qty);
    }
    // --- Packs stickers boutique : <slug>-x<nPacks>. Prix par pack depuis le
    // CMS (product category sticker-pack, pricingData.tiers) sinon grille
    // par defaut. Palier exact requis.
    {
        const m = pid.match(/^((?:stk|sticker-pack)-[a-z0-9-]+?)-x(\d+)$/);
        if (m) {
            const packSlug = m[1];
            const nPacks = parseInt(m[2], 10);
            let perPack = null;
            if (deps.getProductBySlug) {
                try {
                    const product = await deps.getProductBySlug(packSlug);
                    const tiers = (_g = product === null || product === void 0 ? void 0 : product.pricingData) === null || _g === void 0 ? void 0 : _g.tiers;
                    if (Array.isArray(tiers)) {
                        const t = tiers.find((x) => Number(x === null || x === void 0 ? void 0 : x.qty) === nPacks && typeof (x === null || x === void 0 ? void 0 : x.price) === 'number');
                        if (t)
                            perPack = t.price;
                    }
                }
                catch (_) {
                    return rejectRes('sticker-pack-boutique', 'Validation du prix impossible, reessayez plus tard');
                }
            }
            if (perPack == null)
                perPack = (_h = pricing_config_1.STICKER_PACK_DEFAULT_TIERS[nPacks]) !== null && _h !== void 0 ? _h : null;
            if (perPack == null) {
                return rejectRes('sticker-pack-boutique', `Palier de packs invalide (${nPacks}). Paliers valides: 1, 5, 10, 25.`);
            }
            return okRes('sticker-pack-boutique', perPack * nPacks * qty);
        }
    }
    // --- Sublimation : palier de quantite exact, BYOT via SKU ou flag,
    // design fee optionnel valide par ENSEMBLE de prix serveur legitimes
    // (le choix "avec design" n'a pas de champ dedie dans l'item : on accepte
    // base ou base+fee, tout autre montant est force a base).
    if (pid.startsWith('sublimation-')) {
        const byotFromSku = pid.endsWith('-byot');
        const product = pid.replace(/^sublimation-/, '').replace(/-byot$/, '');
        const grid = pricing_config_1.SUBLIMATION_UNIT_PRICES[product];
        if (!grid) {
            return rejectRes('sublimation', `Produit sublimation inconnu: ${product}.`);
        }
        const unitPrice = grid[qty];
        if (unitPrice == null) {
            const paliers = Object.keys(grid).join(', ');
            return rejectRes('sublimation', `Quantite invalide pour ${product} (${qty}). Paliers valides: ${paliers}.`);
        }
        const byot = (byotFromSku || !!item.bringOwnGarment) && pricing_config_1.SUBLIMATION_BYOT_ALLOWED.includes(product);
        const blankUnit = pricing_config_1.SUBLIMATION_BLANK_COST[product] || 0;
        const base = Math.max(0, unitPrice * qty - (byot ? blankUnit * qty : 0));
        const withDesign = base + pricing_config_1.SUBLIMATION_DESIGN_FEE;
        const clientTotal = Number(item.totalPrice) || 0;
        if (Math.abs(clientTotal - withDesign) <= 0.01)
            return okRes('sublimation', withDesign);
        return okRes('sublimation', base);
    }
    // --- Merch fini : prix plat par type (merch-<type>-<color>-<size>).
    if (pid.startsWith('merch-')) {
        const type = pid.split('-')[1] || '';
        const unit = pricing_config_1.MERCH_PRICES[type];
        if (unit == null) {
            return rejectRes('merch', `Produit merch inconnu: ${type || pid}.`);
        }
        return okRes('merch', unit * qty);
    }
    // --- Hors registre : REFUS. C'est le coeur de SEC-04.
    return rejectRes('inconnu', `Produit non reconnu: ${pid}. Vide ton panier et recommence, ou ecris-nous si le probleme persiste.`);
}
exports.resolveSkuPrice = resolveSkuPrice;

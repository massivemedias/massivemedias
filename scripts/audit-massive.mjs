#!/usr/bin/env node
/**
 * audit-massive.mjs - AUDIT EN LECTURE SEULE
 *
 * Ce script ne fait QUE des requetes GET. Il ne cree, ne modifie et
 * ne supprime RIEN. Aucun risque pour tes donnees.
 *
 * Jeton : lu automatiquement depuis le fichier .env a la racine du
 * repo (variable ADMIN_API_TOKEN). Tu peux aussi passer un jeton a
 * la volee : SUPABASE_TOKEN=eyJ... node scripts/audit-massive.mjs
 *
 * Lancement :
 *   node scripts/audit-massive.mjs
 *
 * Rapporte : etat des depenses (doublons connus, total), bilan
 * annuel 2026, total de l'inventaire.
 */

import { readFileSync } from 'node:fs';

const API = 'https://massivemedias-api.onrender.com/api';
const TIMEOUT_MS = 90000;

// --- Charge .env (racine du repo) sans dependance externe ---
function loadEnv() {
  try {
    const txt = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = val;
    }
  } catch {
    /* pas de .env : on continue, le jeton peut venir de l'environnement */
  }
}

// --- GET uniquement (lecture seule, jamais de POST/PUT/DELETE) ---
async function get(path, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* pas du JSON */ }
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, json: null, error: e?.message || String(e) };
  }
}

function money(n) {
  return (Number(n) || 0).toFixed(2) + ' $';
}

// --- Donnees connues : import du 21 mai 2026 ---
const MY_27 = new Set((
  'd2mx17zf8cowmnx42xuwzr0p gmsudt5h5nxota07qyzrz156 sxugi5lzn47cxpis10yd11ob ' +
  'l7g41zntmk0wlpip15lsclux hga7tvt6yehdrmfy4z4zcqjs ssovyocwrjwjwchufg2m2g7k ' +
  'r0gedwcalikpv35aqp2dqglu esa6074g56fcyiao75rskvev fx9dpqj5f7jng7sstbb87zkh ' +
  'wnuc426y22wyvyn95jic5kup hhtsbldy2aym57cbx6v7zzh0 dvfaq1pj0hwcdbki1mv3f6m3 ' +
  'vjfqz4ibcgo5s4pbzazssn81 mda0prxjoc17tz5m1n3g1y5j yg5htn438kt32teykyde5kdo ' +
  'fw9aiuqtuhlcu1abwjqhycr4 kau69hzf634e8e1sr9iqmf3n hd62d1ecozcvuvzoy0obd1zn ' +
  'sx1qlz9iknv8o2g1kmcl3wrh c1it69lntucr6fcqhd91dqae uze0tsk125tl06mnpfuvpj17 ' +
  't1c29diahh4fhzom8d8p8331 x0cpc07oxjh6n720lli42d4h yfd21rdfmquxgonncrw2nwf5 ' +
  'stbryilhvrnmz8dgf08xkx4x akmhqwt5l5oj536hptmqmd81 z8lk49rmvmcl91qi85nkilqa'
).split(/\s+/));

// Les 10 doublons identifies (anciennes depenses, a supprimer cote admin)
const DUPS = {
  zfmd3x72m3fkf9rflky4bfev: 'A-SUB Luster 34,48 $ (17 avr)',
  qn08ac7kvml3urmdh4450b3n: 'Regle metallique 13,68 $ (18 avr)',
  gozh23o4gzstu129c0uc64do: 'Vinyl cristal A4 29,04 $ (24 avr)',
  sjh4f9dztp6l0zhzinrmqnre: 'Holo 8,5x11 39,06 $ (24 avr)',
  k0464ealqezqglsqa42w5an1: 'Holo vinyle 54,48 $ (24 avr)',
  zbsspn2rktnxkclr347s62av: 'Combine 158,49 $ (2 mai)',
  ws2dltqvlo00i016ov0bj3h8: 'Verre casse 42,03 $ (5 mai)',
  ns26wsrdsxng93xi9wcbegsw: 'Combine 114,68 $ (5 mai)',
  gcll9rzi94izz6vqe0ljiwz4: 'Arches 42,89 $ (10 mai)',
  vilbzdmd6bme1rknzs3dlf6d: 'Topaz 21 $ (18 mai)',
};

async function main() {
  loadEnv();
  const token = (process.env.ADMIN_API_TOKEN || process.env.SUPABASE_TOKEN || '').trim();

  console.log('\n=== AUDIT MASSIVE MEDIAS (lecture seule) ===');
  console.log('Date  :', new Date().toISOString().slice(0, 16).replace('T', ' '), 'UTC');
  console.log('Jeton :', token ? `present (${token.length} caracteres)` : 'ABSENT');

  // --- INVENTAIRE (endpoint public, aucun jeton requis) ---
  console.log('\n--- INVENTAIRE ---');
  const inv = await get('/inventory-items?pagination%5BpageSize%5D=1');
  if (inv.ok && inv.json?.meta?.pagination) {
    console.log('  Total items en base :', inv.json.meta.pagination.total);
  } else {
    console.log('  Lecture impossible (HTTP ' + inv.status + (inv.error ? ', ' + inv.error : '') + ')');
  }

  // --- DEPENSES + BILAN (jeton requis) ---
  if (!token) {
    console.log('\n--- DEPENSES / BILAN ANNUEL ---');
    console.log('  Saute : aucun jeton.');
    console.log('  Mets ta valeur ADMIN_API_TOKEN dans le fichier .env (racine du repo),');
    console.log('  puis relance : node scripts/audit-massive.mjs');
    console.log('');
    return;
  }

  console.log('\n--- DEPENSES ---');
  const exp = await get('/expenses/admin?pageSize=300', token);
  if (!exp.ok) {
    console.log('  Lecture impossible (HTTP ' + exp.status + (exp.error ? ', ' + exp.error : '') + ').');
    if (exp.status === 401 || exp.status === 403) {
      console.log('  -> jeton refuse. Verifie que ADMIN_API_TOKEN dans .env est');
      console.log('     identique a la valeur sur Render (et au moins 16 caracteres).');
    }
  } else {
    const rows = Array.isArray(exp.json?.data) ? exp.json.data : [];
    const ids = new Set(rows.map((r) => r?.documentId));
    const minePresent = [...MY_27].filter((id) => ids.has(id)).length;
    const dupsLeft = Object.keys(DUPS).filter((id) => ids.has(id));
    console.log('  Total depenses en base   :', exp.json?.meta?.total ?? rows.length);
    console.log('  Mes 27 (import 21 mai)   :', minePresent + '/27 presentes');
    console.log('  Doublons cibles restants :', dupsLeft.length + '/10');
    for (const id of dupsLeft) console.log('     ENCORE LA -> ' + DUPS[id]);
    if (dupsLeft.length === 0) console.log('     -> les 10 doublons sont supprimes. Propre.');
    const refund = rows.find((r) =>
      /epson/i.test(r?.description || '') &&
      /ultra premium/i.test(r?.description || '') &&
      Math.abs((Number(r?.amount) || 0) - 141.25) < 1);
    if (refund) {
      console.log('  DRAPEAU : article rembourse 141,25 $ encore present');
      console.log('     ("' + String(refund.description).slice(0, 45) + '")');
    }
  }

  console.log('\n--- BILAN ANNUEL 2026 ---');
  const sum = await get('/expenses/summary/2026', token);
  if (!sum.ok) {
    console.log('  Lecture impossible (HTTP ' + sum.status + (sum.error ? ', ' + sum.error : '') + ').');
  } else {
    const t = sum.json?.totals || {};
    const revenue = Number(t.revenue) || 0;
    const deductible = Number(t.deductible) || 0;
    console.log('  Revenus              :', money(revenue));
    console.log('  Depenses (TTC)       :', money(t.expenses));
    console.log('  Depenses deduct. HT  :', money(deductible));
    console.log('  Bilan (profit)       :', money(revenue - deductible));
    console.log('  TPS  percue / payee  :', money(t.revenueTps) + ' / ' + money(t.tps));
    console.log('  TVQ  percue / payee  :', money(t.revenueTvq) + ' / ' + money(t.tvq));
    console.log('  TPS nette a remettre :', money((Number(t.revenueTps) || 0) - (Number(t.tps) || 0)));
    console.log('  TVQ nette a remettre :', money((Number(t.revenueTvq) || 0) - (Number(t.tvq) || 0)));
    console.log('  (compare ces chiffres avec ton dashboard Bilan annuel)');
  }
  console.log('');
}

main().catch((e) => {
  console.error('\nErreur inattendue (aucune donnee modifiee) :', e?.message || e);
});

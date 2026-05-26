#!/usr/bin/env node
/**
 * cf-force-dns-puppeteer.mjs (8 mai 2026)
 * ---------------------------------------------------------------------
 * HACK : on lance Playwright avec le profil Chrome existant du user (cookies
 * CF inclus). Cloudflare n'expose ni Wrangler-CLI ni API publique pour creer
 * un wildcard DNS sans token dedie - donc on automate le clic UI dashboard.
 *
 * Le profil source (~/Library/Application Support/Google/Chrome/Default) est
 * copie dans un temp dir pour eviter le verrou exclusif de Chrome quand il
 * est deja ouvert (sinon Playwright echoue avec "ProcessSingleton failed").
 *
 * Lancement :
 *   node scripts/cf-force-dns-puppeteer.mjs
 *
 * Le browser s'ouvre en mode visible (headless: false) pour que tu voies
 * l'action en direct + reprendre la main si capcha / 2FA.
 */
import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';

const exec = promisify(execFile);

const SOURCE_PROFILE = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
const TMP_PROFILE = path.join(os.tmpdir(), 'cf-puppeteer-profile');
const ZONE_URL = 'https://dash.cloudflare.com/48c0f0149933a7f0e3a24479e33c69d3/massivemedias.com/dns/records';

async function copyProfile() {
  console.log('📁 Copie du profil Chrome vers temp dir (evite verrou)...');
  await fs.rm(TMP_PROFILE, { recursive: true, force: true });
  // rsync au lieu de cp pour exclure les fichiers locks (LOCK, SingletonLock,
  // SingletonCookie, etc.) qui declencheraient ProcessSingleton.
  await exec('rsync', [
    '-a',
    '--exclude=Singleton*',
    '--exclude=lockfile',
    '--exclude=*Lock*',
    '--exclude=Crashpad',
    '--exclude=CrashpadMetrics-active.pma',
    SOURCE_PROFILE + '/',
    TMP_PROFILE + '/',
  ]);
  console.log('✓ Profil copie');
}

async function main() {
  await copyProfile();

  console.log('🚀 Lancement Playwright avec profil Chrome existant...');
  const ctx = await chromium.launchPersistentContext(TMP_PROFILE, {
    headless: false,
    channel: 'chrome', // utilise le Chrome installe (pas Chromium)
    viewport: { width: 1400, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'], // anti-detect basique
  });

  const page = ctx.pages()[0] || await ctx.newPage();

  console.log('🌐 Navigation vers:', ZONE_URL);
  await page.goto(ZONE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('⏳ Attente du chargement complet du SPA Cloudflare (30s max)...');
  // On attend un selecteur typique de la page DNS (bouton Add record)
  try {
    await page.waitForSelector('button:has-text("Add record"), button:has-text("Ajouter")', { timeout: 30000 });
  } catch (e) {
    console.log('⚠️  Selecteur "Add record" pas trouve dans le timeout. Capture HTML pour diag...');
    const html = await page.content();
    console.log(`HTML head 1000 chars: ${html.substring(0, 1000)}`);
    console.log('\nMet la main si tu vois la page chargee, je passe au clic...');
  }

  // Clic Add record
  console.log('🖱️  Clic sur Add record...');
  await page.locator('button:has-text("Add record"), button:has-text("Ajouter")').first().click();
  await page.waitForTimeout(800);

  // Type CNAME
  console.log('  -> Type: CNAME');
  // Le select Type peut etre un combobox CF custom - on essaie 2 patterns
  await page.locator('label:has-text("Type") + * button, [aria-label*="Type"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('text=CNAME').first().click();
  await page.waitForTimeout(300);

  // Name = *
  console.log('  -> Name: *');
  await page.locator('input[name="name"], input[aria-label*="Name"]').first().fill('*');

  // Target / Content = massivemedias.com
  console.log('  -> Target: massivemedias.com');
  await page.locator('input[name="content"], input[aria-label*="Target"], input[aria-label*="content"]').first().fill('massivemedias.com');

  // Proxy = ON
  console.log('  -> Proxied: ON');
  // Le toggle proxy CF est typiquement un span/button avec aria-label
  const proxyToggle = page.locator('[aria-label*="Proxy" i], [data-testid*="proxy"]').first();
  if (await proxyToggle.count() > 0) {
    await proxyToggle.click();
    await page.waitForTimeout(300);
  }

  // Save
  console.log('💾 Save...');
  await page.locator('button:has-text("Save")').first().click();

  console.log('⏳ Attente confirmation...');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/cf-after-save.png' });
  console.log('📸 Screenshot apres save: /tmp/cf-after-save.png');

  console.log('\n🎉 Action terminee. Verification dig dans 5s...');
  await page.waitForTimeout(5000);

  await ctx.close();
}

main().catch((err) => {
  console.error('❌ Erreur:', err.message);
  console.error(err.stack);
  process.exit(1);
});

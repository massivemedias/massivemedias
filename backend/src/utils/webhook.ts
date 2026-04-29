// Webhooks Hub Massive Medias (Phase 7D)
// ---------------------------------------
// Dispatcher generique pour notifier des services d'automatisation
// externes (Zapier, Make / Integromat, n8n, IFTTT, etc.) lorsqu'un
// evenement metier se produit cote backend.
//
// Le contrat est minimaliste : un seul endpoint POST cible
// (process.env.EXTERNAL_WEBHOOK_URL) recoit TOUS les events sous la
// forme `{ event, timestamp, data }`. C'est au scenario Zapier / Make
// de filtrer par `event` pour declencher la bonne automation.
//
// Pourquoi un seul endpoint plutot que plusieurs ? Simplicite ops :
//   - Une seule URL a configurer cote Render (`EXTERNAL_WEBHOOK_URL`)
//   - Une seule URL a inscrire cote Zapier (un trigger "Catch Hook")
//   - Le routage par event-name reste flexible cote no-code
//
// SECURITE / RESILIENCE :
//   - Si EXTERNAL_WEBHOOK_URL n'est pas defini, le helper retourne
//     immediatement sans erreur (graceful exit). Aucun event n'est
//     dispatche - le projet tourne identiquement avant/apres l'ajout
//     du flag.
//   - L'appel fetch est entoure d'un try/catch global. Si Zapier est
//     down, si la requete time out, si les DNS sautent : on logue
//     un avertissement et on retourne. AUCUNE exception ne remonte
//     au controller appelant - le workflow Strapi (changement de
//     statut, creation de commande) doit rester insensible aux
//     defaillances tierces.
//   - Timeout dur de 5 secondes via AbortController pour eviter qu'un
//     Zapier lent bloque la reponse admin.

const DISPATCH_TIMEOUT_MS = 5000;

export async function dispatchWebhook(eventName: string, data: any): Promise<void> {
  const url = process.env.EXTERNAL_WEBHOOK_URL;
  if (!url || !url.trim()) {
    // Graceful exit : pas de URL configuree = feature off, on n'appelle rien.
    return;
  }

  const payload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    data,
  };

  // AbortController pour timeout dur. Sans ca, un fetch sur un Zapier
  // injoignable peut pendre jusqu'au timeout systeme (60s+).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      // 4xx / 5xx cote receveur : on logue mais on ne throw pas.
      console.error(
        `[WEBHOOK] Failed to dispatch event=${eventName} status=${res.status} ${res.statusText}`,
      );
    }
  } catch (error: any) {
    // Network error, abort timeout, DNS fail, etc. - tous absorbes ici.
    const reason = error?.name === 'AbortError'
      ? `timeout (${DISPATCH_TIMEOUT_MS}ms)`
      : (error?.message || String(error));
    console.error(`[WEBHOOK] Failed to dispatch event=${eventName} reason=${reason}`);
  } finally {
    clearTimeout(timer);
  }
}

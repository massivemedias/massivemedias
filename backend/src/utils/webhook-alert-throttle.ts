// STRIPE-03 : throttle persistant pour les emails d'alerte webhook.
// Les in-memory throttles (global.*) ne survivaient pas aux restart OOM, donc
// on passe par la DB. Une ligne par cle d'alerte, mise a jour a chaque envoi.

export async function shouldSendThrottledAlert(
  alertKey: string,
  throttleMinutes = 60,
): Promise<boolean> {
  try {
    const existing = await strapi.db
      .query('api::webhook-alert-throttle.webhook-alert-throttle')
      .findOne({ where: { alertKey } });

    const now = Date.now();
    const throttleMs = throttleMinutes * 60_000;
    const nowIso = new Date(now).toISOString();

    if (existing) {
      const lastSent = new Date(existing.lastSentAt).getTime();
      if (now - lastSent < throttleMs) {
        const secondsAgo = Math.round((now - lastSent) / 1000);
        strapi.log.info(
          `[throttle] Alert '${alertKey}' suppressed (${secondsAgo}s since last, throttle=${throttleMinutes}min, count=${existing.sendCount || 0})`,
        );
        // Incremente le compteur meme si on n'envoie pas -> on voit combien
        // de retries ont ete suppresses dans les logs / admin.
        await strapi.db
          .query('api::webhook-alert-throttle.webhook-alert-throttle')
          .update({
            where: { alertKey },
            data: { sendCount: (existing.sendCount || 0) + 1 },
          });
        return false;
      }
      // Delai ecoule -> on autorise l'envoi ET on reset le compteur.
      await strapi.db
        .query('api::webhook-alert-throttle.webhook-alert-throttle')
        .update({
          where: { alertKey },
          data: { lastSentAt: nowIso, sendCount: 1 },
        });
    } else {
      await strapi.db
        .query('api::webhook-alert-throttle.webhook-alert-throttle')
        .create({ data: { alertKey, lastSentAt: nowIso, sendCount: 1 } });
    }
    return true;
  } catch (err: any) {
    // Fail-open : si la DB echoue sur le throttle, on prefere envoyer
    // l'alerte quand meme. Une alerte dupliquee est moins grave qu'une
    // alerte manquee (incident 4j silent d'avril 2026).
    strapi.log.warn(
      `[throttle] Check failed for '${alertKey}': ${err?.message || err} - sending anyway (fail-open)`,
    );
    return true;
  }
}

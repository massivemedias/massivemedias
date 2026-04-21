// Email transactionnels Massive Medias via Resend
import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// -----------------------------------------------------------
// Template email Massive Medias unifie
// -----------------------------------------------------------
function massiveEmailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;color:#222;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header avec logo -->
        <tr><td align="center" style="padding:28px 32px 20px;border-bottom:2px solid #FF52A0;">
          <a href="https://massivemedias.com"><img src="https://massivemedias.com/images/massive-logo-email.png" alt="Massive Medias" width="280" style="width:280px;max-width:100%;height:auto;display:block;" /></a>
        </td></tr>

        <!-- Contenu principal -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:12px;color:#888;line-height:1.6;">
              <a href="https://massivemedias.com" style="color:#FF52A0;text-decoration:none;font-weight:600;">massivemedias.com</a> &nbsp;|&nbsp;
              <a href="https://instagram.com/massivemedias" style="color:#888;text-decoration:none;">@massivemedias</a> &nbsp;|&nbsp;
              <a href="mailto:massivemedias@gmail.com" style="color:#888;text-decoration:none;">massivemedias@gmail.com</a>
            </td></tr>
            <tr><td style="font-size:10px;color:#aaa;padding-top:8px;">
              Massive Medias - 5338 rue Marquette, Montreal, QC H2J 3Z3
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Adresse admin qui recoit une copie BCC de tous les emails client
 * (confirmations de commande, tracking, factures, tracking, etc.).
 * Surcharge possible via ADMIN_BCC_EMAIL pour dev/staging.
 *
 * Set a empty string pour desactiver globalement le BCC.
 */
function getAdminBcc(): string[] {
  const bcc = process.env.ADMIN_BCC_EMAIL ?? 'massivemedias@gmail.com';
  if (!bcc || !bcc.trim()) return [];
  return [bcc.trim()];
}

// Expediteur + replyTo + bcc admin par defaut pour tous les emails client.
// FIX-ERP (avril 2026) : l'admin est automatiquement en BCC sur chaque email
// transactionnel client pour etre au courant de toutes les etapes du workflow
// (creation commande, paiement, expedition, livraison, facture envoyee).
function getSender() {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  return {
    from: `Massive Medias <${fromEmail}>`,
    replyTo: 'massivemedias@gmail.com',
    bcc: getAdminBcc(),
  };
}

// -----------------------------------------------------------
// Email de confirmation de commande
// -----------------------------------------------------------
interface OrderItem {
  productName: string;
  quantity: number;
  totalPrice: number;
  size?: string;
  finish?: string;
}

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderRef: string;
  invoiceNumber?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tps: number;
  tvq: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
  } | null;
  promoCode?: string;
  promoDiscount?: number;
  supabaseUserId?: string;
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222;font-size:14px;">
        ${item.productName}${item.size ? ` - ${item.size}` : ''}${item.finish ? ` (${item.finish})` : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;color:#222;font-size:14px;">
        ${item.quantity}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;color:#222;font-size:14px;">
        ${(typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : '0.00')}$
      </td>
    </tr>
  `).join('');

  const addr = data.shippingAddress;
  const addressBlock = addr
    ? `${addr.address}<br>${addr.city}, ${addr.province} ${addr.postalCode}`
    : 'N/A';

  // Date formatee en francais - en timezone Montreal (America/Toronto) pour eviter
  // l'effet "serveur UTC" qui donnait des dates decalees de +4/+5h dans les emails.
  const dateFr = new Date().toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto'
  });

  const content = `
    <!-- Titre document -->
    <h1 style="color:#FF52A0;margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Confirmation de commande</h1>

    <h2 style="color:#222;margin:0 0 8px;font-size:16px;">Merci ${data.customerName} !</h2>
    <p style="color:#666;margin:0 0 4px;font-size:15px;line-height:1.5;">
      Votre commande a \u00e9t\u00e9 accept\u00e9e et est en cours de traitement.
    </p>
    <p style="color:#666;margin:0 0 4px;font-size:14px;">
      R\u00e9f\u00e9rence : <strong style="color:#222;font-family:monospace;background:#f0f0f0;padding:2px 8px;border-radius:4px;">${data.orderRef}</strong>
    </p>
    ${data.invoiceNumber ? `<p style="color:#666;margin:0 0 4px;font-size:14px;">
      Facture : <strong style="color:#222;font-family:monospace;background:#f0f0f0;padding:2px 8px;border-radius:4px;">${data.invoiceNumber}</strong>
    </p>` : ''}
    <p style="color:#666;margin:0 0 24px;font-size:14px;">
      Date : <strong style="color:#222;">${dateFr}</strong>
    </p>

    <!-- Adresse emettrice -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr><td style="padding:12px 16px;background:#f7f7f7;border-radius:8px;">
        <p style="margin:0;color:#222;font-weight:600;font-size:13px;">Massive Medias</p>
        <p style="margin:2px 0 0;color:#666;font-size:12px;line-height:1.4;">5338 rue Marquette, Montreal, QC H2J 3Z3<br>TPS : 732457635RT0001 | TVQ : 4012577678TQ0001 | NEQ : 2269057891</p>
      </td></tr>
    </table>

    <!-- Items table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
      <tr style="border-bottom:2px solid #FF52A0;">
        <th style="text-align:left;padding:8px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Produit</th>
        <th style="text-align:center;padding:8px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Qt\u00e9</th>
        <th style="text-align:right;padding:8px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Prix</th>
      </tr>
      ${itemRows}
    </table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:4px 12px;color:#666;font-size:14px;">Sous-total</td>
        <td style="padding:4px 12px;text-align:right;color:#222;font-size:14px;">${formatPrice(data.subtotal)}$</td>
      </tr>
      ${data.promoCode && data.promoDiscount ? '<tr><td style="padding:4px 12px;color:#4ade80;font-size:14px;">Code promo : ' + data.promoCode + '</td><td style="padding:4px 12px;text-align:right;color:#4ade80;font-size:14px;font-weight:600;">-' + formatPrice(data.promoDiscount) + '$</td></tr>' : ''}
      <tr>
        <td style="padding:4px 12px;color:#666;font-size:14px;">Livraison</td>
        <td style="padding:4px 12px;text-align:right;color:#222;font-size:14px;">${data.shipping === 0 ? 'Gratuit' : formatPrice(data.shipping) + '$'}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px;color:#666;font-size:14px;">TPS (5%) <span style="font-size:11px;color:#777;">- 732457635RT0001</span></td>
        <td style="padding:4px 12px;text-align:right;color:#222;font-size:14px;">${formatPrice(data.tps)}$</td>
      </tr>
      ${data.tvq > 0 ? `<tr>
        <td style="padding:4px 12px;color:#666;font-size:14px;">TVQ (9.975%) <span style="font-size:11px;color:#777;">- 4012577678TQ0001</span></td>
        <td style="padding:4px 12px;text-align:right;color:#222;font-size:14px;">${formatPrice(data.tvq)}$</td>
      </tr>` : ''}
      <tr>
        <td colspan="2" style="padding:8px 12px 0;">
          <div style="border-top:2px solid #FF52A0;"></div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 12px 4px;color:#222;font-size:16px;font-weight:700;">Total</td>
        <td style="padding:12px 12px 4px;text-align:right;color:#FF52A0;font-size:16px;font-weight:700;">${formatPrice(data.total)}$</td>
      </tr>
      <tr>
        <td style="padding:4px 12px;color:#666;font-size:12px;">Paiement par carte de cr\u00e9dit</td>
        <td></td>
      </tr>
    </table>

    <!-- Shipping address -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:16px;background:#f7f7f7;border-radius:8px;border:1px solid #eee;">
        <p style="margin:0 0 4px;color:#222;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Adresse de livraison</p>
        <p style="margin:0;color:#666;font-size:14px;line-height:1.5;">${addressBlock}</p>
      </td></tr>
    </table>

    <!-- Delay notice -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr><td style="padding:16px;background:rgba(255,82,160,0.06);border-radius:8px;border:1px solid rgba(255,82,160,0.15);">
        <p style="margin:0;color:#222;font-size:14px;line-height:1.6;">
          &#128666; Votre commande sera traitee dans un delai de 3 a 5 jours ouvrables.
          Vous recevrez un courriel de confirmation lors de l'expedition.
          Pour toute question : <a href="mailto:massivemedias@gmail.com" style="color:#FF52A0;text-decoration:none;">massivemedias@gmail.com</a>
        </p>
      </td></tr>
    </table>

    <!-- Invoice notice -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      <tr><td style="padding:16px;background:#f7f7f7;border-radius:8px;border:1px solid #eee;">
        <p style="margin:0;color:#222;font-size:14px;line-height:1.6;">
          ${data.supabaseUserId ? '&#128196; Votre facture est disponible dans votre compte sous <a href="https://massivemedias.com/account?tab=commandes" style="color:#FF52A0;text-decoration:none;font-weight:600;">Mes commandes</a>.' : '&#128196; Creez un compte sur <a href="https://massivemedias.com/account" style="color:#FF52A0;text-decoration:none;font-weight:600;">massivemedias.com</a> pour acceder a vos factures et suivre vos commandes.'}
        </p>
      </td></tr>
    </table>
  `;

  return massiveEmailWrapper(content);
}

// -----------------------------------------------------------
// Reponse a un message contact
// -----------------------------------------------------------
interface ContactReplyData {
  customerName: string;
  customerEmail: string;
  originalMessage: string;
  replyMessage: string;
  subject?: string;
}

function buildContactReplyHtml(data: ContactReplyData): string {
  const subject = encodeURIComponent(data.subject || 'Re: Votre demande - Massive Medias');
  const content = `
    <h2 style="color:#222;margin:0 0 8px;font-size:16px;font-weight:600;">Bonjour ${data.customerName},</h2>

    <div style="color:#333;font-size:15px;line-height:1.7;margin:16px 0 24px;white-space:pre-wrap;">${data.replyMessage}</div>

    <!-- Bouton repondre -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td>
        <a href="mailto:massivemedias@gmail.com?subject=${subject}" style="display:inline-block;background:#222;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;">Repondre</a>
      </td></tr>
    </table>

    <!-- Original message -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr><td style="padding:14px 16px;background:#f7f7f7;border-radius:6px;border-left:3px solid #FF52A0;">
        <p style="margin:0 0 6px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Votre message original</p>
        <p style="margin:0;color:#666;font-size:13px;line-height:1.5;white-space:pre-wrap;">${data.originalMessage}</p>
      </td></tr>
    </table>
  `;

  return massiveEmailWrapper(content);
}

export async function sendContactReplyEmail(data: ContactReplyData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non configure, email non envoye');
    return false;
  }

  const sender = getSender();

  try {
    const result = await resend.emails.send({
      ...sender,
      to: data.customerEmail,
      subject: data.subject || `Re: Votre demande - Massive Medias`,
      html: buildContactReplyHtml(data),
    });
    console.log('[email] Reponse contact envoyee a', data.customerEmail, result);
    return true;
  } catch (err) {
    console.error('[email] Erreur envoi reponse contact:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de demande de temoignage
// -----------------------------------------------------------
interface TestimonialRequestData {
  customerName: string;
  customerEmail: string;
  testimonialLink: string;
  orderRef?: string;
}

function buildTestimonialRequestHtml(data: TestimonialRequestData): string {
  const content = `
    <h2 style="color:#222;margin:0 0 8px;font-size:16px;">Bonjour ${data.customerName},</h2>

    <p style="color:#666;margin:16px 0;font-size:15px;line-height:1.7;">
      Merci d'avoir fait confiance \u00e0 Massive Medias${data.orderRef ? ` pour votre commande <strong style="color:#222;font-family:monospace;background:#f0f0f0;padding:2px 8px;border-radius:4px;">${data.orderRef}</strong>` : ''} !
    </p>

    <p style="color:#666;margin:16px 0;font-size:15px;line-height:1.7;">
      Votre avis est precieux pour nous. Prenez un moment pour partager votre experience - ca ne prend que 2 minutes et ca nous aide enormement.
    </p>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr><td align="center">
        <a href="${data.testimonialLink}" style="display:inline-block;background:linear-gradient(135deg,#FF52A0,#6B21A8);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,82,160,0.3);">
          Donner mon avis
        </a>
      </td></tr>
    </table>

    <p style="color:#777;margin:16px 0 0;font-size:12px;line-height:1.5;">
      Ou copiez ce lien dans votre navigateur :<br>
      <a href="${data.testimonialLink}" style="color:#FF52A0;word-break:break-all;">${data.testimonialLink}</a>
    </p>
  `;

  return massiveEmailWrapper(content);
}

export async function sendTestimonialRequestEmail(data: TestimonialRequestData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non configure, email non envoye');
    return false;
  }

  const sender = getSender();

  try {
    const result = await resend.emails.send({
      ...sender,
      to: data.customerEmail,
      subject: 'Votre avis compte - Massive Medias',
      html: buildTestimonialRequestHtml(data),
    });
    console.log('[email] Demande temoignage envoyee a', data.customerEmail, result);
    return true;
  } catch (err) {
    console.error('[email] Erreur envoi demande temoignage:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de confirmation de commande
// -----------------------------------------------------------
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non configure, email non envoye');
    return false;
  }

  const sender = getSender();

  try {
    const result = await resend.emails.send({
      ...sender,
      to: data.customerEmail,
      subject: `Confirmation de commande - ${data.orderRef}`,
      html: buildOrderConfirmationHtml(data),
    });
    console.log('[email] Confirmation envoyee a', data.customerEmail, result);
    return true;
  } catch (err) {
    console.error('[email] Erreur envoi confirmation:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de notification de signature de contrat artiste
// -----------------------------------------------------------
interface ContractEmailData {
  artistName: string;
  artistEmail: string;
  nomArtiste?: string;
  telephone: string;
  adresse: string;
  contractVersion: string;
  signedAt: string;
}

function buildContractSignedHtml(data: ContractEmailData, isForArtist: boolean): string {
  const date = new Date(data.signedAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' });
  const title = isForArtist ? 'Copie de ton contrat signe' : `Nouveau contrat signe - ${data.artistName}`;

  const content = `
    <h2 style="color:#222;margin:0 0 16px;font-size:16px;">${title}</h2>

    ${isForArtist ? `<p style="color:#666;margin:0 0 20px;font-size:15px;line-height:1.6;">
      F\u00e9licitations ! Ton contrat de partenariat artiste avec Massive Medias a \u00e9t\u00e9 sign\u00e9 avec succ\u00e8s. Voici un r\u00e9sum\u00e9 des informations enregistr\u00e9es.
    </p>` : ''}

    <!-- Infos artiste -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;width:140px;">Nom legal</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;font-weight:600;">${data.artistName}</td>
      </tr>
      ${data.nomArtiste ? `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Nom d'artiste</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#FF52A0;font-size:14px;font-weight:600;">${data.nomArtiste}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Courriel</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">${data.artistEmail}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Telephone</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">${data.telephone}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Adresse</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">${data.adresse}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Contrat</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#4ade80;font-size:14px;font-weight:700;">${data.contractVersion}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;color:#666;font-size:13px;">Date de signature</td>
        <td style="padding:10px 14px;color:#222;font-size:14px;">${date}</td>
      </tr>
    </table>

    <!-- Signatures -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="width:50%;padding:16px;background:#f7f7f7;border-radius:10px 0 0 10px;border:1px solid #eee;border-right:none;vertical-align:top;">
          <p style="margin:0 0 8px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Massive Medias</p>
          <p style="font-family:'Segoe Script','Comic Sans MS',cursive;color:#FF52A0;font-size:16px;margin:0;">Yan Morin</p>
          <p style="color:#666;font-size:11px;margin:6px 0 0;">Proprietaire - NEQ: 2269057891</p>
        </td>
        <td style="width:50%;padding:16px;background:#f7f7f7;border-radius:0 10px 10px 0;border:1px solid #eee;border-left:none;vertical-align:top;">
          <p style="margin:0 0 8px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">L'Artiste</p>
          <p style="font-family:'Segoe Script','Comic Sans MS',cursive;color:#4ade80;font-size:16px;margin:0;">${data.artistName}</p>
          <p style="color:#666;font-size:11px;margin:6px 0 0;">${date}</p>
        </td>
      </tr>
    </table>

    ${isForArtist ? `<p style="color:#666;font-size:13px;margin-top:24px;line-height:1.6;">
      Ce courriel sert de confirmation de ta signature numerique du contrat de partenariat artiste avec Massive Medias. Conserve-le pour tes dossiers.
      <br><br>Une fois ta candidature accept\u00e9e, tu pourras envoyer ton portfolio et ta bio depuis ton espace compte sur <a href="https://massivemedias.com/account" style="color:#FF52A0;text-decoration:none;">massivemedias.com</a>.
    </p>` : ''}
  `;

  return massiveEmailWrapper(content);
}

export async function sendContractSignedEmail(data: ContractEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] Resend non configure, email contrat non envoye');
    return false;
  }

  const sender = getSender();
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';

  try {
    // Copie pour l'artiste
    await resend.emails.send({
      ...sender,
      to: data.artistEmail,
      subject: `Contrat de partenariat signe - Massive Medias (${data.contractVersion})`,
      html: buildContractSignedHtml(data, true),
    });
    console.log('[email] Copie contrat envoyee a', data.artistEmail);

    // Original pour Massive
    await resend.emails.send({
      ...sender,
      to: adminEmail,
      subject: `[CONTRAT] Nouveau contrat signe - ${data.artistName}`,
      html: buildContractSignedHtml(data, false),
    });
    console.log('[email] Original contrat envoye a', adminEmail);

    return true;
  } catch (err) {
    console.error('[email] Erreur envoi contrat:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de notification de vente artiste
// -----------------------------------------------------------
interface ArtistSaleItem {
  productName: string;
  size: string;
  finish: string;
  quantity: number;
}

interface ArtistSaleNotificationData {
  artistName: string;
  artistEmail: string;
  items: ArtistSaleItem[];
  orderDate: string;
  customerCity?: string;
}

function buildArtistSaleNotificationHtml(data: ArtistSaleNotificationData): string {
  const date = new Date(data.orderDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' });
  const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222;font-size:14px;">
        ${item.productName}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#FF52A0;font-size:14px;text-align:center;font-weight:600;">
        ${item.size}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;font-size:14px;text-align:center;">
        ${item.finish}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222;font-size:14px;text-align:center;font-weight:600;">
        ${item.quantity}
      </td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color:#222;margin:0 0 8px;font-size:16px;">Nouvelle vente</h2>
    <p style="color:#666;margin:0 0 24px;font-size:15px;line-height:1.5;">
      Salut ${data.artistName}, quelqu'un vient d'acheter ${totalQty > 1 ? totalQty + ' de tes oeuvres' : 'une de tes oeuvres'} !
      ${data.customerCity ? `<br>Destination : <strong style="color:#222;">${data.customerCity}</strong>` : ''}
    </p>

    <!-- Items table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
      <tr style="border-bottom:2px solid #FF52A0;">
        <th style="text-align:left;padding:8px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Oeuvre</th>
        <th style="text-align:center;padding:8px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Format</th>
        <th style="text-align:center;padding:8px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Serie</th>
        <th style="text-align:center;padding:8px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Qte</th>
      </tr>
      ${itemRows}
    </table>

    <p style="color:#666;margin:0 0 4px;font-size:13px;">Date : ${date}</p>

    <!-- Dashboard CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr><td align="center">
        <a href="https://massivemedias.com/account" style="display:inline-block;background:linear-gradient(135deg,#FF52A0,#6B21A8);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,82,160,0.3);">
          Voir mon tableau de bord
        </a>
      </td></tr>
    </table>

    <p style="color:#666;margin:20px 0 0;font-size:12px;line-height:1.5;">
      Les details de la vente et tes commissions sont disponibles dans ton panneau artiste.
      Tu peux retirer tes gains par PayPal a tout moment.
    </p>
  `;

  return massiveEmailWrapper(content);
}

export async function sendArtistSaleNotificationEmail(data: ArtistSaleNotificationData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] Resend non configure, notification vente artiste non envoyee');
    return false;
  }

  const sender = getSender();

  try {
    await resend.emails.send({
      ...sender,
      to: data.artistEmail,
      subject: `Nouvelle vente ! ${data.items.length > 1 ? data.items.length + ' oeuvres vendues' : '1 oeuvre vendue'}`,
      html: buildArtistSaleNotificationHtml(data),
    });
    console.log('[email] Notification vente artiste envoyee a', data.artistEmail);
    return true;
  } catch (err) {
    console.error('[email] Erreur notification vente artiste:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de notification de nouvelle commande (vers admin)
// -----------------------------------------------------------
interface NewOrderNotificationData {
  orderRef: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tps: number;
  tvq: number;
  total: number;
  shippingAddress: { address: string; city: string; province: string; postalCode: string } | null;
  uploadedFiles?: { name: string; url: string }[];
  notes?: string;
  designReady?: boolean;
  promoCode?: string;
  promoDiscount?: number;
}

function buildNewOrderNotificationHtml(data: NewOrderNotificationData): string {
  const date = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' });
  const itemCount = data.items.reduce((s, i) => s + i.quantity, 0);

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;font-size:13px;">
        ${item.productName}${item.size ? ` - ${item.size}` : ''}${item.finish ? ` (${item.finish})` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#222;font-size:13px;">
        ${item.quantity}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#222;font-size:13px;">
        ${(typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : '0.00')}$
      </td>
    </tr>
  `).join('');

  const addr = data.shippingAddress;
  const addressBlock = addr ? `${addr.city}, ${addr.province} ${addr.postalCode}` : 'N/A';

  const content = `
    <h2 style="color:#222;margin:0 0 8px;font-size:16px;">Nouvelle vente</h2>
    <p style="color:#666;margin:0 0 20px;font-size:15px;line-height:1.5;">
      ${itemCount} article${itemCount > 1 ? 's' : ''} commande${itemCount > 1 ? 's' : ''} par <strong style="color:#222;">${data.customerName}</strong>
    </p>

    <!-- Client info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;width:100px;">Client</td>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;font-weight:600;">${data.customerName}</td>
      </tr>
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Courriel</td>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">${data.customerEmail}</td>
      </tr>
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Destination</td>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">${addressBlock}</td>
      </tr>
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Reference</td>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#FF52A0;font-size:14px;font-weight:700;font-family:monospace;">${data.orderRef}</td>
      </tr>
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Date</td>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">${date}</td>
      </tr>
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Design pret</td>
        <td style="padding:8px 14px;border-bottom:1px solid #eee;color:${data.designReady ? '#4ade80' : '#f59e0b'};font-size:14px;font-weight:600;">${data.designReady ? 'Oui' : 'Non - design a faire'}</td>
      </tr>
      ${data.notes ? '<tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Notes client</td><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">' + data.notes + '</td></tr>' : ''}
    </table>

    ${data.uploadedFiles && data.uploadedFiles.length > 0 ? '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="padding:16px;background:#f7f7f7;border-radius:8px;border:1px solid #eee;"><p style="margin:0 0 8px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Fichiers envoyes par le client</p>' + data.uploadedFiles.map((f: { name: string; url: string }) => '<p style="margin:4px 0;"><a href="' + f.url + '" style="color:#FF52A0;text-decoration:none;font-size:14px;">&#128206; ' + f.name + '</a></p>').join('') + '</td></tr></table>' : ''}

    <!-- Items table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
      <tr style="border-bottom:2px solid #FF52A0;">
        <th style="text-align:left;padding:8px 12px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Produit</th>
        <th style="text-align:center;padding:8px 12px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Qte</th>
        <th style="text-align:right;padding:8px 12px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Prix</th>
      </tr>
      ${itemRows}
    </table>

    <!-- Total -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:4px 12px;color:#666;font-size:13px;">Sous-total</td>
        <td style="padding:4px 12px;text-align:right;color:#222;font-size:13px;">${formatPrice(data.subtotal)}$</td>
      </tr>
      ${data.promoCode && data.promoDiscount ? '<tr><td style="padding:4px 12px;color:#4ade80;font-size:13px;">Code promo : ' + data.promoCode + '</td><td style="padding:4px 12px;text-align:right;color:#4ade80;font-size:13px;font-weight:600;">-' + formatPrice(data.promoDiscount) + '$</td></tr>' : ''}
      <tr>
        <td style="padding:4px 12px;color:#666;font-size:13px;">Livraison</td>
        <td style="padding:4px 12px;text-align:right;color:#222;font-size:13px;">${data.shipping === 0 ? 'Gratuit' : formatPrice(data.shipping) + '$'}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px;color:#666;font-size:13px;">TPS</td>
        <td style="padding:4px 12px;text-align:right;color:#222;font-size:13px;">${formatPrice(data.tps)}$</td>
      </tr>
      ${data.tvq > 0 ? '<tr><td style="padding:4px 12px;color:#666;font-size:13px;">TVQ</td><td style="padding:4px 12px;text-align:right;color:#222;font-size:13px;">' + formatPrice(data.tvq) + '$</td></tr>' : ''}
      <tr>
        <td colspan="2" style="padding:6px 12px 0;"><div style="border-top:2px solid #FF52A0;"></div></td>
      </tr>
      <tr>
        <td style="padding:10px 12px 4px;color:#222;font-size:16px;font-weight:700;">Total</td>
        <td style="padding:10px 12px 4px;text-align:right;color:#4ade80;font-size:16px;font-weight:900;">${formatPrice(data.total)}$</td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr><td align="center">
        <a href="https://massivemedias.com/account?tab=commandes" style="display:inline-block;color:#FF52A0;text-decoration:none;font-size:13px;font-weight:600;">
          Voir ma commande &rarr;
        </a>
      </td></tr>
    </table>
  `;

  return massiveEmailWrapper(content);
}

export async function sendNewOrderNotificationEmail(data: NewOrderNotificationData): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const sender = getSender();
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';

  try {
    await resend.emails.send({
      ...sender,
      to: adminEmail,
      subject: `[VENTE] ${formatPrice(data.total)}$ - ${data.customerName} (${data.orderRef})`,
      html: buildNewOrderNotificationHtml(data),
    });
    console.log('[email] Notification nouvelle vente envoyee a', adminEmail);
    return true;
  } catch (err) {
    console.error('[email] Erreur notification vente admin:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de suivi de colis (vers client)
// -----------------------------------------------------------
interface TrackingEmailData {
  customerName: string;
  customerEmail: string;
  orderRef: string;
  trackingNumber: string;
  carrier: string;
}

function buildTrackingEmailHtml(data: TrackingEmailData): string {
  const trackingUrl = data.carrier === 'postes-canada'
    ? `https://www.canadapost-postescanada.ca/track-reperage/fr#/search?searchFor=${data.trackingNumber}`
    : data.carrier === 'purolator'
    ? `https://www.purolator.com/en/shipping/tracker?pin=${data.trackingNumber}`
    : data.carrier === 'ups'
    ? `https://www.ups.com/track?tracknum=${data.trackingNumber}`
    : `https://www.canadapost-postescanada.ca/track-reperage/fr#/search?searchFor=${data.trackingNumber}`;

  const carrierName = data.carrier === 'postes-canada' ? 'Postes Canada'
    : data.carrier === 'purolator' ? 'Purolator'
    : data.carrier === 'ups' ? 'UPS'
    : 'Postes Canada';

  const deliveryEstimate = data.carrier === 'postes-canada' ? '3-7 jours ouvrables'
    : data.carrier === 'purolator' ? '1-3 jours ouvrables'
    : data.carrier === 'ups' ? '2-5 jours ouvrables'
    : '5-10 jours ouvrables';

  const content = `
    <h2 style="color:#222;margin:0 0 8px;font-size:16px;">Votre colis est en route</h2>
    <p style="color:#666;margin:0 0 24px;font-size:15px;line-height:1.5;">
      Bonjour ${data.customerName}, votre commande <strong style="color:#222;font-family:monospace;background:#f0f0f0;padding:2px 8px;border-radius:4px;">${data.orderRef}</strong> a \u00e9t\u00e9 exp\u00e9di\u00e9e.
    </p>

    <!-- Tracking info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:20px;background:#f7f7f7;border-radius:12px;border:1px solid #eee;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#666;font-size:13px;">Transporteur</td>
            <td style="padding:8px 0;text-align:right;color:#222;font-size:14px;font-weight:600;">${carrierName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;font-size:13px;">Numero de suivi</td>
            <td style="padding:8px 0;text-align:right;color:#FF52A0;font-size:14px;font-weight:700;font-family:monospace;">${data.trackingNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;font-size:13px;">Delai estime</td>
            <td style="padding:8px 0;text-align:right;color:#222;font-size:14px;font-weight:600;">${deliveryEstimate}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td align="center">
        <a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF52A0,#6B21A8);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,82,160,0.3);">
          Suivre mon colis
        </a>
      </td></tr>
    </table>

    <p style="color:#666;margin:0;font-size:12px;line-height:1.5;">
      Ou copiez ce lien dans votre navigateur :<br>
      <a href="${trackingUrl}" style="color:#FF52A0;word-break:break-all;">${trackingUrl}</a>
    </p>
  `;

  return massiveEmailWrapper(content);
}

export async function sendTrackingEmail(data: TrackingEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] Resend non configure, email suivi non envoye');
    return false;
  }

  const sender = getSender();

  try {
    await resend.emails.send({
      ...sender,
      to: data.customerEmail,
      subject: `Votre colis est en route ! - ${data.orderRef}`,
      html: buildTrackingEmailHtml(data),
    });
    console.log('[email] Email suivi envoye a', data.customerEmail);
    return true;
  } catch (err) {
    console.error('[email] Erreur envoi email suivi:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de notification de nouveau message contact (vers admin)
// -----------------------------------------------------------
interface NewContactData {
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  service?: string;
  budget?: string;
  urgence?: string;
  message: string;
}

function buildNewContactNotificationHtml(data: NewContactData): string {
  const date = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' });

  const detailRows = [
    { label: 'Nom', value: data.nom },
    { label: 'Courriel', value: data.email },
    data.telephone ? { label: 'Telephone', value: data.telephone } : null,
    data.entreprise ? { label: 'Entreprise', value: data.entreprise } : null,
    data.service ? { label: 'Service', value: data.service } : null,
    data.budget ? { label: 'Budget', value: data.budget } : null,
    data.urgence ? { label: 'Urgence', value: data.urgence } : null,
    { label: 'Date', value: date },
  ].filter(Boolean);

  const rows = detailRows.map(r => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;width:100px;">${r!.label}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;font-weight:600;">${r!.value}</td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color:#222;margin:0 0 16px;font-size:16px;">Nouveau message de contact</h2>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${rows}
    </table>

    <!-- Message -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:16px;background:#f7f7f7;border-radius:8px;border:1px solid #eee;border-left:3px solid #FF52A0;">
        <p style="margin:0 0 6px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <p style="margin:0;color:#222;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.message}</p>
      </td></tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr><td align="center">
        <a href="https://massivemedias.com/account" style="display:inline-block;color:#FF52A0;text-decoration:none;font-size:13px;font-weight:600;">
          Repondre dans le panneau admin
        </a>
      </td></tr>
    </table>
  `;

  return massiveEmailWrapper(content);
}

export async function sendNewContactNotificationEmail(data: NewContactData): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const sender = getSender();
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';

  try {
    await resend.emails.send({
      ...sender,
      to: adminEmail,
      subject: `[MESSAGE] ${data.nom} - ${data.service || 'Contact'}`,
      html: buildNewContactNotificationHtml(data),
    });
    console.log('[email] Notification contact envoyee pour', data.email);
    return true;
  } catch (err) {
    console.error('[email] Erreur notification contact:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Alerte critique: echec signature webhook Stripe (envoyee max 1x/10min)
// -----------------------------------------------------------
export async function sendWebhookFailureAlert(info: {
  reason: string;
  requestId: string;
  sigHeader?: string;
  bodyPresent?: boolean;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.error('[email] sendWebhookFailureAlert: Resend not configured');
    return false;
  }
  const sender = getSender();
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:20px;background:#1a0030;color:#fff;">
      <h1 style="color:#ff3366;margin:0 0 12px;">🚨 WEBHOOK STRIPE EN ECHEC</h1>
      <p style="color:#ffb3c6;font-size:14px;margin:0 0 20px;">
        La verification de signature du webhook Stripe a echoue. Cela signifie qu'une ou plusieurs
        commandes ne vont PAS etre marquees comme payees automatiquement. Action requise.
      </p>
      <table style="width:100%;background:#2a0050;padding:16px;border-radius:8px;font-size:13px;">
        <tr><td style="padding:4px 0;color:#aaa;">Request ID:</td><td style="padding:4px 0;font-family:monospace;">${info.requestId}</td></tr>
        <tr><td style="padding:4px 0;color:#aaa;">Raison:</td><td style="padding:4px 0;color:#ff8fa3;">${escapeHtml(info.reason)}</td></tr>
        ${info.sigHeader ? `<tr><td style="padding:4px 0;color:#aaa;">Header sig (debut):</td><td style="padding:4px 0;font-family:monospace;font-size:11px;word-break:break-all;">${escapeHtml(info.sigHeader)}...</td></tr>` : ''}
        ${typeof info.bodyPresent === 'boolean' ? `<tr><td style="padding:4px 0;color:#aaa;">Body present:</td><td style="padding:4px 0;">${info.bodyPresent ? 'Oui' : 'NON'}</td></tr>` : ''}
        <tr><td style="padding:4px 0;color:#aaa;">Timestamp:</td><td style="padding:4px 0;">${new Date().toISOString()}</td></tr>
      </table>
      <div style="margin-top:20px;padding:12px;background:#ffe0e8;color:#660022;border-radius:6px;font-size:13px;">
        <strong>Causes probables:</strong><br/>
        1. STRIPE_WEBHOOK_SECRET sur Render ne correspond plus au secret actuel de l'endpoint Stripe.<br/>
        2. Rotation de cle sur Stripe non repliquee sur Render.<br/>
        3. Changement d'endpoint Stripe sans update du secret.<br/><br/>
        <strong>Action:</strong> aller sur Stripe Dashboard > Webhooks > endpoint > "Clé secrète de signature" et comparer avec STRIPE_WEBHOOK_SECRET sur Render.
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      ...sender,
      to: adminEmail,
      subject: `🚨 [ALERTE CRITIQUE] Webhook Stripe signature failed - ${info.requestId}`,
      html,
    });
    console.log(`[email] Webhook failure alert sent for request ${info.requestId}`);
    return true;
  } catch (err) {
    console.error('[email] Failed to send webhook failure alert:', err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

// -----------------------------------------------------------
// BACKUP-02 : alerte Google Drive OAuth casse (refresh token expire/revoke)
// -----------------------------------------------------------
export async function sendDriveFailureAlert(info: {
  reason: string;
  context?: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.error('[email] sendDriveFailureAlert: Resend not configured');
    return false;
  }
  const sender = getSender();
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:20px;background:#2a1500;color:#fff;">
      <h1 style="color:#ffb347;margin:0 0 12px;">Google Drive OAuth en echec</h1>
      <p style="color:#ffdfb8;font-size:14px;margin:0 0 20px;">
        L'acces Google Drive ne fonctionne plus. Tous les uploads artistes (originaux TIF, photos flash, etc) sont bloques jusqu'a regeneration du refresh token.
      </p>
      <table style="width:100%;background:#3a2510;padding:16px;border-radius:8px;font-size:13px;">
        <tr><td style="padding:4px 0;color:#aaa;">Raison:</td><td style="padding:4px 0;color:#ffcc88;">${escapeHtml(info.reason)}</td></tr>
        ${info.context ? `<tr><td style="padding:4px 0;color:#aaa;">Contexte:</td><td style="padding:4px 0;font-family:monospace;font-size:11px;">${escapeHtml(info.context)}</td></tr>` : ''}
        <tr><td style="padding:4px 0;color:#aaa;">Timestamp:</td><td style="padding:4px 0;">${new Date().toISOString()}</td></tr>
      </table>
      <div style="margin-top:20px;padding:12px;background:#ffe8d0;color:#5a3a00;border-radius:6px;font-size:13px;">
        <strong>Causes probables:</strong><br/>
        1. Refresh token revoke manuellement sur Google Account (security.google.com).<br/>
        2. Refresh token expire (6 mois d'inactivite).<br/>
        3. Changement de mot de passe du compte mauditemachine@gmail.com.<br/>
        4. Client secret rotate cote Google Cloud Console.<br/><br/>
        <strong>Procedure de regeneration:</strong><br/>
        Executer <code>node backend/scripts/get-drive-token.js</code> et suivre l'URL d'autorisation. Copier le nouveau GOOGLE_DRIVE_REFRESH_TOKEN dans les env Render.
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      ...sender,
      to: adminEmail,
      subject: 'ALERTE : Google Drive OAuth failed - uploads artistes bloques',
      html,
    });
    console.log('[email] Drive failure alert sent');
    return true;
  } catch (err) {
    console.error('[email] Failed to send drive failure alert:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de notification de nouvelle inscription
// -----------------------------------------------------------
export async function sendNewUserNotificationEmail(userName: string, userEmail: string, provider: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const sender = getSender();
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';
  const date = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' });

  const content = `
    <h2 style="color:#222;margin:0 0 16px;font-size:16px;">Nouvelle inscription</h2>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;width:100px;">Nom</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:15px;font-weight:600;">${userName || 'Sans nom'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Courriel</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:15px;">${userEmail}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Methode</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#FF52A0;font-size:14px;font-weight:600;">${provider}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;color:#666;font-size:13px;">Date</td>
        <td style="padding:10px 14px;color:#222;font-size:14px;">${date}</td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr><td align="center">
        <a href="https://massivemedias.com/mm-admin" style="display:inline-block;color:#FF52A0;text-decoration:none;font-size:13px;font-weight:600;">
          Voir dans le panneau admin
        </a>
      </td></tr>
    </table>
  `;

  try {
    await resend.emails.send({
      ...sender,
      to: adminEmail,
      subject: `[INSCRIPTION] ${userName || userEmail}`,
      html: massiveEmailWrapper(content),
    });
    console.log('[email] Notification inscription envoyee pour', userEmail);
    return true;
  } catch (err) {
    console.error('[email] Erreur notification inscription:', err);
    return false;
  }
}


// -----------------------------------------------------------
// Email piece privee artiste -> client
// -----------------------------------------------------------
interface PrivatePrintData {
  clientEmail: string;
  artistName: string;
  printTitle: string;
  printImage: string;
  buyLink: string;
  price: number | null;
}

function buildPrivatePrintHtml(data: PrivatePrintData): string {
  const priceText = data.price ? `${data.price}$` : '';
  return massiveEmailWrapper(`
    <h1 style="color:#F00098;font-size:24px;margin:0 0 16px">Une oeuvre vous attend</h1>
    <p style="color:#ccc;font-size:15px;line-height:1.6">
      <strong>${data.artistName}</strong> a prepare une oeuvre exclusive pour vous:
    </p>
    <h2 style="color:#fff;font-size:16px;margin:16px 0 8px">${data.printTitle}</h2>
    ${data.printImage ? `<img src="${data.printImage}" alt="${data.printTitle}" style="max-width:100%;border-radius:8px;margin:16px 0" />` : ''}
    ${priceText ? `<p style="color:#F00098;font-size:16px;font-weight:bold;margin:8px 0">${priceText}</p>` : ''}
    <p style="color:#999;font-size:13px;margin:16px 0">
      Cette oeuvre est reservee exclusivement pour vous. Cliquez sur le bouton ci-dessous pour la voir et l'acheter.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${data.buyLink}" style="display:inline-block;background:#F00098;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">
        Voir et acheter
      </a>
    </div>
    <p style="color:#666;font-size:11px;margin-top:24px">
      Vous devrez vous connecter avec l'adresse ${data.clientEmail} pour acceder a cette oeuvre.
    </p>
  `);
}

function buildPrivatePrintAdminHtml(data: PrivatePrintData): string {
  const priceText = data.price ? `${data.price}$` : 'Non fixe';
  return massiveEmailWrapper(`
    <h2 style="color:#222;margin:0 0 16px;font-size:16px;">Nouvelle vente privee artiste</h2>
    <p style="color:#666;font-size:13px;margin:0 0 16px">
      Un artiste a cree une vente privee. Le client vient de recevoir le lien d'achat.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;width:110px;">Artiste</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:15px;font-weight:600;">${data.artistName}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Client</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">
          <a href="mailto:${data.clientEmail}" style="color:#FF52A0;text-decoration:none;">${data.clientEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Oeuvre</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;">${data.printTitle}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Prix fixe</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;font-weight:600;">${priceText}</td>
      </tr>
    </table>
    ${data.printImage ? `<div style="text-align:center;margin:20px 0"><img src="${data.printImage}" alt="${data.printTitle}" style="max-width:100%;border-radius:8px;border:1px solid #eee" /></div>` : ''}
    <p style="color:#666;font-size:13px;margin:20px 0 8px">
      <strong>Prochaines etapes :</strong>
    </p>
    <ul style="color:#666;font-size:13px;margin:0 0 20px;padding-left:20px;line-height:1.7">
      <li>Le client voit l'oeuvre avec le format, qualite et cadre fixes par l'artiste (non modifiables)</li>
      <li>Il paie directement via Stripe au prix fixe</li>
      <li>Tu recois la notification de commande et tu executes selon la configuration deja etablie</li>
    </ul>
    <div style="text-align:center;margin:20px 0">
      <a href="${data.buyLink}" style="display:inline-block;background:#222;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
        Voir le lien client
      </a>
      <a href="https://massivemedias.com/account" style="display:inline-block;background:#FF52A0;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-left:8px">
        Panneau admin
      </a>
    </div>
  `);
}

// Version texte plain (obligatoire pour reduire le risque de spam)
function buildPrivatePrintText(data: PrivatePrintData): string {
  const priceText = data.price ? `Prix: ${data.price}$\n` : '';
  return `Bonjour,

${data.artistName} a prepare une oeuvre exclusive pour vous sur Massive Medias.

Titre: ${data.printTitle}
${priceText}
Pour voir l'oeuvre et proceder a l'achat, cliquez sur le lien ci-dessous:
${data.buyLink}

Cette oeuvre est reservee pour votre adresse ${data.clientEmail}.

Si vous n'avez pas demande cette oeuvre, vous pouvez ignorer ce courriel.

Massive Medias
https://massivemedias.com
Pour toute question: massivemedias@gmail.com
`;
}

export async function sendPrivatePrintEmail(data: PrivatePrintData): Promise<boolean> {
  const resend = getResend();
  if (!resend) { console.warn('[email] Resend non configure'); return false; }
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';
  let clientOk = false;
  let adminOk = false;

  // 1. Email au client — anti-spam: reply_to vers massivemedias@gmail.com,
  //    version texte + HTML, sujet naturel, headers List-Unsubscribe
  try {
    await resend.emails.send({
      from: 'Massive Medias <noreply@massivemedias.com>',
      to: data.clientEmail,
      bcc: getAdminBcc(),
      reply_to: adminEmail,
      subject: `${data.artistName} vous a envoye une oeuvre`,
      html: buildPrivatePrintHtml(data),
      text: buildPrivatePrintText(data),
      headers: {
        'List-Unsubscribe': `<mailto:${adminEmail}?subject=Desabonnement>`,
        'X-Entity-Ref-ID': `private-${Date.now()}`,
      },
    } as any);
    console.log('[email] Email piece privee envoye a', data.clientEmail);
    clientOk = true;
  } catch (err) {
    console.error('[email] Erreur email piece privee client:', err);
  }

  // 2. Notification admin (separe, avec details internes)
  try {
    await resend.emails.send({
      from: 'Massive Medias <noreply@massivemedias.com>',
      to: adminEmail,
      reply_to: adminEmail,
      subject: `[VENTE PRIVEE] ${data.artistName} -> ${data.clientEmail}`,
      html: buildPrivatePrintAdminHtml(data),
    } as any);
    console.log('[email] Notification admin vente privee envoyee a', adminEmail);
    adminOk = true;
  } catch (err) {
    console.error('[email] Erreur notification admin vente privee:', err);
  }

  return clientOk || adminOk;
}

// -----------------------------------------------------------
// Facture manuelle avec lien Stripe + PDF attache
// -----------------------------------------------------------
interface ManualInvoiceEmailData {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  orderId: string;
  subtotal: number;       // en dollars
  tps: number;            // en dollars
  tvq: number;            // en dollars
  shipping?: number;      // en dollars
  total: number;          // en dollars
  currency?: string;
  paymentUrl: string;     // lien Stripe payment link
  pdfBase64?: string;     // PDF en base64 (sans le prefix data:application/pdf;base64,)
  pdfFilename?: string;
}

function fmt(n: number | undefined | null): string {
  const v = typeof n === 'number' && !isNaN(n) ? n : 0;
  return v.toFixed(2);
}

function buildManualInvoiceHtml(data: ManualInvoiceEmailData): string {
  const cur = (data.currency || 'CAD').toUpperCase();
  const shippingRow = data.shipping && data.shipping > 0
    ? `<tr><td style="padding:8px 12px;color:#666;font-size:13px;">Livraison</td><td style="padding:8px 12px;text-align:right;color:#222;font-size:13px;">${fmt(data.shipping)} ${cur}</td></tr>`
    : '';

  const content = `
    <h1 style="color:#222;font-size:22px;font-weight:700;margin:0 0 8px;">Facture ${data.invoiceNumber}</h1>
    <p style="color:#666;font-size:14px;margin:0 0 20px;">Bonjour ${data.customerName || 'client'},</p>
    <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Merci pour votre commande. Vous trouverez ci-dessous le detail de votre facture Massive Medias.
      Pour regler en ligne de maniere securisee (carte de credit, Apple Pay, Google Pay), cliquez sur le bouton ci-dessous.
    </p>

    <!-- Tableau recap -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:6px;border:1px solid #eee;margin:0 0 24px;">
      <tr><td style="padding:8px 12px;color:#666;font-size:13px;">Sous-total</td><td style="padding:8px 12px;text-align:right;color:#222;font-size:13px;">${fmt(data.subtotal)} ${cur}</td></tr>
      ${shippingRow}
      <tr><td style="padding:8px 12px;color:#666;font-size:13px;">TPS (5%)</td><td style="padding:8px 12px;text-align:right;color:#222;font-size:13px;">${fmt(data.tps)} ${cur}</td></tr>
      <tr><td style="padding:8px 12px;color:#666;font-size:13px;border-bottom:1px solid #eee;">TVQ (9.975%)</td><td style="padding:8px 12px;text-align:right;color:#222;font-size:13px;border-bottom:1px solid #eee;">${fmt(data.tvq)} ${cur}</td></tr>
      <tr><td style="padding:14px 12px;color:#222;font-size:15px;font-weight:700;">Total</td><td style="padding:14px 12px;text-align:right;color:#FF0098;font-size:18px;font-weight:700;">${fmt(data.total)} ${cur}</td></tr>
    </table>

    <!-- CTA Stripe -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td align="center">
        <a href="${data.paymentUrl}" style="display:inline-block;background:#FF0098;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          Payer ma facture en ligne
        </a>
      </td></tr>
    </table>

    <p style="color:#888;font-size:12px;line-height:1.6;margin:0 0 8px;text-align:center;">
      Paiement securise via Stripe. Vous recevrez un recu automatique par courriel apres le paiement.
    </p>
    <p style="color:#888;font-size:12px;line-height:1.6;margin:0;text-align:center;">
      Le PDF de votre facture est attache a ce courriel pour vos archives.
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="color:#666;font-size:13px;line-height:1.6;margin:0;">
      Pour toute question, repondez simplement a ce courriel ou ecrivez-nous a
      <a href="mailto:massivemedias@gmail.com" style="color:#FF0098;">massivemedias@gmail.com</a>.
    </p>
  `;
  return massiveEmailWrapper(content);
}

/**
 * Envoie une facture manuelle par courriel au client avec :
 * - Tableau recapitulatif (sous-total, TPS, TVQ, total)
 * - Bouton lien de paiement Stripe
 * - PDF attache (si pdfBase64 fourni)
 *
 * Retourne true en cas de succes, throw Error explicite en cas d'echec.
 * Ne mange AUCUNE erreur silencieusement (le caller doit savoir si ca a marche).
 */
export async function sendInvoiceEmail(data: ManualInvoiceEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    throw new Error('RESEND_API_KEY non configure sur le serveur');
  }
  if (!data.customerEmail) {
    throw new Error('customerEmail requis');
  }
  if (!data.paymentUrl) {
    throw new Error('paymentUrl Stripe requis');
  }
  if (!data.invoiceNumber) {
    throw new Error('invoiceNumber requis');
  }

  const { from, replyTo } = getSender();
  // FIX-ERP : sujet explicite pour l'admin qui recoit le BCC
  //   "Facture pour la commande #MM-2026-0001 - Jean Tremblay"
  const subject = `Facture pour la commande #${data.invoiceNumber} - ${data.customerName || 'Client'}`;
  const bcc = getAdminBcc();

  const attachments: any[] = [];
  if (data.pdfBase64) {
    attachments.push({
      filename: data.pdfFilename || `facture-${data.invoiceNumber}.pdf`,
      content: data.pdfBase64, // Resend accepte base64 string
    });
  }

  try {
    const res = await resend.emails.send({
      from,
      to: data.customerEmail,
      bcc: bcc.length > 0 ? bcc : undefined,  // BCC explicite admin (sur TOUTES les factures)
      reply_to: replyTo,
      subject,
      html: buildManualInvoiceHtml(data),
      attachments: attachments.length > 0 ? attachments : undefined,
    } as any);
    console.log(`[email] Facture ${data.invoiceNumber} envoyee a ${data.customerEmail} (bcc: ${bcc.join(', ') || 'none'})`, res?.data?.id || '');
    return true;
  } catch (err: any) {
    console.error('[email] Erreur envoi facture:', err?.message || err);
    // Relancer avec un message clair plutot qu'un boolean false silencieux.
    throw new Error(err?.message || 'Echec envoi courriel (Resend)');
  }
}

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

// Expediteur et replyTo constants
function getSender() {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  return {
    from: `Massive Medias <${fromEmail}>`,
    replyTo: 'massivemedias@gmail.com',
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

  // Date formatee en francais
  const now = new Date();
  const moisFr = ['janvier', 'f\u00e9vrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'ao\u00fbt', 'septembre', 'octobre', 'novembre', 'd\u00e9cembre'];
  const dateFr = `${now.getDate()} ${moisFr[now.getMonth()]} ${now.getFullYear()}`;

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
  const content = `
    <h2 style="color:#222;margin:0 0 8px;font-size:16px;font-weight:600;">Bonjour ${data.customerName},</h2>

    <div style="color:#333;font-size:15px;line-height:1.7;margin:16px 0 24px;white-space:pre-wrap;">${data.replyMessage}</div>

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
  const date = new Date(data.signedAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
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
  const date = new Date(data.orderDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
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
  const date = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const date = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
// Email de notification de nouvelle inscription
// -----------------------------------------------------------
export async function sendNewUserNotificationEmail(userName: string, userEmail: string, provider: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const sender = getSender();
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';
  const date = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
// Email de notification de reservation tattoo (vers tatoueur)
// -----------------------------------------------------------
interface ReservationNotificationData {
  tatoueurName: string;
  tatoueurEmail: string;
  clientName: string;
  clientEmail: string;
  flashTitle: string;
  messageDuClient?: string;
  requestedDate?: string;
  placement?: string;
  size?: string;
  budget?: string;
}

function buildReservationNotificationHtml(data: ReservationNotificationData): string {
  const detailRows = [
    { label: 'Client', value: data.clientName },
    { label: 'Courriel', value: data.clientEmail },
    { label: 'Flash', value: data.flashTitle },
    data.placement ? { label: 'Placement', value: data.placement } : null,
    data.size ? { label: 'Taille', value: data.size } : null,
    data.requestedDate ? { label: 'Date souhaitee', value: new Date(data.requestedDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) } : null,
    data.budget ? { label: 'Budget', value: data.budget } : null,
  ].filter(Boolean);

  const rows = detailRows.map(r => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;font-size:13px;width:120px;">${r!.label}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #eee;color:#222;font-size:14px;font-weight:600;">${r!.value}</td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color:#222;margin:0 0 16px;font-size:16px;">Nouvelle reservation</h2>
    <p style="color:#666;margin:0 0 20px;font-size:15px;line-height:1.5;">
      Salut ${data.tatoueurName}, <strong style="color:#222;">${data.clientName}</strong> veut reserver ton flash <strong style="color:#FF52A0;">${data.flashTitle}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${rows}
    </table>

    ${data.messageDuClient ? `
    <!-- Message du client -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:16px;background:#f7f7f7;border-radius:8px;border:1px solid #eee;border-left:3px solid #FF52A0;">
        <p style="margin:0 0 6px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Message du client</p>
        <p style="margin:0;color:#222;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.messageDuClient}</p>
      </td></tr>
    </table>
    ` : ''}

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr><td align="center">
        <a href="https://massivemedias.com/tatoueur/dashboard?tab=reservations" style="display:inline-block;background:linear-gradient(135deg,#FF52A0,#6B21A8);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,82,160,0.3);">
          Voir dans mon dashboard
        </a>
      </td></tr>
    </table>
  `;

  return massiveEmailWrapper(content);
}

export async function sendReservationNotificationEmail(data: ReservationNotificationData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] Resend non configure, notification reservation non envoyee');
    return false;
  }

  const sender = getSender();

  try {
    await resend.emails.send({
      ...sender,
      to: data.tatoueurEmail,
      subject: `[RESERVATION] ${data.clientName} veut reserver - ${data.flashTitle}`,
      html: buildReservationNotificationHtml(data),
    });
    console.log('[email] Notification reservation envoyee a', data.tatoueurEmail);
    return true;
  } catch (err) {
    console.error('[email] Erreur notification reservation:', err);
    return false;
  }
}

// -----------------------------------------------------------
// Email de notification de message tattoo (vers tatoueur ou client)
// -----------------------------------------------------------
interface TattooMessageEmailData {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  senderType: 'client' | 'tatoueur' | 'admin';
  messageContent: string;
  flashTitle?: string;
  dashboardUrl: string;
  ctaLabel: string;
}

function buildTattooMessageHtml(data: TattooMessageEmailData): string {
  const content = `
    <h2 style="color:#222;margin:0 0 16px;font-size:16px;">Nouveau message</h2>
    <p style="color:#666;margin:0 0 20px;font-size:15px;line-height:1.5;">
      <strong style="color:#222;">${data.senderName}</strong> t'a envoye un message${data.flashTitle ? ` concernant le flash <strong style="color:#FF52A0;">${data.flashTitle}</strong>` : ''}.
    </p>

    <!-- Message -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:16px;background:#f7f7f7;border-radius:8px;border:1px solid #eee;border-left:3px solid #FF52A0;">
        <p style="margin:0 0 6px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <p style="margin:0;color:#222;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.messageContent}</p>
      </td></tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr><td align="center">
        <a href="${data.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF52A0,#6B21A8);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,82,160,0.3);">
          ${data.ctaLabel}
        </a>
      </td></tr>
    </table>
  `;

  return massiveEmailWrapper(content);
}

export async function sendTattooMessageEmail(data: TattooMessageEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] Resend non configure, notification message tattoo non envoyee');
    return false;
  }

  const sender = getSender();

  try {
    await resend.emails.send({
      ...sender,
      to: data.recipientEmail,
      subject: `[MESSAGE] Nouveau message de ${data.senderName}`,
      html: buildTattooMessageHtml(data),
    });
    console.log('[email] Notification message tattoo envoyee a', data.recipientEmail);
    return true;
  } catch (err) {
    console.error('[email] Erreur notification message tattoo:', err);
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

export async function sendPrivatePrintEmail(data: PrivatePrintData): Promise<boolean> {
  const resend = getResend();
  if (!resend) { console.warn('[email] Resend non configure'); return false; }
  try {
    await resend.emails.send({
      from: 'Massive Medias <noreply@massivemedias.com>',
      to: data.clientEmail,
      subject: `${data.artistName} a prepare une oeuvre pour vous - Massive Medias`,
      html: buildPrivatePrintHtml(data),
    });
    console.log('[email] Email piece privee envoye a', data.clientEmail);
    return true;
  } catch (err) {
    console.error('[email] Erreur email piece privee:', err);
    return false;
  }
}

// Email de confirmation de commande via Resend
import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

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
  items: OrderItem[];
  subtotal: number;  // cents
  shipping: number;  // cents
  tps: number;       // cents
  tvq: number;       // cents
  total: number;     // cents
  shippingAddress: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
  } | null;
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e4e4f0;font-size:14px;">
        ${item.productName}${item.size ? ` - ${item.size}` : ''}${item.finish ? ` (${item.finish})` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;text-align:center;color:#e4e4f0;font-size:14px;">
        ${item.quantity}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;text-align:right;color:#e4e4f0;font-size:14px;">
        ${(typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : '0.00')}$
      </td>
    </tr>
  `).join('');

  const addr = data.shippingAddress;
  const addressBlock = addr
    ? `${addr.address}<br>${addr.city}, ${addr.province} ${addr.postalCode}`
    : 'N/A';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f23;color:#e4e4f0;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f23;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td align="center" style="padding:0 0 32px;">
          <h1 style="color:#FF52A0;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MASSIVE MEDIAS</h1>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#16162a;border-radius:12px;padding:32px;border:1px solid rgba(139,92,246,0.25);">

          <h2 style="color:#e4e4f0;margin:0 0 8px;font-size:22px;">Merci ${data.customerName} !</h2>
          <p style="color:#a0a0b8;margin:0 0 24px;font-size:15px;line-height:1.5;">
            Votre commande a ete acceptee et est en cours de traitement.<br>
            Reference : <strong style="color:#e4e4f0;font-family:monospace;background:#1e1e3a;padding:2px 8px;border-radius:4px;">${data.orderRef}</strong>
          </p>

          <!-- Items table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
            <tr style="border-bottom:2px solid #FF52A0;">
              <th style="text-align:left;padding:8px 12px;color:#a0a0b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Produit</th>
              <th style="text-align:center;padding:8px 12px;color:#a0a0b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Qte</th>
              <th style="text-align:right;padding:8px 12px;color:#a0a0b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Prix</th>
            </tr>
            ${itemRows}
          </table>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:4px 12px;color:#a0a0b8;font-size:14px;">Sous-total</td>
              <td style="padding:4px 12px;text-align:right;color:#e4e4f0;font-size:14px;">${formatPrice(data.subtotal)}$</td>
            </tr>
            <tr>
              <td style="padding:4px 12px;color:#a0a0b8;font-size:14px;">Livraison</td>
              <td style="padding:4px 12px;text-align:right;color:#e4e4f0;font-size:14px;">${data.shipping === 0 ? 'Gratuit' : formatPrice(data.shipping) + '$'}</td>
            </tr>
            <tr>
              <td style="padding:4px 12px;color:#a0a0b8;font-size:14px;">TPS (5%) <span style="font-size:11px;color:#777;">- 732457635RT0001</span></td>
              <td style="padding:4px 12px;text-align:right;color:#e4e4f0;font-size:14px;">${formatPrice(data.tps)}$</td>
            </tr>
            ${data.tvq > 0 ? `<tr>
              <td style="padding:4px 12px;color:#a0a0b8;font-size:14px;">TVQ (9.975%) <span style="font-size:11px;color:#777;">- 4012577678TQ0001</span></td>
              <td style="padding:4px 12px;text-align:right;color:#e4e4f0;font-size:14px;">${formatPrice(data.tvq)}$</td>
            </tr>` : ''}
            <tr>
              <td colspan="2" style="padding:8px 12px 0;">
                <div style="border-top:2px solid #FF52A0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 12px 4px;color:#e4e4f0;font-size:16px;font-weight:700;">Total</td>
              <td style="padding:12px 12px 4px;text-align:right;color:#FF52A0;font-size:20px;font-weight:700;">${formatPrice(data.total)}$</td>
            </tr>
          </table>

          <!-- Shipping address -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:16px;background:rgba(139,92,246,0.08);border-radius:8px;border:1px solid rgba(139,92,246,0.15);">
              <p style="margin:0 0 4px;color:#e4e4f0;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Adresse de livraison</p>
              <p style="margin:0;color:#a0a0b8;font-size:14px;line-height:1.5;">${addressBlock}</p>
            </td></tr>
          </table>

          <!-- Delay notice -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr><td style="padding:16px;background:rgba(255,82,160,0.06);border-radius:8px;border:1px solid rgba(255,82,160,0.15);">
              <p style="margin:0;color:#e4e4f0;font-size:14px;line-height:1.6;">
                &#128666; Veuillez noter qu'un delai de traitement est necessaire avant l'expedition de votre commande.
                Nous vous contacterons si nous avons besoin d'informations supplementaires.
              </p>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:32px 0 0;">
          <p style="color:#555;font-size:12px;margin:0;">
            Massive Medias - <a href="https://massivemedias.com" style="color:#FF52A0;text-decoration:none;">massivemedias.com</a>
          </p>
          <p style="color:#444;font-size:10px;margin:6px 0 0;">
            NEQ: 2269057891 | TPS: 732457635RT0001 | TVQ: 4012577678TQ0001
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Reponse a un message contact
interface ContactReplyData {
  customerName: string;
  customerEmail: string;
  originalMessage: string;
  replyMessage: string;
  subject?: string;
}

function buildContactReplyHtml(data: ContactReplyData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f23;color:#e4e4f0;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f23;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td align="center" style="padding:0 0 32px;">
          <h1 style="color:#FF52A0;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MASSIVE MEDIAS</h1>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#16162a;border-radius:12px;padding:32px;border:1px solid rgba(139,92,246,0.25);">

          <h2 style="color:#e4e4f0;margin:0 0 8px;font-size:22px;">Bonjour ${data.customerName},</h2>

          <div style="color:#e4e4f0;font-size:15px;line-height:1.7;margin:16px 0 24px;white-space:pre-wrap;">${data.replyMessage}</div>

          <!-- Original message -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            <tr><td style="padding:16px;background:rgba(139,92,246,0.08);border-radius:8px;border:1px solid rgba(139,92,246,0.15);border-left:3px solid #FF52A0;">
              <p style="margin:0 0 6px;color:#a0a0b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Votre message original</p>
              <p style="margin:0;color:#a0a0b8;font-size:13px;line-height:1.5;white-space:pre-wrap;">${data.originalMessage}</p>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:32px 0 0;">
          <p style="color:#555;font-size:12px;margin:0;">
            Massive Medias - <a href="https://massivemedias.com" style="color:#FF52A0;text-decoration:none;">massivemedias.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendContactReplyEmail(data: ContactReplyData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non configure, email non envoye');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const result = await resend.emails.send({
      from: `Massive Medias <${fromEmail}>`,
      to: data.customerEmail,
      replyTo: 'massivemedias@gmail.com',
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

// Email de demande de temoignage
interface TestimonialRequestData {
  customerName: string;
  customerEmail: string;
  testimonialLink: string;
  orderRef?: string;
}

function buildTestimonialRequestHtml(data: TestimonialRequestData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f23;color:#e4e4f0;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f23;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td align="center" style="padding:0 0 32px;">
          <h1 style="color:#FF52A0;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MASSIVE MEDIAS</h1>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#16162a;border-radius:12px;padding:32px;border:1px solid rgba(139,92,246,0.25);">

          <h2 style="color:#e4e4f0;margin:0 0 8px;font-size:22px;">Bonjour ${data.customerName},</h2>

          <p style="color:#a0a0b8;margin:16px 0;font-size:15px;line-height:1.7;">
            Merci d'avoir fait confiance a Massive Medias${data.orderRef ? ` pour votre commande <strong style="color:#e4e4f0;font-family:monospace;background:#1e1e3a;padding:2px 8px;border-radius:4px;">${data.orderRef}</strong>` : ''} !
          </p>

          <p style="color:#a0a0b8;margin:16px 0;font-size:15px;line-height:1.7;">
            Votre avis est precieux pour nous. Prenez un moment pour partager votre experience - ca ne prend que 2 minutes et ca nous aide enormement.
          </p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td align="center">
              <a href="${data.testimonialLink}" style="display:inline-block;background:#FF52A0;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                Donner mon avis
              </a>
            </td></tr>
          </table>

          <p style="color:#777;margin:16px 0 0;font-size:12px;line-height:1.5;">
            Ou copiez ce lien dans votre navigateur :<br>
            <a href="${data.testimonialLink}" style="color:#FF52A0;word-break:break-all;">${data.testimonialLink}</a>
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:32px 0 0;">
          <p style="color:#555;font-size:12px;margin:0;">
            Massive Medias - <a href="https://massivemedias.com" style="color:#FF52A0;text-decoration:none;">massivemedias.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendTestimonialRequestEmail(data: TestimonialRequestData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non configure, email non envoye');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const result = await resend.emails.send({
      from: `Massive Medias <${fromEmail}>`,
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

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non configure, email non envoye');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const result = await resend.emails.send({
      from: `Massive Medias <${fromEmail}>`,
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

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f23;color:#e0e0e0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#3D0079,#6B21A8);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;font-size:24px;color:#fff;">${title}</h1>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px 0;color:#999;width:140px;">Nom legal</td><td style="padding:8px 0;color:#fff;font-weight:600;">${data.artistName}</td></tr>
          ${data.nomArtiste ? `<tr><td style="padding:8px 0;color:#999;">Nom d'artiste</td><td style="padding:8px 0;color:#c084fc;font-weight:600;">${data.nomArtiste}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#999;">Courriel</td><td style="padding:8px 0;color:#fff;">${data.artistEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#999;">Telephone</td><td style="padding:8px 0;color:#fff;">${data.telephone}</td></tr>
          <tr><td style="padding:8px 0;color:#999;">Adresse</td><td style="padding:8px 0;color:#fff;">${data.adresse}</td></tr>
          <tr><td style="padding:8px 0;color:#999;">Contrat</td><td style="padding:8px 0;color:#4ade80;font-weight:600;">${data.contractVersion}</td></tr>
          <tr><td style="padding:8px 0;color:#999;">Date de signature</td><td style="padding:8px 0;color:#fff;">${date}</td></tr>
        </table>
        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;margin-top:20px;">
          <p style="color:#999;font-size:12px;margin:0 0 8px;">Signature numerique - Massive Medias</p>
          <p style="color:#fff;font-size:14px;margin:0;">Yan Morin, Proprietaire</p>
          <p style="color:#999;font-size:12px;margin:4px 0 0;">NEQ: 2269057891</p>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;margin-top:20px;">
          <p style="color:#999;font-size:12px;margin:0 0 8px;">Signature numerique - L'Artiste</p>
          <p style="font-family:'Segoe Script','Comic Sans MS',cursive;color:#4ade80;font-size:28px;margin:0;">${data.artistName}</p>
          <p style="color:#999;font-size:12px;margin:4px 0 0;">${date}</p>
        </div>
        ${isForArtist ? '<p style="color:#999;font-size:13px;margin-top:24px;">Ce courriel sert de confirmation de ta signature numerique du contrat de partenariat artiste avec Massive Medias. Conserve-le pour tes dossiers.</p>' : ''}
      </div>
      <div style="background:rgba(255,255,255,0.03);padding:16px 24px;text-align:center;">
        <p style="margin:0;color:#666;font-size:12px;">Massive Medias - massivemedias.com</p>
      </div>
    </div>
  `;
}

export async function sendContractSignedEmail(data: ContractEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] Resend non configure, email contrat non envoye');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';

  try {
    // Copie pour l'artiste
    await resend.emails.send({
      from: `Massive Medias <${fromEmail}>`,
      to: data.artistEmail,
      subject: `Contrat de partenariat signe - Massive Medias (${data.contractVersion})`,
      html: buildContractSignedHtml(data, true),
    });
    console.log('[email] Copie contrat envoyee a', data.artistEmail);

    // Original pour Massive
    await resend.emails.send({
      from: `Massive Medias <${fromEmail}>`,
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

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;color:#e4e4f0;font-size:14px;">
        ${item.productName}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;color:#c084fc;font-size:14px;text-align:center;">
        ${item.size}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;color:#a0a0b8;font-size:14px;text-align:center;">
        ${item.finish}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;color:#e4e4f0;font-size:14px;text-align:center;font-weight:600;">
        ${item.quantity}
      </td>
    </tr>
  `).join('');

  const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f23;color:#e4e4f0;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f23;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td align="center" style="padding:0 0 32px;">
          <h1 style="color:#FF52A0;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MASSIVE MEDIAS</h1>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#16162a;border-radius:12px;padding:32px;border:1px solid rgba(139,92,246,0.25);">

          <h2 style="color:#e4e4f0;margin:0 0 8px;font-size:22px;">&#127881; Nouvelle vente !</h2>
          <p style="color:#a0a0b8;margin:0 0 24px;font-size:15px;line-height:1.5;">
            Salut ${data.artistName}, quelqu'un vient d'acheter ${totalQty > 1 ? totalQty + ' de tes oeuvres' : 'une de tes oeuvres'} !
            ${data.customerCity ? `<br>Destination : <strong style="color:#e4e4f0;">${data.customerCity}</strong>` : ''}
          </p>

          <!-- Items table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
            <tr style="border-bottom:2px solid #FF52A0;">
              <th style="text-align:left;padding:8px 12px;color:#a0a0b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Oeuvre</th>
              <th style="text-align:center;padding:8px 12px;color:#a0a0b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Format</th>
              <th style="text-align:center;padding:8px 12px;color:#a0a0b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Serie</th>
              <th style="text-align:center;padding:8px 12px;color:#a0a0b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Qte</th>
            </tr>
            ${itemRows}
          </table>

          <p style="color:#a0a0b8;margin:0 0 4px;font-size:13px;">Date : ${date}</p>

          <!-- Dashboard CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
            <tr><td align="center">
              <a href="https://massivemedias.com/account" style="display:inline-block;background:#FF52A0;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                Voir mon tableau de bord
              </a>
            </td></tr>
          </table>

          <p style="color:#666;margin:20px 0 0;font-size:12px;line-height:1.5;">
            Les details de la vente et tes commissions sont disponibles dans ton panneau artiste.
            Tu peux retirer tes gains par PayPal a tout moment.
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:32px 0 0;">
          <p style="color:#555;font-size:12px;margin:0;">
            Massive Medias - <a href="https://massivemedias.com" style="color:#FF52A0;text-decoration:none;">massivemedias.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendArtistSaleNotificationEmail(data: ArtistSaleNotificationData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] Resend non configure, notification vente artiste non envoyee');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    await resend.emails.send({
      from: `Massive Medias <${fromEmail}>`,
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
// Email de notification de nouvelle inscription
// -----------------------------------------------------------
export async function sendNewUserNotificationEmail(userName: string, userEmail: string, provider: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';
  const date = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  try {
    await resend.emails.send({
      from: `Massive Medias <${fromEmail}>`,
      to: adminEmail,
      subject: `[INSCRIPTION] ${userName || userEmail}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:0 auto;background:#0f0f23;color:#e0e0e0;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#3D0079,#6B21A8);padding:24px;text-align:center;">
            <h1 style="margin:0;font-size:20px;color:#fff;">Nouvelle inscription</h1>
          </div>
          <div style="padding:24px;">
            <p style="color:#fff;font-size:16px;font-weight:600;margin:0 0 8px;">${userName || 'Sans nom'}</p>
            <p style="color:#999;font-size:14px;margin:0 0 4px;">${userEmail}</p>
            <p style="color:#666;font-size:12px;margin:0 0 4px;">Methode: ${provider}</p>
            <p style="color:#666;font-size:12px;margin:0;">${date}</p>
          </div>
        </div>
      `,
    });
    console.log('[email] Notification inscription envoyee pour', userEmail);
    return true;
  } catch (err) {
    console.error('[email] Erreur notification inscription:', err);
    return false;
  }
}

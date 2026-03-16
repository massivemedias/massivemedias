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

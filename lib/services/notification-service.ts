/**
 * Service de notifications (Telegram + Email)
 * Envoie des notifications aux admins et clients aux étapes clés du workflow
 */

import type { ClientRequest } from '@/lib/types/marketplace';

// Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// Telegram
// ============================================================================

/**
 * Envoie un message via Telegram Bot API
 * Non-bloquant : les erreurs ne sont pas propagées
 */
export async function sendTelegramMessage(message: string, chatId?: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[Notifications] Telegram not configured, skipping');
    return false;
  }

  const targetChatId = chatId || TELEGRAM_CHAT_ID;
  if (!targetChatId) {
    console.log('[Notifications] No Telegram chat ID configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Notifications] Telegram error:', error);
      return false;
    }

    console.log('[Notifications] Telegram message sent');
    return true;
  } catch (error) {
    console.error('[Notifications] Telegram send failed:', error);
    return false;
  }
}

// ============================================================================
// Event Notifications
// ============================================================================

/**
 * Notifie l'admin d'une nouvelle soumission de requête client
 */
export async function notifyRequestSubmitted(request: ClientRequest): Promise<void> {
  const itemCount = request.items?.length || 0;
  const message = `🆕 <b>Nouvelle requête client</b>

👤 ${request.client_name || 'Client inconnu'}
📧 ${request.client_email || 'N/A'}
📦 ${itemCount} article(s)
🔗 <a href="${APP_URL}/admin/client-requests/${request.id}">Voir dans l'admin</a>
📋 Référence: ${request.request_number}`;

  await sendTelegramMessage(message);
}

/**
 * Notifie l'admin que la recherche marketplace est terminée
 */
export async function notifySearchComplete(
  request: ClientRequest,
  resultCount: number
): Promise<void> {
  const message = `🔍 <b>Recherche terminée</b>

📋 ${request.request_number} - ${request.client_name || 'Client'}
📊 ${resultCount} résultat(s) trouvé(s)
🔗 <a href="${APP_URL}/admin/client-requests/${request.id}">Voir les résultats</a>`;

  await sendTelegramMessage(message);
}

/**
 * Notifie l'admin qu'un client a examiné la proposition
 */
export async function notifyClientReviewed(
  request: ClientRequest,
  selectedCount: number
): Promise<void> {
  const message = `✅ <b>Proposition examinée par le client</b>

📋 ${request.request_number} - ${request.client_name || 'Client'}
✔️ ${selectedCount} article(s) sélectionné(s)
🔗 <a href="${APP_URL}/admin/client-requests/${request.id}">Voir la sélection</a>`;

  await sendTelegramMessage(message);
}

/**
 * Notifie le client que sa proposition est prête (via email si configuré)
 */
export async function notifyProposalReady(request: ClientRequest): Promise<void> {
  // Telegram notification to admin
  const adminMessage = `📨 <b>Proposition envoyée</b>

📋 ${request.request_number} - ${request.client_name || 'Client'}
🔗 Lien client: ${APP_URL}/client-request/${request.public_uuid}/proposal`;

  await sendTelegramMessage(adminMessage);

  // TODO: Email notification to client via Resend
  // if (request.client_email) {
  //   await sendEmail(request.client_email, 'Votre proposition est prête', ...);
  // }
}

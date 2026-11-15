import "server-only";
import { prisma } from "./db";
import { normalizePhone } from "./catalog";

/**
 * Stores a WhatsApp message in the outbox and tries to send it through the WhatsApp Cloud API.
 * Without WHATSAPP_TOKEN / WHATSAPP_PHONE_ID the message is kept with status "skipped".
 *
 * NOTE for production: Meta only allows free-form text inside a 24h customer-service window.
 * Business-initiated messages (confirmations, reminders) must use pre-approved templates —
 * replace the `text` payload below with a `template` payload once templates are approved.
 */
export async function notify(input: {
  businessId: string;
  bookingId?: string;
  to: string;
  kind: string;
  body: string;
}) {
  const to = normalizePhone(input.to);
  const n = await prisma.notification.create({
    data: { businessId: input.businessId, bookingId: input.bookingId, to, kind: input.kind, body: input.body },
  });

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    await prisma.notification.update({
      where: { id: n.id },
      data: { status: "skipped", error: "WhatsApp API is not configured" },
    });
    if (process.env.NODE_ENV !== "production") console.info(`[whatsapp:skipped] to ${to}: ${input.body}`);
    return;
  }

  try {
    const version = process.env.WHATSAPP_API_VERSION || "v21.0";
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: input.body } }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    await prisma.notification.update({ where: { id: n.id }, data: { status: "sent", sentAt: new Date() } });
  } catch (e) {
    await prisma.notification.update({
      where: { id: n.id },
      data: { status: "failed", error: String(e).slice(0, 500) },
    });
  }
}

// Real alerts to Steve: SMS via Twilio + email via SendGrid (Twilio's email product).
// Zero dependencies — plain HTTP. No-ops safely if the creds aren't set yet, so the
// app never breaks; it just doesn't send until the env vars below are filled in.
//
// Required env (in .env.local) to actually send:
//   SMS   -> TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (+1...), ALERT_SMS_TO (+1...)
//   EMAIL -> SENDGRID_API_KEY, ALERT_EMAIL_FROM (a verified sender), ALERT_EMAIL_TO

const T_SID = process.env.TWILIO_ACCOUNT_SID || "";
const T_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const T_FROM = process.env.TWILIO_FROM || "";
const SMS_TO = process.env.ALERT_SMS_TO || "";
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const SG_KEY = process.env.SENDGRID_API_KEY || "";
const MAIL_FROM = process.env.ALERT_EMAIL_FROM || "onboarding@resend.dev";
const MAIL_TO = process.env.ALERT_EMAIL_TO || "";

async function sendSMS(body) {
  if (!(T_SID && T_TOKEN && T_FROM && SMS_TO)) return "sms:skipped(no-creds)";
  try {
    const params = new URLSearchParams({ From: T_FROM, To: SMS_TO, Body: String(body).slice(0, 600) });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${T_SID}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${T_SID}:${T_TOKEN}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: params, signal: AbortSignal.timeout(8000),
    });
    return res.ok ? "sms:sent" : "sms:err" + res.status;
  } catch (e) { return "sms:err"; }
}

async function sendEmail(subject, text) {
  if (!MAIL_TO) return "email:skipped(no-to)";
  // Prefer Resend (simplest), fall back to SendGrid — whichever key is present.
  try {
    if (RESEND_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ from: MAIL_FROM, to: [MAIL_TO], subject, text }),
        signal: AbortSignal.timeout(8000),
      });
      return res.ok ? "email:sent(resend)" : "email:err" + res.status;
    }
    if (SG_KEY) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: "Bearer " + SG_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ personalizations: [{ to: [{ email: MAIL_TO }] }], from: { email: MAIL_FROM }, subject, content: [{ type: "text/plain", value: text }] }),
        signal: AbortSignal.timeout(8000),
      });
      return res.ok ? "email:sent(sendgrid)" : "email:err" + res.status;
    }
    return "email:skipped(no-key)";
  } catch (e) { return "email:err"; }
}

// Fire SMS + email in parallel. Never throws. Returns a small status array.
async function notify(subject, body) {
  return Promise.all([sendSMS(`${subject}: ${body}`), sendEmail(subject, body)]);
}

module.exports = { notify, configured: !!((T_SID && T_TOKEN && T_FROM && SMS_TO) || (SG_KEY && MAIL_FROM && MAIL_TO)) };

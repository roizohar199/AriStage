import { transporter } from "../../integrations/mail/transporter";

export async function sendContactMessage({
  full_name,
  email,
  phone,
  subject,
  message,
}) {
  await transporter.sendMail({
    from: email,
    to: "support@ari-stage.com",
    subject: `פנייה חדשה: ${subject}`,
    html: `
        <h2>פנייה חדשה ממערכת Ari-Stage</h2>
        <p><b>שם:</b> ${full_name}</p>
        <p><b>אימייל:</b> ${email}</p>
        <p><b>טלפון:</b> ${phone}</p>
        <p><b>נושא:</b> ${subject}</p>
        <p><b>תוכן:</b></p>
        <p>${message}</p>
      `,
  });
}

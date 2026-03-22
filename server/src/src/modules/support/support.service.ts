import { transporter } from "../../integrations/mail/transporter";
import {
  buildSupportContactEmail,
  type ServerLocale,
} from "../../i18n/serverI18n";

export async function sendContactMessage(
  {
    full_name,
    email,
    phone,
    subject,
    message,
  }: {
    full_name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    message?: string;
  },
  locale: ServerLocale = "he-IL",
) {
  const mail = buildSupportContactEmail(locale, {
    full_name,
    email,
    phone,
    subject,
    message,
  });

  await transporter.sendMail({
    from: email,
    to: "support@ari-stage.com",
    subject: mail.subject,
    html: mail.html,
  });
}

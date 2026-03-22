import { useState, type FormEvent } from "react";
import api from "@/modules/shared/lib/api.js";
import { Input, Textarea, Field } from "./FormControls";
import { useTranslation } from "@/hooks/useTranslation.ts";

type ContactUser = {
  full_name?: string | null;
  email?: string | null;
};

interface ContactFormProps {
  user: ContactUser;
}

export default function ContactForm({ user }: ContactFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    subject: "",
    message: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/support/contact", {
        full_name: user.full_name,
        email: user.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
      });

      setSuccess(t("contact.successMessage"));
      setForm({ subject: "", message: "", phone: "" });
    } catch (err: unknown) {
      console.error(err);
      setError(t("contact.errorMessage"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t("contact.subjectLabel")} required>
        <Input
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder={t("contact.subjectPlaceholder")}
          required
        />
      </Field>

      <Field label={t("contact.messageLabel")} required>
        <Textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder={t("contact.messagePlaceholder")}
          required
          rows={4}
        />
      </Field>

      <Field label={t("contact.phoneLabel")} required>
        <Input
          type="tel"
          dir="ltr"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder={t("contact.phonePlaceholder")}
          required
        />
      </Field>

      {/* סטטוסים */}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-primary hover:bg-brand-primaryLight text-neutral-100 font-semibold py-2 rounded-lg transition shadow-innerIos hover:shadow-[0_0_12px_rgba(255,136,0,0.4)]"
      >
        {loading ? t("contact.sending") : t("contact.sendButton")}
      </button>
    </form>
  );
}

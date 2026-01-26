import React, { useState } from "react";
import api from "@/modules/shared/lib/api.js";
import { Input, Textarea, Field } from "./FormControls";

export default function ContactForm({ user }) {
  const [form, setForm] = useState({
    subject: "",
    message: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
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

      setSuccess("ההודעה נשלחה בהצלחה! נחזור אליך בהקדם.");
      setForm({ subject: "", message: "", phone: "" });
    } catch (err) {
      console.error(err);
      setError("שגיאה בשליחת ההודעה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="נושא ההודעה" required>
        <Input
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="מה הנושא?"
          required
        />
      </Field>

      <Field label="תוכן ההודעה" required>
        <Textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="איך אפשר לעזור?"
          required
          rows={4}
        />
      </Field>

      <Field label="טלפון לחזרה" required>
        <Input
          type="tel"
          dir="ltr"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="050-0000000"
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
        {loading ? "שולח..." : "שלח הודעה"}
      </button>
    </form>
  );
}

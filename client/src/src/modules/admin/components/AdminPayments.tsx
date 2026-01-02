import { useEffect, useState } from "react";
import api from "@/modules/shared/lib/api.ts";

export type AdminPaymentRow = {
  id: number;
  full_name?: string | null;
  email?: string | null;
  plan?: string;
  amount?: number;
  status?: string;
  created_at?: string;
};

function formatPaymentDate(raw?: string | null): string {
  if (!raw) return "—";
  try {
    const trimmed = String(raw).trim();
    if (!trimmed) return "—";

    const normalized = trimmed.includes("T")
      ? trimmed
      : trimmed.replace(" ", "T");

    const d = new Date(normalized);
    const ms = d.getTime();
    if (Number.isNaN(ms)) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "—";
  }
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get("/admin/payments", {
          skipErrorToast: true,
        } as any);
        if (!isMounted) return;
        setPayments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Admin loadPayments failed", err);
        setError("שגיאה בטעינת תשלומים");
        setPayments([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
        טוען תשלומים...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-800 rounded-2xl p-6 text-center">
        <p className="text-neutral-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="bg-neutral-800 rounded-2xl p-6 text-center">
        <p className="text-neutral-400 text-sm">אין תשלומים להצגה</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-2xl p-4 overflow-x-auto">
      <table className="min-w-full text-sm text-right">
        <thead>
          <tr className="border-b border-neutral-700 text-neutral-300">
            <th className="px-3 py-2 font-semibold">משתמש</th>
            <th className="px-3 py-2 font-semibold">אימייל</th>
            <th className="px-3 py-2 font-semibold">סכום (ILS)</th>
            <th className="px-3 py-2 font-semibold">מסלול</th>
            <th className="px-3 py-2 font-semibold">סטטוס</th>
            <th className="px-3 py-2 font-semibold">תאריך</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr
              key={p.id}
              className="border-b border-neutral-800 last:border-0"
            >
              <td className="px-3 py-2 whitespace-nowrap text-white">
                {p.full_name || "—"}
              </td>
              <td
                className="px-3 py-2 whitespace-nowrap text-neutral-300"
                dir="ltr"
              >
                {p.email || "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-neutral-100">
                {typeof p.amount === "number" ? p.amount : "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-neutral-200">
                {p.plan || "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-neutral-200">
                {p.status || "—"}
              </td>
              <td
                className="px-3 py-2 whitespace-nowrap text-neutral-400"
                dir="ltr"
              >
                {formatPaymentDate(p.created_at ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

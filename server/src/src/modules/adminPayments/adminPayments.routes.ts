import { Router } from "express";
import { listPaymentsWithUsers } from "../payments/payments.repository.js";

const router = Router();

// Read-only admin payments listing: GET /api/admin/payments
router.get("/", async (_req, res) => {
  try {
    const rows = await listPaymentsWithUsers();

    const payload = rows.map((row) => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      plan: row.plan,
      amount: row.amount,
      status: row.status,
      created_at: row.created_at
        ? new Date(row.created_at).toISOString()
        : null,
    }));

    res.json(payload);
  } catch (err) {
    // Minimal error handling to avoid affecting other routes
    console.error("[admin] /payments failed", err);
    res.status(500).json({ error: "Failed to load payments" });
  }
});

export const adminPaymentsRouter = router;

import { Router } from "express";
import { requireAuth, requireRoles } from "../src/middleware/auth.js";
import { listPaymentsWithUsers } from "../src/modules/payments/payments.repository.js";
import { adminUsersRouter } from "../src/modules/adminUsers/adminUsers.routes.js";
import { adminSubscriptionsRouter } from "../src/modules/adminSubscriptions/adminSubscriptions.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "admin route healthy" });
});

// Admin payments listing: GET /api/admin/payments
router.get(
  "/payments",
  requireAuth,
  requireRoles(["admin"]),
  async (_req, res) => {
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
  }
);

router.use("/users", requireAuth, requireRoles(["admin"]), adminUsersRouter);
router.use(
  "/subscriptions",
  requireAuth,
  requireRoles(["admin"]),
  adminSubscriptionsRouter
);

export default router;

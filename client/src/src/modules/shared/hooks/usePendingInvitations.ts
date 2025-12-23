import { useEffect, useMemo, useState } from "react";
import api from "@/modules/shared/lib/api.js";
import { io, Socket } from "socket.io-client";

export function usePendingInvitations(userId?: number | null) {
  const [pendingCount, setPendingCount] = useState(0);

  const socket = useMemo<Socket | null>(() => {
    if (!userId) return null;

    const url = import.meta.env.VITE_API_URL;
    if (!url) {
      console.error("VITE_API_URL is not defined");
      return null;
    }

    const socketInstance = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketInstance.on("connect_error", () => {
      // silent; reconnection handles recoveries
    });

    return socketInstance;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadPendingInvitations = async () => {
      try {
        const { data } = await api.get("/users/pending-invitation", {
          skipErrorToast: true,
        });
        const count = Array.isArray(data) ? data.length : 0;
        setPendingCount(count);
      } catch {
        setPendingCount(0);
      }
    };

    loadPendingInvitations();

    if (!socket) return;

    const setupSocket = () => {
      if (socket.connected) {
        socket.emit("join-user", userId);
      } else {
        socket.once("connect", () => {
          socket.emit("join-user", userId);
        });
      }
    };

    setupSocket();

    socket.on("invitation:pending", loadPendingInvitations);
    socket.on("user:invitation-accepted", loadPendingInvitations);
    socket.on("user:invitation-rejected", loadPendingInvitations);

    const handlePendingUpdate = () => {
      loadPendingInvitations();
    };
    window.addEventListener("pending-invitations-updated", handlePendingUpdate);

    const interval = setInterval(loadPendingInvitations, 30000);

    return () => {
      socket.off("invitation:pending", loadPendingInvitations);
      socket.off("user:invitation-accepted", loadPendingInvitations);
      socket.off("user:invitation-rejected", loadPendingInvitations);
      socket.disconnect();
      window.removeEventListener(
        "pending-invitations-updated",
        handlePendingUpdate
      );
      clearInterval(interval);
    };
  }, [socket, userId]);

  return pendingCount;
}

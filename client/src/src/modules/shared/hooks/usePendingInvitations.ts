import { useEffect, useRef, useState } from "react";
import api from "@/modules/shared/lib/api.js";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function usePendingInvitations(userId?: number | null) {
  const [pendingCount, setPendingCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const url = import.meta.env.VITE_API_URL;
    if (!url) {
      console.error("VITE_API_URL is not defined");
      return;
    }

    if (!socketInstance) {
      socketInstance = io(url, {
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 20000,
      });
    }

    const socket = socketInstance;
    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit("join-user", userId);
    };

    const handleDisconnect = () => {
      // log to help diagnose intermittent drops
      console.info("Socket disconnected from pending invitations feed");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", () => {
      // silent; reconnection handles recoveries
    });

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
    if (socket.connected) {
      handleConnect();
    }

    socket.on("invitation:pending", loadPendingInvitations);
    socket.on("user:invitation-accepted", loadPendingInvitations);
    socket.on("user:invitation-rejected", loadPendingInvitations);

    const handlePendingUpdate = () => {
      loadPendingInvitations();
    };
    window.addEventListener("pending-invitations-updated", handlePendingUpdate);

    const interval = setInterval(loadPendingInvitations, 30000);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("invitation:pending", loadPendingInvitations);
      socket.off("user:invitation-accepted", loadPendingInvitations);
      socket.off("user:invitation-rejected", loadPendingInvitations);
      window.removeEventListener(
        "pending-invitations-updated",
        handlePendingUpdate
      );
      clearInterval(interval);
    };
  }, [userId]);

  return pendingCount;
}

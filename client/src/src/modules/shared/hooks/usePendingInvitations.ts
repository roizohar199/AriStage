import { useEffect, useRef, useState } from "react";
import api from "@/modules/shared/lib/api.js";
import { API_ORIGIN } from "@/config/apiConfig";
import type { Socket } from "socket.io-client";

let socketInstance: Socket | null = null;
let socketModulePromise: Promise<typeof import("socket.io-client")> | null =
  null;

function loadSocketClient() {
  if (!socketModulePromise) {
    socketModulePromise = import("socket.io-client");
  }
  return socketModulePromise;
}

async function getSocketInstance(token: string | null) {
  if (!socketInstance) {
    const { io } = await loadSocketClient();
    socketInstance = io(API_ORIGIN, {
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
      auth: token ? { token } : undefined,
    });
  } else {
    socketInstance.auth = token ? { token } : {};
  }

  return socketInstance;
}

export function usePendingInvitations(userId?: number | null) {
  const [pendingCount, setPendingCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const token = localStorage.getItem("ari_token");

    void getSocketInstance(token).then((socket) => {
      if (disposed) return;

      socketRef.current = socket;

      const handleConnect = () => {
        socket.emit("join-user", userId);
      };

      const handleDisconnect = () => {
        console.info("Socket disconnected from pending invitations feed");
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", () => {});

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

      void loadPendingInvitations();
      if (socket.connected) {
        handleConnect();
      }

      socket.on("invitation:pending", loadPendingInvitations);
      socket.on("user:invitation-accepted", loadPendingInvitations);
      socket.on("user:invitation-rejected", loadPendingInvitations);

      const handlePendingUpdate = () => {
        void loadPendingInvitations();
      };
      window.addEventListener(
        "pending-invitations-updated",
        handlePendingUpdate,
      );

      const interval = setInterval(loadPendingInvitations, 30000);

      cleanup = () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("invitation:pending", loadPendingInvitations);
        socket.off("user:invitation-accepted", loadPendingInvitations);
        socket.off("user:invitation-rejected", loadPendingInvitations);
        window.removeEventListener(
          "pending-invitations-updated",
          handlePendingUpdate,
        );
        clearInterval(interval);
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [userId]);

  return pendingCount;
}

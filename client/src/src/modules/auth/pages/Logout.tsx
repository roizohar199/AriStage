import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

export default function Logout(): JSX.Element {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  return null;
}

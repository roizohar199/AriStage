import React, { createContext, useCallback, useMemo, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { ConfirmContextValue, ConfirmOptions, ConfirmState } from "./types";
import { useTranslation } from "@/hooks/useTranslation.ts";

export const ConfirmContext = createContext<ConfirmContextValue | undefined>(
  undefined,
);

function normalizeOptions(
  options: ConfirmOptions,
  t: (path: string, fallback?: string) => string,
): ConfirmOptions {
  return {
    ...options,
    confirmLabel: options.confirmLabel || t("common.ok"),
    cancelLabel: options.cancelLabel || t("common.cancel"),
    variant: options.variant || "default",
  };
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: null,
    resolver: null,
  });

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({
          isOpen: true,
          options: normalizeOptions(options, t),
          resolver: resolve,
        });
      }),
    [t],
  );

  const resolveAndClose = useCallback((result: boolean) => {
    setState((prev) => {
      if (prev.resolver) {
        prev.resolver(result);
      }

      return {
        isOpen: false,
        options: null,
        resolver: null,
      };
    });
  }, []);

  const handleCancel = useCallback(
    () => resolveAndClose(false),
    [resolveAndClose],
  );
  const handleConfirm = useCallback(
    () => resolveAndClose(true),
    [resolveAndClose],
  );

  const contextValue = useMemo<ConfirmContextValue>(
    () => ({ confirm }),
    [confirm],
  );

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      <ConfirmModal
        open={state.isOpen}
        title={state.options?.title ?? ""}
        message={state.options?.message ?? ""}
        confirmLabel={state.options?.confirmLabel}
        cancelLabel={state.options?.cancelLabel}
        variant={state.options?.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

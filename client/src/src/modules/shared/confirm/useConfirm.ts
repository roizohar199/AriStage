import { useCallback, useContext } from "react";
import { ConfirmContext } from "./ConfirmProvider";
import { ConfirmOptions } from "./types";

type ConfirmInvoker = {
  (options: ConfirmOptions): Promise<boolean>;
  (title: string, message: string): Promise<boolean>;
};

export function useConfirm(): ConfirmInvoker {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }

  const invokeConfirm: ConfirmInvoker = useCallback(
    (first: ConfirmOptions | string, second?: string) => {
      if (typeof first === "string") {
        return context.confirm({
          title: first,
          message: second ?? "",
        });
      }

      return context.confirm(first);
    },
    [context]
  );

  return invokeConfirm;
}

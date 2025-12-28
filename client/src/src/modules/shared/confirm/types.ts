export type ConfirmVariant = "default" | "danger";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolver: ((value: boolean) => void) | null;
}

export interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

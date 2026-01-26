import React, {
  forwardRef,
  useId,
  useRef,
  useState,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";

// Utility for merging class names (if no global util exists)
function cx(...args: (string | undefined | false | null)[]) {
  return args.filter(Boolean).join(" ");
}

// Field wrapper
export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}
export function Field({ label, hint, error, required, children }: FieldProps) {
  return (
    <div className="mb-2">
      {label && (
        <label className="block text-sm mb-1 font-medium text-neutral-100">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <div className="text-red-400 text-xs mt-1">{error}</div>
      ) : hint ? (
        <div className="text-neutral-400 text-xs mt-1">{hint}</div>
      ) : null}
    </div>
  );
}

// Input
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, hint, error, required, leftIcon, rightIcon, className, ...props },
    ref,
  ) => {
    const inputField = (
      <div className="relative">
        {leftIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cx(
            "w-full bg-neutral-900 p-2 rounded-2xl mb-2 text-neutral-100 text-label focus:bg-neutral-950 shadow-surface transition",
            leftIcon ? "pr-10" : "",
            rightIcon ? "pl-10" : "",
            error ? "border border-red-400" : "",
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {rightIcon}
          </span>
        )}
      </div>
    );
    if (label || hint || error) {
      return (
        <Field label={label} hint={hint} error={error} required={required}>
          {inputField}
        </Field>
      );
    }
    return inputField;
  },
);
Input.displayName = "Input";

// EmailInput
export const EmailInput = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <Input ref={ref} type="email" {...props} />,
);
EmailInput.displayName = "EmailInput";

// PasswordInput
export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, hint, error, required, leftIcon, rightIcon, className, ...props },
    ref,
  ) => {
    const [show, setShow] = useState(false);
    return (
      <Input
        ref={ref}
        type={show ? "text" : "password"}
        label={label}
        hint={hint}
        error={error}
        required={required}
        leftIcon={leftIcon}
        rightIcon={
          <button
            type="button"
            tabIndex={-1}
            className="text-neutral-400 hover:text-neutral-200 focus:outline-none"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "הסתר סיסמה" : "הצג סיסמה"}
          >
            {/* עיצוב האייקון כמו בפרויקט, אפשר להחליף ל-eye/eye-off אם יש */}
            {show ? (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.06M1 1l22 22"
                />
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"
                />
              </svg>
            )}
          </button>
        }
        className={className}
        {...props}
      />
    );
  },
);
PasswordInput.displayName = "PasswordInput";

// DateInput
export const DateInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, className, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        type="date"
        className={cx(
          "w-full bg-neutral-900 p-2 rounded-2xl mb-2 text-neutral-100 text-label focus:bg-neutral-950 shadow-surface transition",
          error ? "border border-red-400" : "",
          className,
        )}
        {...props}
      />
    );
    if (label || hint || error) {
      return (
        <Field label={label} hint={hint} error={error} required={required}>
          {input}
        </Field>
      );
    }
    return input;
  },
);
DateInput.displayName = "DateInput";

// TimeInput
export const TimeInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, className, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        type="time"
        className={cx(
          "w-full bg-neutral-900 p-2 rounded-2xl mb-2 text-neutral-100 text-label focus:bg-neutral-950 shadow-surface transition",
          error ? "border border-red-400" : "",
          className,
        )}
        {...props}
      />
    );
    if (label || hint || error) {
      return (
        <Field label={label} hint={hint} error={error} required={required}>
          {input}
        </Field>
      );
    }
    return input;
  },
);
TimeInput.displayName = "TimeInput";

// Textarea
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, className, ...props }, ref) => {
    const textarea = (
      <textarea
        ref={ref}
        className={cx(
          "w-full bg-neutral-900 p-2 rounded-2xl mb-2 text-neutral-100 text-label focus:bg-neutral-950 shadow-surface transition outline-none",
          error ? "border border-red-400" : "",
          className,
        )}
        rows={3}
        {...props}
      />
    );
    if (label || hint || error) {
      return (
        <Field label={label} hint={hint} error={error} required={required}>
          {textarea}
        </Field>
      );
    }
    return textarea;
  },
);
Textarea.displayName = "Textarea";

// Select (Dropdown)
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}
export interface SelectProps<T extends string = string> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}
export function Select<T extends string = string>({
  label,
  hint,
  error,
  required,
  value,
  options,
  onChange,
  disabled,
  className,
}: SelectProps<T>) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [panelRect, setPanelRect] = useState<{
    left: number;
    top?: number;
    width: number;
    maxHeight: number;
    direction: "rtl" | "ltr";
  } | null>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  const updatePanelPosition = React.useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const direction = (window.getComputedStyle(btn).direction || "rtl") as
      | "rtl"
      | "ltr";

    const GAP = 8;
    const MAX_PANEL_HEIGHT = 360;

    const top = rect.bottom + GAP;
    const spaceBelow = window.innerHeight - top - GAP;

    const maxHeight = Math.max(120, Math.min(spaceBelow, MAX_PANEL_HEIGHT));
    setPanelRect({
      left: rect.left,
      top,
      width: rect.width,
      maxHeight,
      direction,
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  React.useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePanelPosition();
    window.addEventListener("resize", onScrollOrResize);
    // capture scroll from modal containers too
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePanelPosition]);

  // Close dropdown on outside click (portal-safe)
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const inButton = Boolean(buttonRef.current?.contains(target));
      const inPanel = Boolean(panelRef.current?.contains(target));
      if (!inButton && !inPanel) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative mb-2">
      {label && (
        <label
          className="block text-sm mb-1 font-medium text-neutral-100"
          id={`${id}-label`}
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "w-full bg-neutral-900 p-2 rounded-2xl mb-1 text-neutral-100 text-label focus:bg-neutral-950 shadow-surface transition flex items-center justify-between gap-3",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          className,
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <svg
          className={cx(
            "h-4 w-4 text-neutral-300 transition",
            open ? "rotate-180" : "",
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && panelRect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              id={`${id}-listbox`}
              role="listbox"
              aria-labelledby={`${id}-label`}
              className="fixed z-[2000] w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-lg"
              dir={panelRect.direction}
              style={{
                left: panelRect.left,
                top: panelRect.top,
                width: panelRect.width,
              }}
            >
              <div
                className="overflow-y-auto"
                style={{ maxHeight: panelRect.maxHeight }}
              >
                {options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                        buttonRef.current?.focus();
                      }}
                      className={cx(
                        "w-full text-start px-3 py-2 text-sm rounded-2xl text-neutral-200 hover:bg-neutral-950 transition",
                        isSelected ? "font-bold" : "",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
      {error ? (
        <div className="text-red-400 text-xs mt-1">{error}</div>
      ) : hint ? (
        <div className="text-neutral-400 text-xs mt-1">{hint}</div>
      ) : null}
    </div>
  );
}

/*
דוגמת שימוש:

import { Field, Input, EmailInput, PasswordInput, DateInput, TimeInput, Textarea, Select } from "./FormControls";

<Field label="שם" hint="שדה חובה" error={error} required>
  <Input />
</Field>
<Input label="שם" error={error} required />
<EmailInput label="אימייל" />
<PasswordInput label="סיסמה" />
<DateInput label="תאריך" />
<TimeInput label="שעה" />
<Textarea label="הערות" />
<Select label="בחירה" value={value} options={[{value: "a", label: "A"}]} onChange={setValue} />
*/

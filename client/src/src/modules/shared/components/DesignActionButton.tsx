import React from "react";

type DesignActionButtonVariant = "primary" | "danger" | "cancel";

type DesignActionButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  variant?: DesignActionButtonVariant;
};

const DESIGN_ACTION_BUTTON_BASE_CLASS =
  // Semantic animation: buttons use `animation-press`
  "w-auto font-semibold rounded-2xl gap-1 flex flex-row-reverse items-center justify-center px-4 py-2 transition outline-none";

const DESIGN_ACTION_BUTTON_VARIANT_CLASS: Record<
  DesignActionButtonVariant,
  string
> = {
  primary: "bg-brand-primary text-neutral-100 hover:bg-brand-primaryLight",
  danger: "bg-red-600 text-neutral-100 hover:bg-red-500",
  cancel:
    "bg-neutral-700 hover:bg-neutral-650 text-neutral-100 px-5 py-2 font-bold",
};

const DesignActionButton = React.forwardRef<
  HTMLButtonElement,
  DesignActionButtonProps
>(({ children, type = "button", variant = "primary", ...rest }, ref) => (
  <button
    ref={ref}
    type={type}
    className={`${DESIGN_ACTION_BUTTON_BASE_CLASS} ${DESIGN_ACTION_BUTTON_VARIANT_CLASS[variant]}`}
    {...rest}
  >
    {children}
  </button>
));

DesignActionButton.displayName = "DesignActionButton";

export default DesignActionButton;

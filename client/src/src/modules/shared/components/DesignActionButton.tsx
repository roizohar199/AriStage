import React from "react";

type DesignActionButtonVariant = "primary" | "danger" | "cancel";

type DesignActionButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  variant?: DesignActionButtonVariant;
};

const DESIGN_ACTION_BUTTON_BASE_CLASS =
  "w-auto font-semibold rounded-2xl gap-1 flex flex-row-reverse items-center justify-center px-4 py-2";

const DESIGN_ACTION_BUTTON_VARIANT_CLASS: Record<
  DesignActionButtonVariant,
  string
> = {
  primary: "bg-brand-orange text-black hover:bg-brand-orangeLight",
  danger: "bg-red-600 text-white hover:bg-red-500",
  cancel:
    "bg-neutral-700/50 hover:bg-neutral-700 text-white px-5 py-2 font-bold",
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

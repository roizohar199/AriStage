import React from "react";

type DesignActionButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
>;

const DESIGN_ACTION_BUTTON_CLASS =
  "w-auto bg-brand-orange text-black font-semibold rounded-2xl gap-1 flex flex-row-reverse items-center justify-center px-4 py-2";

const DesignActionButton = React.forwardRef<
  HTMLButtonElement,
  DesignActionButtonProps
>(({ children, type = "button", ...rest }, ref) => (
  <button
    ref={ref}
    type={type}
    className={DESIGN_ACTION_BUTTON_CLASS}
    {...rest}
  >
    {children}
  </button>
));

DesignActionButton.displayName = "DesignActionButton";

export default DesignActionButton;

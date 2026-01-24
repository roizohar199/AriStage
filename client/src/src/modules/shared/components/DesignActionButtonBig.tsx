import React from "react";

type DesignActionButtonBigProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
>;

const DESIGN_ACTION_BUTTON_BIG_CLASS =
  // Semantic animation: buttons use `animation-press`
  "w-full bg-brand-primary text-neutral-100 transition font-semibold rounded-2xl px-4 py-2 mt-2 hover:bg-brand-primaryLight ";

const DesignActionButtonBig = React.forwardRef<
  HTMLButtonElement,
  DesignActionButtonBigProps
>(({ children, type = "button", ...rest }, ref) => (
  <button
    ref={ref}
    type={type}
    className={DESIGN_ACTION_BUTTON_BIG_CLASS}
    {...rest}
  >
    {children}
  </button>
));

DesignActionButtonBig.displayName = "DesignActionButtonBig";

export default DesignActionButtonBig;

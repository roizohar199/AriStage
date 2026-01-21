import React from "react";

type DesignActionButtonBigProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
>;

const DESIGN_ACTION_BUTTON_BIG_CLASS =
  "w-full bg-brand-orange text-black hover:text-black font-semibold rounded-2xl px-4 py-2 mt-2 hover:bg-brand-orangeLight disabled:opacity-60 disabled:cursor-not-allowed";

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

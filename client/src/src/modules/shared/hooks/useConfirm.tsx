import { useState } from "react";

export function useConfirm() {
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    resolve: null,
  });

  function confirm(title, message) {
    return new Promise((resolve) => {
      setModal({
        show: true,
        title,
        message,
        resolve,
      });
    });
  }

  function ConfirmModalComponent() {
    if (!modal.show) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
        <div className="glass w-[90%] max-w-sm p-6 rounded-2xl border border-white/10 text-center">
          <h2 className="text-lg font-semibold mb-3">{modal.title}</h2>
          <p className="text-sm mb-6">{modal.message}</p>

          <div className="flex gap-4 justify-center">
            <button
              className="px-5 py-2 rounded-xl bg-neutral-800"
              onClick={() => {
                modal.resolve(false);
                setModal({ ...modal, show: false });
              }}
            >
              ביטול
            </button>

            <button
              className="px-5 py-2 rounded-xl bg-brand-orange font-bold"
              onClick={() => {
                modal.resolve(true);
                setModal({ ...modal, show: false });
              }}
            >
              אישור
            </button>
          </div>
        </div>
      </div>
    );
  }

  return { confirm, ConfirmModalComponent };
}

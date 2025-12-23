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
    return (
      <>
        {modal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                modal.resolve(false);
                setModal({ ...modal, show: false });
              }}
            />
            {/* Modal */}
            <div
              className="bg-neutral-900 rounded-2xl w-full max-w-md p-6 relative shadow-2xl text-center z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-3">
                {modal.title} 123דמו
              </h2>
              <p className="text-sm mb-6">{modal.message}</p>

              <div className="flex gap-4 justify-center">
                <button
                  className="px-5 py-2 rounded-2xl bg-neutral-700"
                  onClick={() => {
                    modal.resolve(false);
                    setModal({ ...modal, show: false });
                  }}
                >
                  ביטול
                </button>

                <button
                  className="px-5 py-2 text-black rounded-2xl bg-brand-orange font-bold"
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
        )}
      </>
    );
  }

  return { confirm, ConfirmModalComponent };
}

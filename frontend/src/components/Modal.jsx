// frontend/src/components/Modal.jsx
import { useEffect } from "react";
import { createPortal } from "react-dom";
import ElectricBorder from "./ElectricBorder"; 

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-label="Dialog"
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target.classList.contains("modal-backdrop")) onClose?.();
      }}
    >
      <div className="modal-window">
        <ElectricBorder color="#BFA5FF" speed={1.35} chaos={1.1} thickness={2}>
          <div className="modal-inner">
            {children}
          </div>
        </ElectricBorder>
      </div>
    </div>,
    document.body
  );
}

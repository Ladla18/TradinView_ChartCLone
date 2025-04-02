import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "600px",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = ""; // Re-enable scrolling when modal closes
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1000] backdrop-blur-md transition-all duration-300">
      <div
        ref={modalRef}
        className="bg-white rounded-xl p-6 w-full overflow-auto shadow-2xl animate-modalFadeIn"
        style={{ maxWidth, maxHeight: "90vh" }}
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
          <h2 className="m-0 text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="bg-gray-100 rounded-full w-8 h-8 text-lg flex items-center justify-center cursor-pointer text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
      <style>
        {`
          @keyframes modalFadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-modalFadeIn {
            animation: modalFadeIn 0.3s;
          }
        `}
      </style>
    </div>
  );
};

export default Modal;

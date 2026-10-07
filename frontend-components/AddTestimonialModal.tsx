"use client";

import React, { useEffect } from "react";
import { SubmitTestimonialForm } from "./SubmitTestimonialForm";

interface AddTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdTestimonial: any) => void;
  apiUrl?: string;
}

export const AddTestimonialModal: React.FC<AddTestimonialModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  apiUrl,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <SubmitTestimonialForm
          apiUrl={apiUrl}
          isModal={true}
          onSuccess={(testimonial) => {
            if (onSuccess) onSuccess(testimonial);
            setTimeout(() => {
              onClose();
            }, 1200);
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

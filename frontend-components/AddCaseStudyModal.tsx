"use client";

import React, { useEffect } from "react";
import { SubmitCaseStudyForm } from "./SubmitCaseStudyForm";

interface AddCaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdCaseStudy: any) => void;
  apiUrl?: string;
}

export const AddCaseStudyModal: React.FC<AddCaseStudyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  apiUrl,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
        <SubmitCaseStudyForm
          apiUrl={apiUrl}
          isModal={true}
          onSuccess={(caseStudy) => {
            if (onSuccess) onSuccess(caseStudy);
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

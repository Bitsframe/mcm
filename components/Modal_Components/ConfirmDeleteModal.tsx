"use client";

import React from "react";
import { Button } from "flowbite-react";

interface Props {
  is_open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const ConfirmDeleteModal: React.FC<Props> = ({
  is_open,
  title = "Delete",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!is_open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#0e1725] rounded-lg shadow-lg w-full max-w-[520px] mx-4">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">{description}</div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 dark:bg-[#122136] text-gray-700 dark:text-white"
            >
              Cancel
            </button>
            <Button color="failure" onClick={onConfirm} isProcessing={loading}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

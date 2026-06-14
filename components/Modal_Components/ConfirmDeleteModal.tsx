"use client";

import React from "react";
import { Button } from "flowbite-react";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

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
  title,
  description,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const { t, i18n } = useTranslation(translationConstant.POSHISTORY);
  const isSpanishLocale = (i18n.resolvedLanguage || i18n.language || "")
    .toLowerCase()
    .startsWith("es");

  const resolvedTitle = (() => {
    if (title) {
      if (isSpanishLocale) {
        if (title === "Delete Order" || title === "Delete") return "Eliminar pedido";
        if (title === "Delete Confirmation") return "Confirmación de eliminación";
      }
      return title;
    }

    return isSpanishLocale
      ? t("POS-Historyk49", { defaultValue: "Eliminar" })
      : t("POS-Historyk49", { defaultValue: "Delete" });
  })();

  const resolvedDescription =
    description ||
    (isSpanishLocale
      ? t("POS-HistoryDeleteDesc", {
          defaultValue: "¿Está seguro de que desea eliminar este pedido? Esta acción no se puede deshacer.",
        })
      : t("POS-HistoryDeleteDesc", {
          defaultValue: "Are you sure you want to delete this order? This action cannot be undone.",
        }));

  if (!is_open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#0e1725] rounded-lg shadow-lg w-full max-w-[520px] mx-4">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resolvedTitle}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">{resolvedDescription}</div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 dark:bg-[#122136] text-gray-700 dark:text-white"
            >
              {isSpanishLocale
                ? t("POS-HistoryCancelBtn", { defaultValue: "Cancelar" })
                : t("POS-HistoryCancelBtn", { defaultValue: "Cancel" })}
            </button>
            <Button color="failure" onClick={onConfirm} isProcessing={loading}>
              {isSpanishLocale
                ? t("POS-Historyk49", { defaultValue: "Eliminar" })
                : t("POS-Historyk49", { defaultValue: "Delete" })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

"use client";

import { Button, Modal } from "flowbite-react";
import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface PropsInterface {
  open_handle?: any;
  children: ReactNode;
  submit_button_color?: string;
  Title?: string; 
  loading?: boolean;
  is_open: boolean;
  close_handle: () => void;
  create_new_handle?: () => void;
  buttonLabel?: string;
  disabled?: boolean;
  Trigger_Button?: any;
  darkMode?: any;
}

export const Custom_Modal: FC<PropsInterface> = ({
  open_handle,
  children,
  submit_button_color = "blue",
  Title = "Modal_Title", 
  loading = false,
  is_open,
  close_handle,
  create_new_handle,
  buttonLabel = "Create", 
  disabled = false,
  Trigger_Button,
  darkMode,
}) => {
  const { t } = useTranslation();

  const translatedTitle = t(Title, {
    ns: translationConstant.PROCODE,
    defaultValue: t(Title, {
      ns: translationConstant.POSSALES,
    }),
  });

  return (
    <Modal show={is_open} onClose={close_handle} className="!p-0">
      <div className="fixed inset-0 z-[1000] flex items-center justify-center min-h-screen p-2">
        <div className="bg-white dark:bg-[#0e1725] rounded-lg shadow-lg w-full max-w-[95vw] sm:max-w-[600px] mx-auto">
          <Modal.Header className="bg-white dark:bg-[#0e1725] dark:text-white text-black rounded-t-lg">
            {translatedTitle}
          </Modal.Header>
          <Modal.Body className="bg-white dark:bg-[#0e1725] text-black dark:text-white">
            <div className="space-y-6">{children}</div>
          </Modal.Body>
          <Modal.Footer className="flex justify-end bg-white dark:bg-[#0e1725] rounded-b-lg">
            <button
              className="bg-[#f1f4f9] dark:bg-[#122136] text-black dark:text-white px-4 py-[10px] rounded-lg"
              onClick={close_handle}
            >
              {t("Procode_k27", { ns: translationConstant.PROCODE })}
            </button>
            <Button
              color={submit_button_color}
              className="capitalize ml-2"
              isProcessing={loading}
              disabled={disabled}
              onClick={create_new_handle}
            >
              {t(buttonLabel, {
                ns: translationConstant.PROCODE,
                defaultValue: t(buttonLabel, {
                  ns: translationConstant.POSHISTORY,
                }),
              })}
            </Button>
          </Modal.Footer>
        </div>
      </div>
    </Modal>
  );
};

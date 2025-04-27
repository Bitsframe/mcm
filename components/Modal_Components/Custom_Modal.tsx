"use client";

import { Button, Modal } from "flowbite-react";
import { FC, ReactNode } from "react";

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
    submit_button_color = 'blue',
    Title = 'Modal Title',
    loading = false,
    is_open,
    close_handle,
    create_new_handle,
    buttonLabel = 'Create',
    disabled = false,
    Trigger_Button,
    darkMode,
}) => {
    return (
        <Modal show={is_open} onClose={close_handle}>
            <Modal.Header
                className="bg-white dark:bg-[#080e16] dark:text-white text-black"
            >
                {Title}
            </Modal.Header>

            <Modal.Body
                className="bg-white dark:bg-[#080e16] text-black dark:text-white"
            >
                <div className="space-y-6">{children}</div>
            </Modal.Body>

            <Modal.Footer
                className="flex justify-end bg-white dark:bg-[#080e16]"
            >
                <button
                    className="bg-[#F1F4F9] dark:bg-gray-700 text-black dark:text-white px-4 py-[10px] rounded-lg"
                    onClick={close_handle}
                >
                    Cancel
                </button>
                <Button
                    color={submit_button_color}
                    className="capitalize ml-2"
                    isProcessing={loading}
                    disabled={loading || disabled}
                    onClick={create_new_handle}
                >
                    {buttonLabel}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

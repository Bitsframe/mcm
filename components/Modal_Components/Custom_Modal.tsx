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
            <Modal.Header>{Title}</Modal.Header>
            <Modal.Body>
                <div className="space-y-6">
                    {children}
                </div>
            </Modal.Body>
            <Modal.Footer className="flex justify-end">
                <button className="bg-[#F1F4F9] text-black px-4 py-[10px] rounded-lg" onClick={close_handle}>
                    Cancel
                </button>
                <Button 
                    color={submit_button_color} 
                    className="capitalize" 
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
"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";

interface AddFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, content: string) => Promise<void>;
  loading?: boolean;
}

export default function AddFormModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: AddFormModalProps) {
  const [formName, setFormName] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  const handleSubmit = async () => {
    if (!formName.trim()) {
      alert("Please enter a form name");
      return;
    }

    const htmlContent = editor?.getHTML() || "";
    
    // Pass HTML content directly - the parent will handle JSON wrapping
    await onSubmit(formName, htmlContent);
    
    // Reset form
    setFormName("");
    editor?.commands.setContent("");
  };

  const handleClose = () => {
    setFormName("");
    editor?.commands.setContent("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add New Medical Form
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Form Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Form Name
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter form name..."
              className="w-full"
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Form Content
            </label>

            {/* Editor Toolbar */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-2 flex flex-wrap gap-1">
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  editor?.isActive("bold")
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                B
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`px-3 py-1 rounded text-sm italic ${
                  editor?.isActive("italic")
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                I
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={`px-3 py-1 rounded text-sm underline ${
                  editor?.isActive("underline")
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                U
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={`px-3 py-1 rounded text-sm line-through ${
                  editor?.isActive("strike")
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                S
              </button>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

              <button
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`px-3 py-1 rounded text-sm font-bold ${
                  editor?.isActive("heading", { level: 1 })
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                H1
              </button>
              <button
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`px-3 py-1 rounded text-sm font-bold ${
                  editor?.isActive("heading", { level: 2 })
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                H2
              </button>
              <button
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={`px-3 py-1 rounded text-sm font-bold ${
                  editor?.isActive("heading", { level: 3 })
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                H3
              </button>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

              <button
                onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                className={`px-3 py-1 rounded text-sm ${
                  editor?.isActive({ textAlign: "left" })
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                ⬅
              </button>
              <button
                onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                className={`px-3 py-1 rounded text-sm ${
                  editor?.isActive({ textAlign: "center" })
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                ↔
              </button>
              <button
                onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                className={`px-3 py-1 rounded text-sm ${
                  editor?.isActive({ textAlign: "right" })
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                ➡
              </button>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

              <button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1 rounded text-sm ${
                  editor?.isActive("bulletList")
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                • List
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={`px-3 py-1 rounded text-sm ${
                  editor?.isActive("orderedList")
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                }`}
                type="button"
              >
                1. List
              </button>
            </div>

            {/* Editor Content */}
            <div className="border border-t-0 border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-800 min-h-[300px] max-h-[400px] overflow-auto">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Creating...
              </>
            ) : (
              "Create Form"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

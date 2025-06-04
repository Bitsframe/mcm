"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Plus,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  PlusCircle,
} from "lucide-react";
import {
  create_content_service,
  fetch_content_service,
  update_content_service,
} from "@/utils/supabase/data_services/data_services";
import { clinca_logo } from "@/assets/images";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";

interface Template {
  id: string;
  name: string;
  content: string;
}

function htmlToText(html: string): string {
  if (typeof window !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  } else {
    return html.replace(/<[^>]+>/g, "");
  }
}

function getFullPreviewHtml(content: string) {
  return `
    <div style="text-align:center;margin-bottom:16px;">
    </div>
    <div style="margin-bottom:16px;">Dear Patient,</div>
    <div style="margin-bottom:16px;">${content}</div>
    <div style="margin-top:24px;">Best,<br/></div>
  `;
}

function getFullPlainText(content: string) {
  let cleanContent = htmlToText(content)
    .replace(/^Dear Patient,\s*/i, "")
    .replace(/\s*Best,\s*$/i, "")
    .trim();

  return `Dear Patient,\n\n${cleanContent}\n\nBest,\n`;
}

const MenuBar = ({ editor }: any) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive("bold") ? "bg-gray-100 dark:bg-gray-800" : ""
        }`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive("italic") ? "bg-gray-100 dark:bg-gray-800" : ""
        }`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive("underline") ? "bg-gray-100 dark:bg-gray-800" : ""
        }`}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive("bulletList") ? "bg-gray-100 dark:bg-gray-800" : ""
        }`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive("orderedList") ? "bg-gray-100 dark:bg-gray-800" : ""
        }`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive({ textAlign: "left" })
            ? "bg-gray-100 dark:bg-gray-800"
            : ""
        }`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive({ textAlign: "center" })
            ? "bg-gray-100 dark:bg-gray-800"
            : ""
        }`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive({ textAlign: "right" })
            ? "bg-gray-100 dark:bg-gray-800"
            : ""
        }`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
      <button
        onClick={() => {
          const url = window.prompt("Enter URL");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive("link") ? "bg-gray-100 dark:bg-gray-800" : ""
        }`}
        title="Add Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const EmailTemplates = () => {
  const [templateContent, setTemplateContent] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: templateContent,
    onUpdate: ({ editor }) => {
      setTemplateContent(editor.getHTML());
    },
  });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetch_content_service({
          table: "email_templates",
          sortOptions: {
            column: "created_at",
            order: "desc",
          },
        });

        const loadedTemplates = data.map((template) => ({
          id: template.id,
          name: template.name,
          content: template.body,
        }));

        setTemplates(loadedTemplates);
        setFilteredTemplates(loadedTemplates);
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };

    loadTemplates();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter((template) =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  useEffect(() => {
    if (editor && templateContent !== editor.getHTML()) {
      editor.commands.setContent(templateContent);
    }
  }, [templateContent, editor]);

  const handleCreateNewTemplate = () => {
    setShowCreateModal(true);
  };

  const handleCreateTemplateConfirm = () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }
    setShowCreateModal(false);
    setIsCreatingNew(true);
    setTemplateContent("");
    setActiveTemplate(null);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateName.trim()) {
        alert("Please enter a template name");
        return;
      }
      if (!templateContent.trim()) {
        alert("Please enter template content");
        return;
      }

      const plainTextBody = getFullPlainText(templateContent);

      const post_data = {
        name: templateName,
        body: plainTextBody,
        is_active: true,
      };

      const { data, error } = await create_content_service({
        table: "email_templates",
        post_data,
      });

      if (error) {
        throw error;
      }

      const newTemplate = {
        id: data?.[0]?.id,
        name: data?.[0]?.name,
        content: data?.[0]?.body,
      };

      setTemplates([newTemplate, ...templates]);
      setFilteredTemplates([newTemplate, ...filteredTemplates]);
      setIsCreatingNew(false);
      setActiveTemplate(null);
      setTemplateName("");
      setTemplateContent("");
      alert("Template saved to Supabase!");
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template. Please try again.");
    }
  };

  const handleEditTemplate = (template: Template) => {
    setActiveTemplate(template);
    setTemplateContent(template.content);
    setTemplateName(template.name);
    setIsCreatingNew(true);
  };

  const handleUpdateTemplate = async () => {
    try {
      if (!activeTemplate?.id) {
        alert("No template selected for update");
        return;
      }

      if (!templateContent.trim()) {
        alert("Please enter template content");
        return;
      }

      let cleanContent = htmlToText(templateContent)
        .replace(/^Dear Patient,\s*/i, "")
        .replace(/\s*Best,\s*$/i, "")
        .trim();

      const plainTextBody = `Dear Patient,\n\n${cleanContent}\n\nBest,\n`;

      const post_data = {
        id: activeTemplate.id,
        body: plainTextBody,
        is_active: true,
      };

      const data = await update_content_service({
        table: "email_templates",
        post_data,
        matchKey: "id",
      });

      const updatedTemplates = templates.map((t) =>
        t.id === activeTemplate.id ? { ...t, content: plainTextBody } : t
      );

      setTemplates(updatedTemplates);
      setFilteredTemplates(updatedTemplates);

      setIsCreatingNew(false);
      setActiveTemplate(null);
      setTemplateContent("");
      alert("Template content updated successfully!");
    } catch (error) {
      console.error("Error updating template:", error);
      alert("Failed to update template. Please try again.");
    }
  };

  return (
    <div className="relative z-0 h-[120dvh] md:h-[70dvh] bg-background dark:bg-gray-900 p-4">
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-[#080e16] rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => {
                setShowCreateModal(false);
                setTemplateName("");
              }}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">
              Create New template
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Please write a name below to add a template
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="Type here"
                disabled={!!activeTemplate?.id}
                autoFocus={!activeTemplate?.id}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setTemplateName("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                onClick={handleCreateTemplateConfirm}
              >
                Create template
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#0E1725] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center dark:border-gray-700">
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">
            Email Templates
          </h1>
          <button
            className="bg-[#0066ff] text-white px-4 py-2 rounded-md text-base transition-colors flex items-center gap-1"
            onClick={handleCreateNewTemplate}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create New Template</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="w-full md:w-[30%] border-r md:border-r bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-sm font-medium mb-3 text-gray-800 dark:text-gray-300">
                All Templates
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search templates"
                  className="w-full pl-8 pr-2 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="overflow-auto h-[180px] md:h-[calc(69vh-180px)] p-0">
              {filteredTemplates.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-4">
                  {searchQuery.trim()
                    ? "No matching templates found"
                    : "No templates saved yet"}
                </p>
              ) : (
                <ul className="text-base">
                  {filteredTemplates.map((template) => (
                    <li
                      key={template.id}
                      className={`px-4 py-3 cursor-pointer border-b text-sm dark:border-gray-700 ${
                        activeTemplate?.id === template.id
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => handleEditTemplate(template)}
                    >
                      <h3 className="font-medium">{template.name}</h3>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex-1 p-6 text-gray-800 dark:text-gray-100 overflow-auto">
            {isCreatingNew ? (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {activeTemplate?.id ? "Edit Template" : "Add Template"}
                  </h2>
                </div>

                <div className="flex flex-col h-[calc(100%-200px)]">
                  <MenuBar editor={editor} />
                  <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 text-base rounded-b">
                    <EditorContent editor={editor} className="h-full p-4" />
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-base font-semibold mb-2 text-gray-700 dark:text-gray-200">
                    Preview Template
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700 min-h-[120px] text-base overflow-auto">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: getFullPreviewHtml(templateContent),
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  {activeTemplate?.id ? (
                    <button
                      className="px-4 py-2 bg-[#0066ff] text-white rounded-md text-sm font-medium transition-colors"
                      onClick={handleUpdateTemplate}
                    >
                      Update Template
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                      onClick={handleSaveTemplate}
                    >
                      Save Template
                    </button>
                  )}
                  <button
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setTemplateName("");
                      setTemplateContent("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {filteredTemplates.length > 0
                      ? "Select a template to edit or create a new one"
                      : "No templates available. Create your first template"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;

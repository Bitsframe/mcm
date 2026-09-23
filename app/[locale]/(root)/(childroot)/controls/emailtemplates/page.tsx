"use client";

import { classifyError } from '@/utils/logging/safe-log';
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
  Trash2,
} from "lucide-react";
import {
  create_content_service,
  fetch_content_service,
  update_content_service,
  delete_content_service,
} from "@/utils/supabase/data_services/data_services";
import { clinca_logo } from "@/assets/images";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

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
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive("bold") ? "bg-gray-100" : ""
        }`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive("italic") ? "bg-gray-100" : ""
        }`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive("underline") ? "bg-gray-100" : ""
        }`}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive("bulletList") ? "bg-gray-100" : ""
        }`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive("orderedList") ? "bg-gray-100" : ""
        }`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive({ textAlign: "left" })
            ? "bg-gray-100"
            : ""
        }`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive({ textAlign: "center" })
            ? "bg-gray-100"
            : ""
        }`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive({ textAlign: "right" })
            ? "bg-gray-100"
            : ""
        }`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button
        onClick={() => {
          const url = window.prompt("Enter URL");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive("link") ? "bg-gray-100" : ""
        }`}
        title="Add Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const EmailTemplates = () => {
  const { t } = useTranslation(translationConstant.CONTROLS);
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
        console.error("Error loading templates:", classifyError(error));
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
    setTemplateName("");
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

  // const handleSaveTemplate = async () => {
  //   try {
  //     if (!templateName.trim()) {
  //       alert("Please enter a template name");
  //       return;
  //     }
  //     if (!templateContent.trim()) {
  //       alert("Please enter template content");
  //       return;
  //     }

  //     const plainTextBody = getFullPlainText(templateContent);

  //     const post_data = {
  //       name: templateName,
  //       body: plainTextBody,
  //       is_active: true,
  //     };

  //     const { data, error } = await create_content_service({
  //       table: "email_templates",
  //       post_data,
  //     });

  //     if (error) {
  //       throw error;
  //     }

  //     const newTemplate = {
  //       id: data?.[0]?.id,
  //       name: data?.[0]?.name,
  //       content: data?.[0]?.body,
  //     };

  //     setTemplates([newTemplate, ...templates]);
  //     setFilteredTemplates([newTemplate, ...filteredTemplates]);
  //     setIsCreatingNew(false);
  //     setActiveTemplate(null);
  //     setTemplateName("");
  //     setTemplateContent("");
  //     alert("Template saved to Supabase!");
  //   } catch (error) {
  //     console.error("Error saving template:", classifyError(error));
  //     alert("Failed to save template. Please try again.");
  //   }
  // };

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
      // Handle error and log it if needed
      throw new Error(`Error creating template: ${error.message}`);
    }

    // Check if 'data' is valid and has the correct properties
    if (Array.isArray(data) && data.length > 0) {
     const newTemplate = {
  id: (data as any)[0]?.id,          // Bypass TypeScript check with 'any'
  name: (data as any)[0]?.name,      // Bypass TypeScript check with 'any'
  content: (data as any)[0]?.body,   // Bypass TypeScript check with 'any'
};

      setTemplates([newTemplate, ...templates]);
      setFilteredTemplates([newTemplate, ...filteredTemplates]);
      setIsCreatingNew(false);
      setActiveTemplate(null);
      setTemplateName("");
      setTemplateContent("");
      alert("Template saved to Supabase!");
    } else {
      throw new Error("No valid data returned from the service.");
    }
  } catch (error) {
    console.error("Error saving template:", classifyError(error));
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
      console.error("Error updating template:", classifyError(error));
      alert("Failed to update template. Please try again.");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const { error } = await delete_content_service({
        table: "email_templates",
        id: templateId,
      });

      if (error) {
        throw error;
      }

      // Remove the deleted template from the state
      const updatedTemplates = templates.filter((t) => t.id !== templateId);
      setTemplates(updatedTemplates);
      setFilteredTemplates(updatedTemplates);

      // If the deleted template was active, clear the active template
      if (activeTemplate?.id === templateId) {
        setActiveTemplate(null);
        setTemplateContent("");
        setTemplateName("");
        setIsCreatingNew(false);
      }

      alert("Template deleted successfully!");
    } catch (error) {
      console.error("Error deleting template:", classifyError(error));
      alert("Failed to delete template. Please try again.");
    }
  };

  return (
    <div className="relative z-[49] h-[120dvh] md:h-[75dvh] bg-background">
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowCreateModal(false);
                setTemplateName("");
              }}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="mb-1 text-title3 text-label">
              {t("CT_k18")}
            </h2>
            <p className="mb-6 text-body text-label-2">
              {t("CT_k19")}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-600">
                {t("CT_k17")}
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 text-gray-800"
                placeholder="Type here"
                autoFocus={true}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setTemplateName("");
                }}
              >
                {t("CT_k16")}
              </button>
              <button
                className="px-5 py-2.5 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors font-medium text-sm"
                onClick={handleCreateTemplateConfirm}
              >
                {t("CT_k9")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-headline text-label">
            {t("CT_k8")}
          </h1>
          <button
            className="flex items-center gap-1 rounded-md bg-brand-600 px-4 py-2 text-body text-white transition-colors hover:bg-brand-700"
            onClick={handleCreateNewTemplate}
          >
            <PlusCircle className="w-5 h-5" />
            <span>{t("CT_k9")}</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="w-full md:w-[30%] border-r md:border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="mb-3 text-callout font-semibold text-label">
                {t("CT_k11")}
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("CT_k31")}
                  className="w-full pl-8 pr-2 py-2 text-sm border rounded-md bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="overflow-auto h-[180px] md:h-[calc(69vh-130px)] p-0">
              {filteredTemplates.length === 0 ? (
                <p className="text-sm text-gray-500 p-4">
                  {searchQuery.trim()
                    ? "No matching templates found"
                    : "No templates saved yet"}
                </p>
              ) : (
                <ul className="text-base">
                  {filteredTemplates.map((template) => (
                    <li
                      key={template.id}
                      className={`px-4 py-3 cursor-pointer border-b text-sm ${
                        activeTemplate?.id === template.id
                          ? "bg-brand-50 text-brand-700"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="font-medium flex-1"
                          onClick={() => handleEditTemplate(template)}
                        >
                          {template.name}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex-1 p-6 text-gray-800 overflow-auto">
            {isCreatingNew ? (
              <>
                <div className="mb-4">
                  <h2 className="text-title3 text-label">
                    {activeTemplate?.id ? t("CT_k12") : t("CT_k57")}
                  </h2>
                </div>

                <div className="flex flex-col h-[calc(100%-200px)]">
                  <MenuBar editor={editor} />
                  <div className="flex-1 overflow-auto border border-gray-200 text-base rounded-b">
                    <EditorContent editor={editor} className="h-full p-4" />
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="mb-2 text-callout font-semibold text-label">
                  {t("CT_k13")}
                  </h2>
                  <div className="bg-gray-50 rounded-md p-2 border border-gray-200 min-h-[120px] text-base overflow-auto">
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
                      className="px-4 py-2 bg-[#166534] text-white rounded-md text-sm font-medium transition-colors"
                      onClick={handleUpdateTemplate}
                    >
                      {t("CT_k14")}
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 bg-brand-500 text-white rounded-md text-sm font-medium hover:bg-brand-600 transition-colors"
                      onClick={handleSaveTemplate}
                    >
                      {t("CT_k15")}
                    </button>
                  )}
                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setTemplateName("");
                      setTemplateContent("");
                    }}
                  >
                    {t("CT_k16")}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">
                    {filteredTemplates.length > 0
                      ? t("CT_k10")
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

"use client";

import React, { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Search, X, Plus } from "lucide-react";

interface Template {
  id: number;
  name: string;
  content: string;
}

const EmailTemplates = () => {
  const [templateContent, setTemplateContent] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleEditorChange = (content: string) => {
    setTemplateContent(content);
  };

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

  const handleSaveTemplate = () => {
    const newTemplate: Template = {
      id: Date.now(),
      name: templateName,
      content: templateContent,
    };

    if (activeTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === activeTemplate.id
            ? { ...t, name: templateName, content: templateContent }
            : t
        )
      );
    } else {
      setTemplates([...templates, newTemplate]);
    }

    setIsCreatingNew(false);
    setActiveTemplate(null);
    setTemplateName("");
  };

  const handleEditTemplate = (template: Template) => {
    setActiveTemplate(template);
    setTemplateContent(template.content);
    setTemplateName(template.name);
    setIsCreatingNew(true);
  };

  return (
    <div className="relative z-0 h-[80dvh] bg-background dark:bg-gray-900 p-4">
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

            <h2 className="text-xl font-semibold mb-1 text-gray-900">
              Create New template
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Please write a name below to add a template
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-600">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 text-gray-800"
                placeholder="Type here"
                autoFocus
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
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
            onClick={handleCreateNewTemplate}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-sm font-medium mb-3 text-gray-800 dark:text-gray-300">
                Saved Templates
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search templates"
                  className="w-full pl-8 pr-2 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="overflow-auto flex-1 p-4">
              {templates.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No templates saved yet
                </p>
              ) : (
                <ul className="space-y-2">
                  {templates.map((template) => (
                    <li
                      key={template.id}
                      className={`p-3 rounded-md cursor-pointer ${
                        activeTemplate?.id === template.id
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => handleEditTemplate(template)}
                    >
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">
                        {template.name}
                      </h3>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex-1 p-6 text-gray-800 dark:text-gray-100 overflow-auto flex flex-col">
            {isCreatingNew ? (
              <>
                <div className="flex-1">
                  <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    value={templateContent}
                    onEditorChange={handleEditorChange}
                    init={{
                      height: "100%",
                      menubar: true,
                      plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "charmap",
                        "preview",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "table",
                        "help",
                        "wordcount",
                        "emoticons",
                        "codesample",
                        "pagebreak",
                        "nonbreaking",
                        "visualchars",
                        "quickbars",
                        "directionality",
                        "autosave",
                        "autoresize",
                      ],
                      toolbar:
                        "undo redo | blocks | bold italic forecolor backcolor | " +
                        "alignleft aligncenter alignright alignjustify | " +
                        "bullist numlist outdent indent | removeformat | help | " +
                        "fontfamily fontsize | code codesample | " +
                        "emoticons charmap | fullscreen preview | pagebreak nonbreaking | " +
                        "visualchars visualblocks | quickbars | directionality | " +
                        "searchreplace | autolink autoresize autosave",
                      content_style:
                        "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                      skin: "oxide-dark",
                      content_css: "dark",
                      contextmenu: "configurepermanentpen",
                      quickbars_insert_toolbar: false,
                      images_upload_url: false,
                      images_upload_handler: false,
                      file_picker_types: false,
                      file_picker_callback: false,
                      images_reuse_filename: false,
                      automatic_uploads: false,
                      images_upload_base_path: false,
                      images_upload_credentials: false,
                      menu: {
                        insert: { title: 'Insert', items: 'link' }
                      }
                    }}
                  />
                </div>

                <div className="mt-6">
                  <h2 className="text-base font-semibold mb-2 text-gray-700 dark:text-gray-200">
                    Preview Template
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700 min-h-[120px]">
                    <div dangerouslySetInnerHTML={{ __html: templateContent }} />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                    onClick={handleSaveTemplate}
                  >
                    Save Template
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setTemplateName("");
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
                    {templates.length > 0
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
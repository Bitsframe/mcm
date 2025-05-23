"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Search, X, Plus } from "lucide-react";
import { create_content_service, fetch_content_service, update_content_service } from "@/utils/supabase/data_services/data_services";
import {clinca_logo} from "@/assets/images";

interface Template {
  id: string;
  name: string;
  // subject: string;
  content: string;
}

function htmlToText(html: string): string {
  if (typeof window !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  } else {
    // SSR fallback
    return html.replace(/<[^>]+>/g, "");
  }
}

function getFullPreviewHtml(content: string) {
  return `
    <div style="text-align:center;margin-bottom:16px;">
      <img src="${clinca_logo.src}" alt="Clinic Logo" style="width:120px;object-fit:contain;" />
    </div>
    <div style="margin-bottom:16px;">Dear Patient,</div>
    <div style="margin-bottom:16px;">${content}</div>
    <div style="margin-top:24px;">Best,<br/></div>
  `;
}

function getFullPlainText(content: string) {
  // Remove any existing "Dear Patient" and "Best" from the content
  let cleanContent = htmlToText(content)
    .replace(/^Dear Patient,\s*/i, '')
    .replace(/\s*Best,\s*$/i, '')
    .trim();

  // Now add them back in the correct format
  return `Dear Patient,\n\n${cleanContent}\n\nBest,\n`;
}

const EmailTemplates = () => {
  const [templateContent, setTemplateContent] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateName, setTemplateName] = useState("");
  // const [templateSubject, setTemplateSubject] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load templates from Supabase using fetch_content_service
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetch_content_service({ 
          table: "email_templates",
          sortOptions: {
            column: 'created_at',
            order: 'desc'
          }
        });

        setTemplates(data.map(template => ({
          id: template.id,
          name: template.name,
          content: template.body
        })));
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };

    loadTemplates();
  }, []);

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
    // if (!templateSubject.trim()) {
    //   alert("Please enter a subject");
    //   return;
    // }
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
      // if (!templateSubject.trim()) {
      //   alert("Please enter a subject");
      //   return;
      // }
      if (!templateContent.trim()) {
        alert("Please enter template content");
        return;
      }

      // Compose plain text for Supabase
      const plainTextBody = getFullPlainText(templateContent);

      const post_data = {
        name: templateName,
        // subject: templateSubject,
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

      setTemplates([
        ...templates,
        {
          id: data?.[0]?.id,
          name: data?.[0]?.name,
          // subject: data?.[0]?.subject,
          content: data?.[0]?.body,
        },
      ]);
      setIsCreatingNew(false);
      setActiveTemplate(null);
      setTemplateName("");
      // setTemplateSubject("");
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
    // setTemplateSubject(template.subject || "");
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

      // Get the content without the standard headers/footers, and strip HTML
      let cleanContent = htmlToText(templateContent)
        .replace(/^Dear Patient,\s*/i, '')
        .replace(/\s*Best,\s*$/i, '')
        .trim();

      // Add the standard format
      const plainTextBody = `Dear Patient,\n\n${cleanContent}\n\nBest,\n`;

      const post_data = {
        id: activeTemplate.id,
        body: plainTextBody,
        is_active: true,
      };

      const data = await update_content_service({
        table: "email_templates",
        post_data,
        matchKey: "id"
      });

      // Update the templates list with the updated template content only
      setTemplates(templates.map(t => 
        t.id === activeTemplate.id 
          ? { ...t, content: plainTextBody }
          : t
      ));

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
    <div className="relative z-0 h-[80dvh] bg-background dark:bg-gray-900 p-4">
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowCreateModal(false);
                setTemplateName("");
                // setTemplateSubject("");
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
                disabled={!!activeTemplate?.id}
                autoFocus={!activeTemplate?.id}
              />
            </div>
            {/* <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-600">
                Subject
              </label>
              <input
                type="text"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 text-gray-800"
                placeholder="Subject"
                required
              />
            </div> */}
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setTemplateName("");
                  // setTemplateSubject("");
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
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mb-2"
                    placeholder="Subject"
                  />
                </div> */}
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
                    <div dangerouslySetInnerHTML={{ __html: getFullPreviewHtml(templateContent) }} />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  {activeTemplate?.id ? (
                    <button
                      className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
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
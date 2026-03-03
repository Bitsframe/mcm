"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Download, X, Save, Edit, Eye, Trash2 } from "lucide-react";
import { Switch } from "antd";
import axios from "axios";
import { toast } from "sonner";
import AddFormModal from "@/components/MedicalForms/AddFormModal";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MedicalForm {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  content: {
    html?: string;
    created_at?: string;
    updated_at?: string;
  } | null;
}

export default function MedicalFormsPage() {
  const { t } = useTranslation();
  const [forms, setForms] = useState<MedicalForm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedForm, setSelectedForm] = useState<MedicalForm | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 prose-p:min-h-[1.5em]",
      },
    },
  });

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    if (selectedForm) {
      setEditedContent(selectedForm.content?.html || "");
      setEditedName(selectedForm.name);
      setIsEditMode(false);
      editor?.commands.setContent(selectedForm.content?.html || "");
    }
  }, [selectedForm, editor]);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/forms');
      if (response.data.success) {
        setForms(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching forms:", error);
      toast.error("Failed to fetch forms");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      const response = await axios.put('/api/forms', {
        id,
        is_active: !currentStatus
      });
      
      if (response.data.success) {
        setForms(forms.map(form => 
          form.id === id ? { ...form, is_active: !currentStatus } : form
        ));
        if (selectedForm?.id === id) {
          setSelectedForm({ ...selectedForm, is_active: !currentStatus });
        }
        toast.success(`Form ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error: any) {
      console.error("Error updating form:", error);
      toast.error("Failed to update form status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteForm = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await axios.delete(`/api/forms?id=${id}`);
      
      if (response.data.success) {
        setForms(forms.filter(form => form.id !== id));
        if (selectedForm?.id === id) {
          setSelectedForm(null);
        }
        toast.success("Form deleted successfully");
      }
    } catch (error: any) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = (form: MedicalForm) => {
    setSelectedForm(form);
  };

  const handleCloseEditor = () => {
    setSelectedForm(null);
    setEditedContent("");
    setEditedName("");
  };

  const handleSaveForm = async () => {
    if (!selectedForm) return;
    
    setIsSaving(true);
    try {
      const contentToSave = isEditMode ? editor?.getHTML() || "" : editedContent;
      
      const response = await axios.put('/api/forms', {
        id: selectedForm.id,
        name: editedName,
        content: contentToSave
      });
      
      if (response.data.success) {
        toast.success("Form saved successfully");
        
        // Update local state with new content structure
        const updatedForm = {
          ...selectedForm,
          name: editedName,
          content: {
            html: contentToSave,
            updated_at: new Date().toISOString()
          }
        };
        
        setForms(forms.map(form => 
          form.id === selectedForm.id ? updatedForm : form
        ));
        setSelectedForm(updatedForm);
        setEditedContent(contentToSave);
        setIsEditMode(false);
      }
    } catch (error: any) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateForm = async (name: string, content: string) => {
    setIsCreating(true);
    try {
      const response = await axios.post('/api/forms', {
        name,
        content // Send HTML string, API will wrap in JSON
      });
      
      if (response.data.success) {
        toast.success("Form created successfully");
        setIsModalOpen(false);
        fetchForms(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error creating form:", error);
      toast.error("Failed to create form");
      throw error; // Re-throw to prevent modal from closing on error
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (form: MedicalForm) => {
    try {
      toast.info("Generating PDF...");
      
      let htmlContent = form.content?.html || '';
      
      // Replace empty paragraphs with paragraphs containing non-breaking space
      htmlContent = htmlContent.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
      htmlContent = htmlContent.replace(/<p\s+([^>]*)><\/p>/g, '<p $1>&nbsp;</p>');
      
      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      
      // Apply styles
      const style = document.createElement('style');
      style.textContent = `
        p {
          margin: 5px 0;
          line-height: 1.4;
        }
        h1, h2, h3 {
          margin-top: 10px;
          margin-bottom: 5px;
        }
      `;
      container.appendChild(style);
      
      container.style.padding = '40px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.lineHeight = '1.6';
      container.style.color = '#000';
      container.style.backgroundColor = '#fff';
      container.style.width = '210mm'; // A4 width
      
      // Add to document temporarily (hidden)
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      // Dynamically import libraries
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download PDF
      pdf.save(`${form.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      
      // Cleanup
      document.body.removeChild(container);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      {/* Left Side - Table */}
      <div className={`flex flex-col ${selectedForm ? 'w-1/3' : 'w-full'} transition-all duration-300 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Medical Forms
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage and distribute medical forms
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {forms.length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {forms.filter((f) => f.is_active).length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Inactive</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {forms.filter((f) => !f.is_active).length}
              </p>
            </div>
          </div>
        </div>

        {/* Forms Table */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 m-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <span>Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No forms found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredForms.map((form) => (
                    <TableRow 
                      key={form.id}
                      onClick={() => handleRowClick(form)}
                      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedForm?.id === form.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <TableCell className="font-medium">{form.name}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={form.is_active}
                          onChange={() => handleToggleActive(form.id, form.is_active)}
                          loading={updatingId === form.id}
                          size="small"
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDeleteForm(form.id, e)}
                          disabled={deletingId === form.id}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete form"
                        >
                          {deletingId === form.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Right Side - Form Editor */}
      {selectedForm && (
        <div className="w-2/3 flex flex-col bg-gray-100 dark:bg-gray-900">
          {/* Editor Header */}
          <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
                  placeholder="Form Name"
                />
              </div>
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditMode(false);
                        editor?.commands.setContent(editedContent);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveForm}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedForm)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseEditor}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
            {isEditMode ? (
              <div>
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
                <div className="border border-t-0 border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-800 min-h-[400px] max-h-[600px] overflow-auto">
                  <EditorContent editor={editor} />
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 min-h-[400px] shadow-sm">
                <style jsx>{`
                  .form-preview p {
                    margin: 5px 0;
                    line-height: 1.4;
                  }
                  .form-preview h1,
                  .form-preview h2,
                  .form-preview h3 {
                    margin-top: 10px;
                    margin-bottom: 5px;
                  }
                `}</style>
                <div 
                  className="form-preview prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: editedContent
                      .replace(/<p><\/p>/g, '<p>&nbsp;</p>')
                      .replace(/<p\s+([^>]*)><\/p>/g, '<p $1>&nbsp;</p>')
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      <AddFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateForm}
        loading={isCreating}
      />
    </div>
  );
}

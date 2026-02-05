"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Input_Component } from "@/components/Input_Component";
import { Custom_Modal } from "@/components/Modal_Components/Custom_Modal";
import { Button, Modal } from "flowbite-react";
import { supabase } from "@/services/supabase";
import { useTranslation } from "react-i18next";

async function uploadToStorage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload-special", { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  // Store only the object path in DB
  return data.path as string;
}

interface SpecialItem {
  id: number;
  file_path: string;
  display: boolean;
  created_at?: string;
  title?: string | null;
}


const SpecialsPage = () => {
  const { t } = useTranslation("Specials");
  const [items, setItems] = useState<SpecialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");

  const open = () => setIsOpen(true);
  const close = () => { setIsOpen(false); setFile(null); setNewTitle(""); };
  const closePreview = () => setPreviewUrl(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/specials/all");
      if (!res.ok) throw new Error("Failed to fetch specials");
      const json = await res.json();
      setItems(json.data || []);
    } catch (e: any) {
      toast.error(e.message || t("FailedToLoadSpecials"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onCreate = async () => {
    if (!file) return toast.error(t("PleaseSelectImage"));
    setUploading(true);
    try {
      const path = await uploadToStorage(file);
      const res = await fetch("/api/tools/specials/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: path, display: false, title: newTitle || null }),
      });
      if (!res.ok) throw new Error("Failed to create special");
      const json = await res.json();
      toast.success(t("SpecialAdded"));
      close();
      setItems((prev) => [json.data, ...prev]);
    } catch (e: any) {
      toast.error(e.message || t("FailedToCreate"));
    } finally {
      setUploading(false);
    }
  };

  const onToggle = async (it: SpecialItem) => {
    try {
      const res = await fetch(`/api/tools/specials/${it.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display: !it.display }),
      });
      if (!res.ok) throw new Error("Failed to update special");

      setItems((prev) =>
        prev.map((p) =>
          p.id === it.id ? { ...p, display: !p.display } : p
        )
      );

      toast.success(t("Updated"));
    } catch (e: any) {
      console.error("[onToggle] Error updating:", e);
      toast.error(e.message || t("FailedToUpdate"));
    }
  };

  const onDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/tools/specials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete special");
      toast.success(t("Deleted"));
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      toast.error(e.message || t("FailedToDelete"));
    }
  };

  return (
    <>

      <div className="p-6 bg-white dark:bg-[#0e1725] min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-black dark:text-white">{t("SpecialsGalleryTitle")}</h2>
          <Button onClick={open} color="blue">{t("AddPictureButton")}</Button>
        </div>

        <Custom_Modal
          Title={t("AddSpecialPictureModalTitle")}
          is_open={isOpen}
          close_handle={close}
          create_new_handle={onCreate}
          buttonLabel={t("UploadButton")}
          loading={uploading}
        >
          <div className="space-y-4">
            <Input_Component
              label={t("TitleLabel")}
              type="text"
              value={newTitle}
              onChange={(val: string) => setNewTitle(val)}
            />
            <div>
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t("SelectImageLabel")}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg p-2 bg-white dark:bg-[#1a2332] text-black dark:text-white border-gray-300 dark:border-blue-950"
              />
            </div>
          </div>
        </Custom_Modal>

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-300">{t("LoadingText")}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-300">{t("NoSpecialsText")}</div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <div key={it.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-[#1a2332] border-gray-200 dark:border-blue-950">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(
                    supabase.storage
                      .from('special_picture')
                      .getPublicUrl(it.file_path).data.publicUrl
                  )}
                  className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800 block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={supabase.storage.from('special_picture').getPublicUrl(it.file_path).data.publicUrl}
                    alt="special"
                    className="h-full w-full object-cover"
                  />
                </button>
                <div className="p-4 space-y-3">
                  {typeof it.title !== 'undefined' && (
                    <p className="text-sm font-medium truncate text-black dark:text-white" title={it.title || undefined}>
                      {it.title || t("Untitled")}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-black dark:text-white">{t("DisplayLabel")}</span>
                      <button
                        onClick={() => onToggle(it)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${it.display ? "bg-green-600" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-300 transition-transform ${it.display ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      color="failure"
                      onClick={() => onDelete(it.id)}
                    >
                      {t("DeleteButton")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal show={!!previewUrl} onClose={closePreview} size="5xl">
        <Modal.Header>{t("PreviewModalTitle")}</Modal.Header>
        <Modal.Body>
          <div className="w-full flex items-center justify-center">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="preview" className="max-h-[80vh] rounded-lg" />
            )}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SpecialsPage;

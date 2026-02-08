"use client";
import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Filter from "@/assets/images/icons/Filterwhite.png";
import Filterblack from "@/assets/images/icons/Filterblack.png";
import {
  getUserEmail,
  getLocations,
  getServices,
} from "@/actions/send-email/action";
import emailtemplate1 from "@/components/EmailTemplate/template1";
import emailtemplate2 from "@/components/EmailTemplate/template2";
import emailtemplate3 from "@/components/EmailTemplate/template3";
import emailtemplate4 from "@/components/EmailTemplate/template4";
import emailtemplate5 from "@/components/EmailTemplate/template5";
import emailtemplate6 from "@/components/EmailTemplate/template6";
import emailtemplate7 from "@/components/EmailTemplate/template7";
import emailtemplate8 from "@/components/EmailTemplate/template8";
import emailtemplate9 from "@/components/EmailTemplate/template9";
import emailtemplate10 from "@/components/EmailTemplate/template10";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Search, X, Edit, Plus } from "lucide-react";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
// import { toast } from "react-toastify";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { TabContext } from "@/context";
import axios from "axios";
import { toast } from "sonner";
import { fetch_content_service, update_content_service, create_content_service } from "@/utils/supabase/data_services/data_services";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon } from "lucide-react";

const EmailBroadcast: React.FC = () => {
  const [emailList, setEmailList] = useState<any[]>([]);
  const [visibleEmails, setVisibleEmails] = useState<any[]>([]);
  const [locationList, setLocationList] = useState<any[]>([]);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFilterOn, setIsFilterOn] = useState<boolean>(false);
  const [filter, setFilter] = useState<any>(false);
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [subject, setSubject] = React.useState<string>("");
  const [reason, setReason] = React.useState<string>("");
  const [buttonText, setButtonText] = React.useState<string>("");
  const [buttonLink, setButtonLink] = React.useState<string>("");
  const [clinicName, setClinicName] = React.useState<string>("");
  const [price, setPrice] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [checkedItems, setCheckedItems] = useState<any>([]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [onsite, setOnsite] = useState<boolean | undefined>();
  const [location, setLocation] = useState<any>(null);
  const [treatmentType, setTreatmentType] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);

  const templates = [
    { label: "Template 1", value: "template1", component: emailtemplate1 },
    { label: "Template 2", value: "template2", component: emailtemplate2 },
    { label: "Template 3", value: "template3", component: emailtemplate3 },
    { label: "Template 4", value: "template4", component: emailtemplate4 },
    { label: "Template 5", value: "template5", component: emailtemplate5 },
    { label: "Template 6", value: "template6", component: emailtemplate6 },
    { label: "Template 7", value: "template7", component: emailtemplate7 },
    { label: "Template 8", value: "template8", component: emailtemplate8 },
    { label: "Template 9", value: "template9", component: emailtemplate9 },
    { label: "Template 10", value: "template10", component: emailtemplate10 },
  ];

  const { setActiveTitle } = useContext(TabContext);

  // TipTap editor states for creating templates
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
    ],
    content: templateContent,
    onUpdate: ({ editor }) => setTemplateContent(editor.getHTML()),
  });
  const createModalRef = React.useRef<HTMLDivElement | null>(null);
  const saveBtnRef = React.useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (showCreateModal && createModalRef.current && saveBtnRef.current) {
      const w = saveBtnRef.current.offsetWidth;
      createModalRef.current.style.setProperty('--save-btn-width', `${w}px`);
    }
  }, [showCreateModal]);

  // Helper to wrap HTML content with greeting and closing
  function getFullHtmlContent(content: string) {
    // Remove any existing "Dear Patient" or "Best" from the content
    let cleanContent = content
      .replace(/<p>\s*Dear Patient,?\s*<\/p>/i, "")
      .replace(/<p>\s*Best,?\s*<\/p>/i, "")
      .trim();

    // Wrap with proper HTML structure
    return `<p>Dear Patient,</p>${cleanContent}<p>Best,</p>`;
  }

  const MenuBar = ({ editor }: any) => {
    if (!editor) return null;
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-2">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('bold') ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Bold"><Bold className="w-4 h-4"/></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Italic"><Italic className="w-4 h-4"/></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('underline') ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Underline"><UnderlineIcon className="w-4 h-4"/></button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('bulletList') ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Bullet List"><List className="w-4 h-4"/></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('orderedList') ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Numbered List"><ListOrdered className="w-4 h-4"/></button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Align Left"><AlignLeft className="w-4 h-4"/></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Align Center"><AlignCenter className="w-4 h-4"/></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Align Right"><AlignRight className="w-4 h-4"/></button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button onClick={() => { const url = window.prompt('Enter URL'); if (url) editor.chain().focus().setLink({ href: url }).run(); }} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('link') ? 'bg-gray-100 dark:bg-gray-800' : ''}`} title="Add Link"><LinkIcon className="w-4 h-4"/></button>
      </div>
    );
  };

  // keep editor in sync if templateContent changed externally
  useEffect(() => {
    if (editor && templateContent !== editor.getHTML()) {
      editor.commands.setContent(templateContent || "");
    }
  }, [templateContent, editor]);

  useEffect(() => {
    setActiveTitle("Sidebar_k14");

    // Fetch email templates from Supabase
    const fetchTemplates = async () => {
      try {
        const data = await fetch_content_service({ table: "email_templates" });
        setDbTemplates(data || []);
      } catch (err) {
        setDbTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, [setActiveTitle]);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("template1");
  const [isEditingTemplate, setIsEditingTemplate] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editBody, setEditBody] = useState<string>("");
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);

  const openTemplateEditor = () => {
    // find DB template by id (loose match in case selectedTemplate is string)
    const dbSelected = dbTemplates.find((t) => t.id == (selectedTemplate as any));
    if (dbSelected) {
      setEditTemplateId(dbSelected.id);
      setEditBody(dbSelected.body || "");
      setEditModalOpen(true);
      setIsEditingTemplate(true);
      return;
    }

    // For hardcoded templates just toggle the editing flag
    setIsEditingTemplate((v) => !v);
  };

  const submitTemplateUpdate = async () => {
    if (!editTemplateId) return;
    try {
      const post_data = {
        id: editTemplateId,
        body: editBody,
      } as any;

      const res = await update_content_service({ table: "email_templates", post_data });
      if (res?.length) {
        // update local DB templates state
        const updated = res[0];
        setDbTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditModalOpen(false);
        setIsEditingTemplate(false);
        toast.success("Template updated successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update template");
    }
  };

  const handleGenderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setIsFilterOn(true);
    setSelectedGender((prev) =>
      prev.includes(value)
        ? prev.filter((gender) => gender !== value)
        : [...prev, value]
    );
  };

  const handleVisitChange = (type: boolean) => {
    setIsFilterOn(true);
    setOnsite(type);
  };
  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    emailObj: any
  ) => {
    const isChecked = event.target.checked;
    setIsFilterOn(true);

    setCheckedItems((prevCheckedItems: any[]) =>
      isChecked
        ? [...prevCheckedItems, emailObj]
        : prevCheckedItems.filter((item) => item.email !== emailObj.email)
    );
  };

  const handleReset = async () => {
    setSelectedGender([]);
    setOnsite(undefined);
    setLocation("");
    setTreatmentType("");
    setIsFilterOn(false);
    // restore full list in the UI
    setVisibleEmails(emailList || []);
  };

  const handleSelectAndDeselectAll = (isSelected: boolean) => {
    if (isSelected) {
      // select only the currently visible (possibly filtered) emails
      setCheckedItems(filteredEmails && filteredEmails.length ? filteredEmails : emailList);
    } else {
      setCheckedItems([]);
    }
  };

  const templateOptions = [
    ...dbTemplates.map((t) => ({
      label: t.name,
      value: t.id,
      subject: t.subject,
      body: t.body,
      type: "db",
    })),
    ...templates.map((t) => ({
      label: t.label,
      value: t.value,
      subject: "",
      body: "",
      type: "hardcoded",
    })),
  ];

  const  RenderTemplate = () => {
    if (dbTemplates.length > 0) {
      const selected = dbTemplates.find((t) => t.id === selectedTemplate);
      if (selected) {
        let previewHtml = selected.body || "";
        if (name && name.trim()) {
          previewHtml = previewHtml.replace(
            /(Best,)(\s*<\/div>|<br\s*\/?>|\s*$)/i,
            (match: string, p1: string, p2: string) => `${p1}<br/>${name}${p2}`
          );
        }
        return (
          <div className="relative text-foreground dark:text-white bg-[#f1f4f7] dark:bg-gray-800">
            <button
              onClick={() => openTemplateEditor()}
              title={isEditingTemplate ? "Exit edit mode" : "Edit template"}
              className="absolute top-2 right-2 p-1 rounded bg-white/90 dark:bg-black/70 hover:opacity-90 shadow"
            >
              <Edit className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            </button>
            <div
              style={{ whiteSpace: "pre-line" }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            {isEditingTemplate && (
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                Edit mode enabled
              </div>
            )}
          </div>
        );
      }
    }
    // Hardcoded template
    const SelectedTemplateComponent = templates.find(
      (template) => template.value === selectedTemplate
    )?.component;
    if (SelectedTemplateComponent) {
      return (
        <div
          className="relative text-foreground dark:text-white bg-[#f1f4f7] dark:bg-gray-800"
          style={
            {
              "--text-color": "var(--foreground)",
            } as React.CSSProperties
          }
        >
          <button
            onClick={() => openTemplateEditor()}
            title={isEditingTemplate ? "Exit edit mode" : "Edit template"}
            className="absolute top-2 right-2 p-1 rounded bg-white/90 dark:bg-black/70 hover:opacity-90 shadow"
          >
            <Edit className="w-4 h-4 text-gray-700 dark:text-gray-200" />
          </button>
          <SelectedTemplateComponent
            userFirstname={"[Patient]"}
            reason={reason || "[Reason]"}
            clinicName={clinicName || "[ClinicName]"}
            name={name || ""}
            buttonText={buttonText || "[Button Text]"}
            buttonLink={buttonLink || "[buttonLink]"}
            startDate={moment(startDate).format("MM/DD/YYYY") || "[Start Date]"}
            endDate={moment(endDate).format("MM/DD/YYYY") || "[End Date]"}
            price={price || "0"}
            // @ts-ignore
            className="text-foreground dark:text-white"
          />
          {isEditingTemplate && (
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              built-in templates cannot be edited
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const filterEmails = () => {
    let filteredEmails = emailList;

    if (selectedGender.length > 0) {
      filteredEmails = filteredEmails?.filter((item) =>
        selectedGender.includes(item.gender)
      );
    }

    if (treatmentType) {
      filteredEmails = filteredEmails?.filter(
        (item) => item.treatmenttype === treatmentType
      );
    }

    if (location) {
      filteredEmails = filteredEmails?.filter(
        (item) => item.Locations?.title === location
      );
    }

    if (typeof onsite === "boolean") {
      filteredEmails = filteredEmails?.filter((item) => item.onsite === onsite);
    }

    const selectedEmails = filteredEmails.filter((email) =>
      checkedItems.some((checkedItem: any) => checkedItem.email === email.email)
    );
    const unselectedEmails = filteredEmails.filter(
      (email) =>
        !checkedItems.some(
          (checkedItem: any) => checkedItem.email === email.email
        )
    );

    // If searchQuery is empty, return all with selected ones first
    if (!searchQuery || !searchQuery.trim()) {
      return [...selectedEmails, ...unselectedEmails];
    }

    const q = searchQuery.toLowerCase().trim();

    return [...selectedEmails, ...unselectedEmails].filter((email) => {
      const emailStr = (email?.email || '').toLowerCase();
      const first = (email?.firstname || '').toLowerCase();
      const last = (email?.lastname || '').toLowerCase();
      const full = `${first} ${last}`.trim();

      return (
        emailStr.includes(q) ||
        first.includes(q) ||
        last.includes(q) ||
        full.includes(q)
      );
    });
  };

  // Apply filters and notify via console for debugging
  const applyFilters = () => {
    try {
      const matched = filterEmails();
      setIsFilterOn(true);
      setFilter(false);
      // update visible emails shown in the list immediately
      setVisibleEmails(matched);
    } catch (err) {
      console.error('Error applying filters', err);
    }
  };

  const filteredEmails = filterEmails();

  useEffect(() => {
    const fetchEmailList = async () => {
      try {
        const email = await getUserEmail();
       
        setEmailList(email);
        setVisibleEmails(email || []);

    

        const location = await getLocations();
        setLocationList(location);
        const services = await getServices();
        setServiceList(services);
      } catch (error) {
        console.error("Failed to fetch email:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailList();
  }, []);

  const sendEmail = async () => {
    if (!checkedItems || checkedItems.length === 0) {
      toast.error("No email selected.", { position: "top-center" });
      return;
    }
    try {
      const isDbTemplate = dbTemplates.find(t => t.id === selectedTemplate);
      
      if (!subject || !name) {
        toast.error("All fields are necessary.", { position: "top-center" });
        return;
      }

      if (!isDbTemplate && !price) {
        toast.error("All fields are necessary.", { position: "top-center" });
        return;
      }

      const dbTemplate = dbTemplates.find((t) => t.id === selectedTemplate);
      let templateBody: string | undefined = undefined;
      if (dbTemplate) {
        // Render the template body with logo and name
        let previewHtml = dbTemplate.body || "";
        // Insert name after 'Best,' if name is provided
        if (name && name.trim()) {
          previewHtml = previewHtml.replace(
            /(Best,)(\s*<\/div>|<br\s*\/?>|\s*$)/i,
            `$1<br/>${name}$2`
          );
        }
        // Always add the logo at the top
        const STATIC_LOGO_URL =
          "https://vsvueqtgulraaczqnnvh.supabase.co/storage/v1/object/public/email-assets//clinca_logo.png";
        previewHtml = `
          <div style="text-align:center;margin-bottom:16px;">
            <img src="${STATIC_LOGO_URL}" alt="Clinic Logo" style="width:120px;object-fit:contain;" />
          </div>
          ${previewHtml}
        `;
        templateBody = previewHtml;
      }

      const res = await fetch("/api/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          template: dbTemplate ? dbTemplate.name : selectedTemplate,
          templateBody,
          buttonLink,
          buttonText,
          name,
          clinicName,
          reason,
          startDate: moment(startDate).format("MM/DD/YYYY"),
          endDate: moment(endDate).format("MM/DD/YYYY"),
          email: checkedItems,
          price,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `Email Sent Successfully to ${checkedItems.length} recipient(s)`
        );
        setSubject("");
        setButtonLink("");
        setButtonText("");
        setName("");
        setClinicName("");
        setReason("");
        setStartDate(undefined);
        setEndDate(undefined);
        setCheckedItems([]);
        setPrice("");
      } else {
        console.error("Email sending failed:", data);
        toast.error(data.message || "Failed to send email");
      }
    } catch (error: any) {
      console.error("Email sending error:", error);
      toast.error(error.message || "Failed to send email");
    }
  };

  const { t } = useTranslation(translationConstant.EMAILB);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 dark:bg-[#0e1725]">
      <div>
        <h1 className="text-xl font-bold">{t("EmailB_k12")}</h1>
        <h1 className="mt-1 mb-2 text-sm text-gray-500 dark:text-gray-400">
          {t("EmailB_k13")}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2 bg-white dark:bg-[#0E1725] rounded-lg shadow-sm py-4">
          <div className="space-y-2">
            <label
              htmlFor="patients"
              className="text-sm font-medium flex items-center text-foreground"
            >
              {t("EmailB_k14")} <span className="text-destructive ml-1">*</span>
            </label>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full p-2 my-1 text-[16px] bg-[#f1f4f7] text-muted-foreground text-left rounded dark:bg-[#122136]">
                  {checkedItems.length > 0
                    ? checkedItems
                        .slice(0, 2)
                        .map((email: { email: string }) => email.email)
                        .join(", ") +
                      (checkedItems.length > 2
                        ? ` +${checkedItems.length - 2} more`
                        : "")
                    : t("EmailB_k1")}
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent
                className="
                  w-[90vw] sm:w-[500px]
                  max-h-[90vh] sm:h-[600px]
                  overflow-hidden flex flex-col
                  p-4 sm:p-4
                  bg-background dark:bg-[#080e16]
                  border dark:border-[#0e1725]
                  rounded-lg
                "
              >
                <AlertDialogHeader className="flex-none">
                  {!filter ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertDialogTitle className="text-accent-foreground text-base sm:text-lg">
                            {t("EmailB_k7")}
                          </AlertDialogTitle>
                        </div>
                        <AlertDialogCancel className="bg-gray-200 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600 h-8 w-8 flex items-center justify-center rounded-full shadow-md transition-colors">
                          <button>
                            <X className="w-4 h-4 text-black dark:text-white" />
                          </button>
                        </AlertDialogCancel>
                      </div>

                      
                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                          {checkedItems
                            .slice(0, 2)
                            .map((item: any, index: any) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                              >
                                {item.email}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckboxChange(
                                      {
                                        //@ts-ignore
                                        target: {
                                          value: item.email,
                                          checked: false,
                                        },
                                      },
                                      item
                                    );
                                  }}
                                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 dark:hover:bg-blue-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          {checkedItems.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                              +{checkedItems.length - 2}
                            </span>
                          )}
                        </div>
                     

                      <div className="flex items-center justify-between mt-2 sm:mt-3">
                        <div className="relative border border-input dark:border-[#0e1725] rounded-lg w-full sm:w-auto flex-1">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                          <Search className="w-4 h-4" />
                                        </span>
                                        <input
                                          placeholder={t("EmailB_k9") + ' or name'}
                                          type="text"
                                          className="pl-10 pr-2 py-2 border border-input dark:border-[#0e1725] rounded-lg bg-background dark:bg-[#0e1725] text-foreground w-full text-sm sm:text-base"
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                      </div>

                        <Image
                          src={Filter}
                          alt=""
                          height={20}
                          width={20}
                          onClick={() => setFilter(true)}
                          className="cursor-pointer dark:invert ml-2 sm:ml-3"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2 sm:mt-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="border-2 border-gray-500 dark:border-gray-300 bg-gray-300 dark:bg-[#122136] rounded p-2 accent-blue-600 w-4 h-4 sm:w-5 sm:h-5"
                            checked={
                              filteredEmails.length > 0 &&
                              filteredEmails.every((email: any) =>
                                checkedItems.some((item: any) => item.email === email.email)
                              )
                            }
                            onChange={(e) =>
                              handleSelectAndDeselectAll(e.target.checked)
                            }
                          />
                          <h2 className="ml-2 text-foreground text-sm sm:text-base">
                            {t("EmailB_k10")}
                          </h2>
                        </div>
                        <h2 className="text-foreground text-sm sm:text-base">
                          {t("EmailB_k11")}
                        </h2>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ChevronLeft
                          onClick={() => setFilter(false)}
                          className="text-foreground w-5 h-5 sm:w-6 sm:h-6"
                        />
                        <AlertDialogTitle className="text-foreground text-base sm:text-lg">
                        {t("EmailB_k29")}

                        </AlertDialogTitle>
                      </div>
                      <AlertDialogCancel className="bg-[#f1f4f9] dark:bg-[#122136] text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-[#1a2e4a] h-8 w-8 sm:h-10 sm:w-10">
                        <X className="h-4 w-4" />
                      </AlertDialogCancel>
                    </div>
                  )}
                  <hr className="border-border dark:border-[#0e1725] my-2" />
                </AlertDialogHeader>

                <AlertDialogDescription className="flex-1 overflow-y-auto">
                  {!filter && (
                    <>
                      {loading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton
                              key={index}
                              className="h-10 w-full rounded bg-secondary dark:bg-[#0e1725]"
                            />
                          ))}
                        </div>
                      ) : (
                        filteredEmails.map((email: any, index: any) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 sm:p-4 bg-[#f1f4f7] dark:bg-[#0e1725] w-full my-2 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                className="border-2 border-gray-500 dark:border-gray-300 bg-gray-300 dark:bg-[#122136] rounded p-2 accent-blue-600 w-4 h-4 sm:w-5 sm:h-5"
                                id={`checkbox-${index}`}
                                value={email.email}
                                checked={checkedItems.some(
                                  (item: any) => item.email === email.email
                                )}
                                onChange={(e) => handleCheckboxChange(e, email)}
                              />
                              <div className="flex flex-col">
                                <Label className="mb-1 font-bold text-foreground text-sm sm:text-base">
                                  {email.firstname}
                                </Label>
                                <Label className="text-muted-foreground text-xs sm:text-sm">
                                  {email.email}
                                </Label>
                              </div>
                            </div>
                            <div>
                              <Label className="text-foreground text-sm sm:text-base">
                                {email.gender === "Male"
                                  ? "M"
                                  : email.gender === "Female"
                                  ? "F"
                                  : "O"}
                              </Label>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {filter && (
                    <div className="space-y-4">
                      <RadioGroup defaultValue="comfortable">
                        <div className="flex flex-wrap gap-2 sm:gap-4">
                          <h1 className="font-bold text-foreground text-sm sm:text-base">
                          {t("EmailB_k19")}
                          </h1>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value="Male"
                              onChange={handleGenderChange}
                              className="border-2 border-gray-500 dark:border-gray-300 bg-gray-300 dark:bg-[#122136] rounded p-2 accent-blue-600 w-4 h-4 sm:w-5 sm:h-5"
                              checked={selectedGender.includes("Male")}
                            />
                            <Label
                              htmlFor="r2"
                              className="text-foreground text-sm sm:text-base"
                            >
                              {t("EmailB_k20")}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value="Female"
                              className="border-2 border-gray-500 dark:border-gray-300 bg-gray-300 dark:bg-[#122136] rounded p-2 accent-blue-600 w-4 h-4 sm:w-5 sm:h-5"
                              onChange={handleGenderChange}
                              checked={selectedGender.includes("Female")}
                            />
                            <Label
                              htmlFor="r3"
                              className="text-foreground text-sm sm:text-base"
                            >
                              {t("EmailB_k21")}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value="other"
                              className="border-2 border-gray-500 dark:border-gray-300 bg-gray-300 dark:bg-[#122136] rounded p-2 accent-blue-600 w-4 h-4 sm:w-5 sm:h-5"
                              onChange={handleGenderChange}
                              checked={selectedGender.includes("other")}
                            />
                            <Label
                              htmlFor="r3"
                              className="text-foreground text-sm sm:text-base"
                            >
                             {t("EmailB_k22")}
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>

                      <div className="flex items-center gap-2">
                        <h1 className="font-bold text-foreground text-sm sm:text-base">
                          {t("EmailB_k23")}
                        </h1>
                        <Select
                          onValueChange={(value) => setTreatmentType(value)}
                        >
                          <SelectTrigger className="w-full sm:w-[180px] bg-background dark:bg-[#0e1725] border-input dark:border-[#0e1725] text-foreground text-sm sm:text-base">
                            <SelectValue className="text-foreground text-sm sm:text-base">
                              {treatmentType ? treatmentType : "All Treatments"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-background dark:bg-[#080e16] border dark:border-[#0e1725] max-h-[200px] overflow-y-auto">
                            <SelectGroup>
                              {serviceList.map((patient: any, index) => (
                                <SelectItem
                                  value={patient.title}
                                  key={index}
                                  className="hover:bg-accent dark:hover:bg-[#0e1725] text-foreground text-sm sm:text-base"
                                >
                                  {patient.title}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <RadioGroup defaultValue="comfortable">
                        <div className="flex flex-wrap gap-2 sm:gap-4">
                          <h1 className="font-bold text-foreground text-sm sm:text-base">
                          {t("EmailB_k24")}
                          </h1>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="border-2 border-gray-500 dark:border-gray-300 bg-gray-300 dark:bg-[#122136] rounded p-2 accent-blue-600 w-4 h-4 sm:w-5 sm:h-5"
                              checked={onsite === true}
                              onChange={() => handleVisitChange(true)}
                            />
                            <Label
                              htmlFor="r2"
                              className="text-foreground text-sm sm:text-base"
                            >
                              {t("EmailB_k27")}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="border-2 border-gray-500 dark:border-gray-300 bg-gray-300 dark:bg-[#122136] rounded p-2 accent-blue-600 w-4 h-4 sm:w-5 sm:h-5"
                              checked={onsite === false}
                              onChange={() => handleVisitChange(false)}
                            />
                            <Label
                              htmlFor="r3"
                              className="text-foreground text-sm sm:text-base"
                            >
                              {t("EmailB_k28")}
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>

                      <div className="flex items-center gap-2">
                        <h1 className="font-bold text-foreground text-sm sm:text-base">
                        {t("EmailB_k25")}
                        </h1>
                        <Select onValueChange={(value) => setLocation(value)}>
                          <SelectTrigger className="w-full sm:w-[180px] bg-background dark:bg-[#0e1725] border-input dark:border-[#0e1725] text-foreground text-sm sm:text-base">
                            <SelectValue className="text-foreground text-sm sm:text-base">
                              {location ? location : "Select Location"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-background dark:bg-[#080e16] border dark:border-[#0e1725] max-h-[200px] overflow-y-auto">
                            <SelectGroup>
                              {locationList
                                ?.filter(
                                  (location, index, self) =>
                                    index ===
                                    self.findIndex(
                                      (loc) => loc.title === location.title
                                    )
                                )
                                .map((location, index) => (
                                  <SelectItem
                                    key={index}
                                    value={location.title}
                                    className="hover:bg-accent dark:hover:bg-[#0e1725] text-foreground text-sm sm:text-base"
                                  >
                                    {location.title}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReset()}
                          className=" bg-[#0066ff] py-2 px-5 rounded-lg  text-base text-white"
                        >
                          {t("EmailB_k26")}
                        </button>
                        <button
                          onClick={() => applyFilters()}
                          className=" bg-green-600 py-2 px-4 rounded-lg text-base text-white"
                        >
                          {"Apply Filters"}
                        </button>
                      </div>
                    </div>
                  )}
                </AlertDialogDescription>
                <AlertDialogFooter className="flex-none sticky bottom-0 w-full flex justify-end bg-background dark:bg-[#080e16] pt-2">
                  {!filter && checkedItems.length > 0 && (
                    <AlertDialogCancel className="bg-blue-600 h-10 sm:h-12 hover:bg-blue-700 text-white border-none text-sm sm:text-base">
                      Close
                    </AlertDialogCancel>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="space-y-2 mt-2">
            <label
              htmlFor="template"
              className="text-sm font-medium flex items-center text-foreground dark:text-white"
            >
              {t("EmailB_k15")} {" "}
              <span className="text-destructive dark:text-red-500 ml-1">*</span>
            </label>

            <div className="relative">
              <select
                id="template"
                className="w-full p-3 bg-[#f1f4f7] dark:bg-[#122136] text-sm text-foreground dark:text-white rounded-md border-none dark:border-gray-600 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-primary-500"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={loadingTemplates}
              >
                {templateOptions.map((template) => (
                  <option
                    key={template.value}
                    value={template.value}
                    className="bg-background dark:bg-gray-700 text-foreground dark:text-white"
                  >
                    {template.label}
                    {template.type === "db" ? " (DB)" : " (Built-in)"}
                  </option>
                ))}
              </select>

              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-muted-foreground dark:text-gray-400"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm"
                title="Create new template"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Create</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <label
              htmlFor="subject"
              className="text-sm font-medium flex items-center text-foreground dark:text-white"
            >
              {t("EmailB_k3")} {" "}
              <span className="text-destructive dark:text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={subject || ""}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("EmailB_k16")}
              className="w-full p-3 dark:bg-[#122136] bg-[#f1f4f7] text-sm rounded-md border border-input dark:border-gray-600 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-primary-500 focus:outline-none transition-colors"
            />

            {/* Template Editor Modal */}
            {editModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-white dark:bg-[#0b1220] rounded-lg shadow-lg p-6 w-full max-w-3xl">
                  <h2 className="text-lg font-semibold mb-3 text-foreground dark:text-white">Edit Template</h2>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full h-64 p-3 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#0b1320] text-foreground dark:text-white"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => { setEditModalOpen(false); setIsEditingTemplate(false); }}
                      className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitTemplateUpdate()}
                      className="px-4 py-2 rounded bg-blue-600 text-white"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Create Template Modal (TipTap) */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div ref={createModalRef} className="bg-white dark:bg-[#0b1220] rounded-lg shadow-lg p-6 w-full max-w-3xl" id="emailbroadcast-create-modal">
                <style>{`#emailbroadcast-create-modal .editor-inner input, #emailbroadcast-create-modal .editor-inner .ProseMirror p { width: var(--save-btn-width); max-width: var(--save-btn-width); margin: 0 auto; }`}</style>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold mb-1 text-foreground dark:text-white">Create Template</h2>
                  <button onClick={() => { setShowCreateModal(false); setTemplateName(''); setTemplateContent(''); }} className="text-muted-foreground">Close</button>
                </div>

                <div className="mb-3">
                  <label className="text-sm text-foreground block mb-1">Template Name</label>
                  <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full p-2 rounded border border-gray-300 bg-gray-100 dark:bg-[#0b1320] text-foreground dark:text-white" />
                </div>

                <div className="mb-3">
                  <div className="flex flex-col h-[300px]">
                    <MenuBar editor={editor} />
                    <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 text-base rounded-b bg-gray-100 dark:bg-[#07101a]">
                      <EditorContent editor={editor} className="h-[360px] p-4 bg-transparent text-black dark:text-white" />
                    </div>
                  </div>
                </div>

                  <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => { setShowCreateModal(false); setTemplateName(''); setTemplateContent(''); }} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
                  <button
                    ref={saveBtnRef}
                    onClick={async () => {
                      try {
                        if (!templateName.trim()) {
                          toast.error('Please enter a template name');
                          return;
                        }
                        if (!templateContent.trim()) {
                          toast.error('Please enter template content');
                          return;
                        }

                        const htmlBody = getFullHtmlContent(templateContent);
                        const post_data = { name: templateName, body: htmlBody, is_active: true } as any;
                        const { data, error } = await create_content_service({ table: 'email_templates', post_data });
                        if (error) throw error;
                        if (Array.isArray(data) && data.length > 0) {
                          const newTemplate = data[0];
                          setDbTemplates(prev => [newTemplate, ...prev]);
                          setSelectedTemplate(newTemplate.id as any);
                          setShowCreateModal(false);
                          setTemplateName('');
                          setTemplateContent('');
                          // reset editor content
                          editor?.commands.setContent('');
                          toast.success('Template created');
                        } else {
                          throw new Error('Failed to create template');
                        }
                      } catch (err: any) {
                        toast.error(err?.message || 'Failed to create template');
                      }
                    }}
                    className="px-3 py-2 rounded bg-blue-600 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>

          <div className="space-y-2 mt-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-foreground dark:text-white"
            >
              {t("EmailB_k4")}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name || ""}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("EmailB_k15")}
              className="w-full p-3 bg-[#f1f4f7] dark:bg-[#122136] text-sm rounded-md border border-input dark:border-gray-600 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {!dbTemplates.find(t => t.id === selectedTemplate) && (
            <div className="space-y-2 mt-2">
              <label
                htmlFor="price"
                className="text-sm font-medium text-foreground dark:text-white"
              >
                {t("EmailB_k5")}
              </label>
              <input
                type="text"
                id="price"
                name="price"
                placeholder={t("EmailB_k16")}
                className="w-full p-3 bg-[#f1f4f7] dark:bg-[#122136] text-sm rounded-md border border-input dark:border-gray-600 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-primary-500 focus:outline-none transition-colors"
                value={price || ""}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          )}

          <div className="mt-5">
            <button
              className="px-4 py-3 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              onClick={sendEmail}
            >
              {t("EmailB_k16")}
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-white dark:bg-[#0E1725] rounded-lg shadow-sm p-4">
          <h2 className="text-sm font-medium mb-4 text-foreground dark:text-white">
            {t("EmailB_k17")}
          </h2>
          <div className="border border-border bg-[#f1f4f7] dark:border-gray-600 rounded-md p-6 dark:bg-gray-800">
            <RenderTemplate />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailBroadcast;

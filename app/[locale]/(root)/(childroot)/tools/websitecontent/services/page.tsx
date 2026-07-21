"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import WebsiteContentLayout from "../Layout";
import { Select_Dropdown } from "@/components/Select_Dropdown";
import { Form_Component } from "@/components/Form_Component";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { TabContext } from "@/context";
import { toast } from "sonner";
import {
  fetchWebsiteServiceByIdAction,
  fetchWebsiteServicesAction,
  updateWebsiteServiceAction,
} from "./actions";

const service_fields = ["title", "description"];

const language_options = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
];

type ServiceFormData = {
  id?: number;
  title: string;
  description: string;
  image: string;
  icon: string;
};

const Services = () => {
  const [servicesList, setServicesList] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "es">("en");
  const [data, setData] = useState<ServiceFormData | null>(null);
  const [defaultData, setDefaultData] = useState<ServiceFormData | null>(null);
  const [isEdited, setIsEdited] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const { t } = useTranslation(translationConstant.WEBCONT);
  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Services");
  }, [setActiveTitle]);

  const loadServiceData = useCallback(
    async (serviceId: string, language: "en" | "es") => {
      if (!serviceId) {
        setData(null);
        setDefaultData(null);
        return;
      }

      const result = await fetchWebsiteServiceByIdAction(
        language,
        parseInt(serviceId, 10)
      );
      if (result.success && result.data) {
        const formData: ServiceFormData = {
          id: result.data.id,
          title: result.data.title || "",
          description: result.data.description || "",
          image: result.data.image || "",
          icon: result.data.icon || "",
        };
        setData(formData);
        setDefaultData(formData);
        setIsEdited(false);
      } else {
        toast.error(result.error || "Failed to load service");
        setData(null);
        setDefaultData(null);
      }
    },
    []
  );

  const loadServices = useCallback(
    async (language: "en" | "es") => {
      const result = await fetchWebsiteServicesAction(language);
      if (result.success && result.data) {
        const formatted = result.data.map((service) => ({
          label: service.title,
          value: service.id.toString(),
        }));
        setServicesList(formatted);

        const nextId = formatted[0]?.value || "";
        setSelectedService(nextId);
        if (nextId) {
          await loadServiceData(nextId, language);
        } else {
          setData(null);
          setDefaultData(null);
        }
      } else {
        toast.error(result.error || "Failed to load services");
        setServicesList([]);
        setSelectedService("");
        setData(null);
        setDefaultData(null);
      }
    },
    [loadServiceData]
  );

  useEffect(() => {
    loadServices(selectedLanguage);
  }, [selectedLanguage, loadServices]);

  const handleServiceChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);
    await loadServiceData(serviceId, selectedLanguage);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value as "en" | "es");
    setSelectedService("");
    setIsEdited(false);
  };

  const on_change_handle = (field: string, value: string) => {
    setIsEdited(true);
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const reset_fields = () => {
    setData(defaultData);
    setIsEdited(false);
  };

  const handle_update = async () => {
    if (!data?.id) {
      toast.error("Cannot update: No service selected");
      throw new Error("Cannot update: No service selected");
    }

    setUpdateLoading(true);
    try {
      const result = await updateWebsiteServiceAction(selectedLanguage, {
        id: data.id,
        title: data.title,
        description: data.description,
      });

      if (!result.success || !result.data?.id) {
        throw new Error(result.error || "Update failed — changes were not saved");
      }

      const saved: ServiceFormData = {
        id: result.data.id,
        title: result.data.title || "",
        description: result.data.description || "",
        image: result.data.image || "",
        icon: result.data.icon || "",
      };
      setDefaultData(saved);
      setData(saved);
      setIsEdited(false);

      setServicesList((prev) =>
        prev.map((item) =>
          item.value === String(saved.id)
            ? { ...item, label: saved.title }
            : item
        )
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <WebsiteContentLayout>
      <div className="px-2 sm:px-4 py-4 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white rounded-xl shadow-sm border border-gray-200 transition-colors duration-300">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 mb-6">
          <Select_Dropdown
            value={selectedService}
            label="Select Service"
            options_arr={servicesList}
            on_change_handle={handleServiceChange}
            required={true}
            bg_color="bg-[#F1F4F7] dark:bg-[#122139]"
          />
          <Select_Dropdown
            value={selectedLanguage}
            label={t("WebCont_k8")}
            options_arr={language_options}
            on_change_handle={handleLanguageChange}
            required={true}
            bg_color="bg-[#F1F4F7] dark:bg-[#0e1725]"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 mb-6"></div>

        <div className="w-full space-y-5">
          {data && (
            <Form_Component
              reset_fields={reset_fields}
              handle_update={handle_update}
              is_edited={isEdited}
              update_loading={updateLoading}
              data={data}
              render_list_fields={service_fields}
              on_change_handle={on_change_handle}
            />
          )}
        </div>
      </div>
    </WebsiteContentLayout>
  );
};

export default Services;

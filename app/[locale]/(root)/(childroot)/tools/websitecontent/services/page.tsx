"use client";
import React, { useContext, useEffect, useState } from "react";
import WebsiteContentLayout from "../Layout";
import { useSingleRowDataHandle } from "@/hooks/useSingleRowDataHandle";
import { Select_Dropdown } from "@/components/Select_Dropdown";
import { Form_Component } from "@/components/Form_Component";
import { langage_list_options } from "@/utils/list_options/dropdown_list_options";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { TabContext } from "@/context";
import { supabase } from "@/services/supabase";

const only_fields_to_render = {
  services: ["title", "description", "image", "icon"],
};

const Services = () => {
  const [servicesList, setServicesList] = useState<{ label: string; value: string }[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");

  const {
    default_data,
    data,
    is_edited,
    update_loading,
    on_change_handle,
    handle_update,
    reset_fields,
  } = useSingleRowDataHandle({
    default_selected_section: "services",
    table: selectedLanguage === "en" ? "services" : "services_es",
    required_fields: [],
  });

  const { t } = useTranslation(translationConstant.WEBCONT);
  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Services");
  }, [setActiveTitle]);

  // Fetch services based on selected language
  const fetchServices = async (language: string) => {
    const tableName = language === "en" ? "services" : "services_es";
    const { data, error } = await supabase
      .from(tableName)
      .select("id, title, description, image, icon")
      .order("created_at", { ascending: false });

    if (data) {
      const formattedServices = data.map((service) => ({
        label: service.title,
        value: service.id.toString(),
      }));
      setServicesList(formattedServices);
      if (formattedServices.length > 0) {
        setSelectedService(formattedServices[0].value);
      }
    }
  };

  useEffect(() => {
    fetchServices(selectedLanguage);
  }, [selectedLanguage]);

  const handleServiceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedService(selectedId);

    // Fetch the complete service data
    const tableName = selectedLanguage === "en" ? "services" : "services_es";
    
    // Convert selectedId to number for database query
    const numericId = parseInt(selectedId, 10);
    
    const { data: serviceData, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", numericId)
      .single();

    if (serviceData) {
      // CRITICAL: Make sure to include the ID in the form data
      // Convert numeric ID to string for the form handler
      on_change_handle("id", serviceData.id.toString());
      on_change_handle("title", serviceData.title);
      on_change_handle("description", serviceData.description);
      on_change_handle("image", serviceData.image);
      on_change_handle("icon", serviceData.icon || "");
    } else if (error) {
      console.error("Error fetching service data:", error);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    setSelectedService(""); // Reset selected service
    await fetchServices(newLanguage); // Fetch services for new language
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
            options_arr={langage_list_options}
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
              is_edited={is_edited}
              update_loading={update_loading}
              data={data}
              render_list_fields={only_fields_to_render.services}
              on_change_handle={on_change_handle}
            />
          )}
        </div>
      </div>
    </WebsiteContentLayout>
  );
};

export default Services;
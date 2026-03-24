"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Select_Dropdown } from "@/components/Select_Dropdown";
import { toast } from "sonner";
import { updateService, fetchServices, fetchServiceById } from "@/utils/services/servicesApi";

interface ServiceData {
  id?: number;
  title: string;
  description: string;
  image: string;
  icon?: string;
}

const ServicesManager = () => {
  const [servicesList, setServicesList] = useState<{ label: string; value: string }[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>("en");
  const [serviceData, setServiceData] = useState<ServiceData>({
    title: "",
    description: "",
    image: "",
    icon: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  const languageOptions = [
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" }
  ];

  // Load specific service data
  const loadServiceData = useCallback(async (serviceId: string, language: 'en' | 'es') => {
    try {
      const result = await fetchServiceById(language, parseInt(serviceId));
      if (result.success && result.data) {
        setServiceData({
          id: result.data.id,
          title: result.data.title || "",
          description: result.data.description || "",
          image: result.data.image || "",
          icon: result.data.icon || ""
        });
        setIsEdited(false);
      }
    } catch (error) {
      console.error("Error loading service data:", error);
      toast("Error loading service data");
    }
  }, []);

  // Fetch services list
  const loadServices = useCallback(async (language: 'en' | 'es') => {
    try {
      const result = await fetchServices(language);
      if (result.success && result.data) {
        const formattedServices = result.data.map((service: any) => ({
          label: service.title,
          value: service.id.toString()
        }));
        setServicesList(formattedServices);
        
        if (formattedServices.length > 0) {
          setSelectedService(formattedServices[0].value);
          await loadServiceData(formattedServices[0].value, language);
        }
      }
    } catch (error) {
      console.error("Error loading services:", error);
      toast("Error loading services");
    }
  }, [loadServiceData]);

  // Handle service selection change
  const handleServiceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);
    await loadServiceData(serviceId, selectedLanguage);
  };

  // Handle language change
  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value as 'en' | 'es';
    setSelectedLanguage(language);
    await loadServices(language);
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof ServiceData, value: string) => {
    setServiceData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsEdited(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!serviceData.id) return;
    
    setIsLoading(true);
    try {
      const result = await updateService(selectedLanguage, serviceData);
      if (result.success) {
        toast("Service updated successfully");
        setIsEdited(false);
      } else {
        toast(result.error || "Error updating service");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast("Error updating service");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices(selectedLanguage);
  }, [loadServices, selectedLanguage]);

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4">
        <Select_Dropdown
          value={selectedService}
          label="Select Service"
          options_arr={servicesList}
          on_change_handle={handleServiceChange}
          required={true}
        />
        <Select_Dropdown
          value={selectedLanguage}
          label="Language"
          options_arr={languageOptions}
          on_change_handle={handleLanguageChange}
          required={true}
        />
      </div>

      {serviceData.id && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={serviceData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={serviceData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full p-2 border rounded h-32"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="text"
              value={serviceData.image}
              onChange={(e) => handleFieldChange('image', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <input
              type="text"
              value={serviceData.icon || ""}
              onChange={(e) => handleFieldChange('icon', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!isEdited || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ServicesManager;
"use client";
import React, { useState, useEffect } from "react";
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

  // Fetch services list
  const loadServices = async (language: 'en' | 'es') => {
    tr
"use server";

import { getServiceRoleSupabase } from "@/utils/supabase/service-role-client";

export type WebsiteServicePayload = {
  id: number;
  title: string;
  description: string;
};

export async function updateWebsiteServiceAction(
  language: "en" | "es",
  serviceData: WebsiteServicePayload
) {
  if (!serviceData?.id) {
    return { success: false as const, error: "Service ID is required" };
  }

  const tableName = language === "en" ? "services" : "services_es";

  try {
    const supabaseAdmin = getServiceRoleSupabase();
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update({
        title: serviceData.title,
        description: serviceData.description,
      })
      .eq("id", serviceData.id)
      .select("id, title, description, image, icon, created_at");

    if (error) {
      return { success: false as const, error: error.message };
    }

    if (!data?.length) {
      return {
        success: false as const,
        error: `No row updated in ${tableName} for id ${serviceData.id}`,
      };
    }

    // Re-read to confirm persistence
    const { data: verified, error: verifyError } = await supabaseAdmin
      .from(tableName)
      .select("id, title, description, image, icon, created_at")
      .eq("id", serviceData.id)
      .maybeSingle();

    if (verifyError || !verified || verified.title !== serviceData.title) {
      return {
        success: false as const,
        error: "Update did not persist — please try again",
      };
    }

    return { success: true as const, data: verified };
  } catch (e: any) {
    return {
      success: false as const,
      error: e?.message || "Failed to update service",
    };
  }
}

export async function fetchWebsiteServicesAction(language: "en" | "es") {
  const tableName = language === "en" ? "services" : "services_es";
  try {
    const supabaseAdmin = getServiceRoleSupabase();
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select("id, title, description, image, icon, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, data: data || [] };
  } catch (e: any) {
    return {
      success: false as const,
      error: e?.message || "Failed to fetch services",
    };
  }
}

export async function fetchWebsiteServiceByIdAction(
  language: "en" | "es",
  id: number
) {
  const tableName = language === "en" ? "services" : "services_es";
  try {
    const supabaseAdmin = getServiceRoleSupabase();
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select("id, title, description, image, icon, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, data };
  } catch (e: any) {
    return {
      success: false as const,
      error: e?.message || "Failed to fetch service",
    };
  }
}

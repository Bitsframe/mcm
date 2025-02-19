"use server";
import { supabase } from "@/services/supabase";

export async function getUserEmail(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("allpatients") // Replace 'user' with the actual name of your table
      .select(
        "email,treatmenttype,firstname,gender,onsite,locationid,Locations (title)"
      );


    return data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
}

export async function getServices(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("services") 
      .select("title");

    console.log(data);

    return data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
}
export async function getLocations(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("Locations") // Replace 'user' with the actual name of your table
      .select("title");

    console.log(data);

    return data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
}

export async function getUserLocations(): Promise<any> {
  try {
    const { data, error } = await supabase.from("allpatients").select(`
        locationid,
        Locations (title)  // Assuming 'location_name' is a column in the 'locations' table
      `);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
}
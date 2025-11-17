"use server";
import { supabase } from "@/services/supabase";




export async function getUserEmail(): Promise<any[]> {
  try {
    const pageSize = 1000;
    let allRows: any[] = [];

    // First get the total row count
    const { count, error: countError } = await supabase
      .from("allpatients")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error getting total count:", countError);
      return [];
    }

    const totalRows = count || 0;
    const totalPages = Math.ceil(totalRows / pageSize);

    // Fetch in batches
    for (let i = 0; i < totalPages; i++) {
      const from = i * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("allpatients")
        .select(
          "email,treatmenttype,firstname,gender,onsite,phone,locationid,Locations (title)"
        )
        .range(from, to);

      if (error) {
        console.error(`Error fetching rows ${from}-${to}:`, error);
        break;
      }

      allRows = allRows.concat(data || []);
    }

    console.log(`Fetched ${allRows.length} rows (total in DB: ${totalRows})`);
    return allRows;
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
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
      .from("Locations")
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
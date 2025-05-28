import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Step 1: Fetch profile_ids and location_ids from user_locations table
    const { data: userLocations, error: locationsError } = await supabase
      .from("user_locations")
      .select("profile_id, location_id");

    if (locationsError) {
      throw new Error(
        `Error fetching user locations: ${locationsError.message}`
      );
    }

    // Extract profile IDs and location IDs from the result
    const profileIds = userLocations.map((location) => location.profile_id);
    const locationIds = userLocations.map((location) => location.location_id);

    // Step 2: Fetch profiles using the profile IDs
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role_id, created_at, active")
      .in("id", profileIds);

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    // Step 3: Extract role IDs from the profiles
    const extractedRoleIds = profiles.map((profile) => profile.role_id);

    // Step 4: Fetch user permissions based on role IDs
    const { data: userPermissions, error: permissionsError } = await supabase
      .from("user_permissions")
      .select("*")
      .in("permissions", [10]);

    if (permissionsError) {
      throw new Error(
        `Error fetching user permissions: ${permissionsError.message}`
      );
    }

    // Step 5: Extract permission IDs from the user permissions
    const extractedPermissionsIds = userPermissions 
      ? userPermissions.map((permission) => permission.permissions)
      : [];
    
    // Step 6: Fetch permission details from permissions table
    const { data: permissionDetails, error: permissionDetailsError } = await supabase
      .from("permissions")
      .select("*")
      .in("id", extractedPermissionsIds.flat());
      
    if (permissionDetailsError) {
      throw new Error(
        `Error fetching permission details: ${permissionDetailsError.message}`
      );
    }

    return NextResponse.json({
      success: true,
      profiles,
      roleIds: extractedRoleIds,
      locationIds: locationIds,
      permissions: userPermissions || [],
      permissionIds: extractedPermissionsIds,
      permissionDetails: permissionDetails || [],
    });
  } catch (error: any) {
    console.error("Error in send-reports route:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

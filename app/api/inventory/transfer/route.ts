import { NextRequest, NextResponse } from "next/server";
import supabase from "@/utils/supabaseClient";

export const POST = async (request: NextRequest) => {
  try {
    const { from_location_id, to_location_id, product_id, units } = await request.json();

    if (!from_location_id || !to_location_id || !product_id || !units) {
      return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
    }
    if (from_location_id === to_location_id) {
      return NextResponse.json({ success: false, message: "From and To locations must be different." }, { status: 400 });
    }
    if (units <= 0) {
      return NextResponse.json({ success: false, message: "Units must be greater than 0." }, { status: 400 });
    }

    // Fetch inventory for from_location
    const { data: fromInv, error: fromInvError } = await supabase
      .from("inventory")
      .select("inventory_id, quantity")
      .eq("product_id", product_id)
      .eq("location_id", from_location_id)
      .single();

      console.log({
        fromInv,
        fromInvError,
        from_location_id,
        product_id,
        units,
      })

    if (fromInvError || !fromInv) {
      return NextResponse.json({ success: false, message: "No inventory found at source location." }, { status: 404 });
    }
    if (fromInv.quantity < units) {
      return NextResponse.json({ success: false, message: `Cannot transfer more than available units (${fromInv.quantity})` }, { status: 400 });
    }

    // Fetch inventory for to_location (may not exist)
    const { data: toInv, error: toInvError } = await supabase
      .from("inventory")
      .select("inventory_id, quantity")
      .eq("product_id", product_id)
      .eq("location_id", to_location_id)
      .maybeSingle();

    // Start transfer: deduct from source, add to destination
    // 1. Update from_location
    const { error: updateFromError } = await supabase
      .from("inventory")
      .update({ quantity: fromInv.quantity - units })
      .eq("inventory_id", fromInv.inventory_id);
    if (updateFromError) {
      return NextResponse.json({ success: false, message: "Failed to update source inventory." }, { status: 500 });
    }

    // 2. Update or insert to_location
    if (toInv && toInv.inventory_id) {
      // Update existing
      const { error: updateToError } = await supabase
        .from("inventory")
        .update({ quantity: toInv.quantity + units })
        .eq("inventory_id", toInv.inventory_id);
      if (updateToError) {
        return NextResponse.json({ success: false, message: "Failed to update destination inventory." }, { status: 500 });
      }
    } else {
      // Insert new
      const { error: insertToError } = await supabase
        .from("inventory")
        .insert({ product_id, location_id: to_location_id, quantity: units });
      if (insertToError) {
        return NextResponse.json({ success: false, message: "Failed to create destination inventory." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Units transferred successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}; 
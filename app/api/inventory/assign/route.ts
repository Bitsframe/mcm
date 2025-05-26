import { NextRequest, NextResponse } from "next/server";
import supabase from "@/utils/supabaseClient";

export const POST = async (request: NextRequest) => {
  try {
    let { product_id, location_id, quantity } = await request.json();

    // Ensure location_id is always an array
    if (!Array.isArray(location_id)) {
      location_id = [location_id];
    }

    // Fetch product info
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock, unlimited")
      .eq("product_id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    // For limited products, check total quantity
    if (!product.unlimited) {
      const totalToAssign = quantity * location_id.length;
      if (product.stock < totalToAssign) {
        return NextResponse.json({ success: false, message: "Not enough stock" }, { status: 400 });
      }
    }

    // Fetch all relevant inventory rows in one call
    const { data: inventories, error: invFetchError } = await supabase
      .from("inventory")
      .select("location_id, quantity")
      .eq("product_id", product_id)
      .in("location_id", location_id);

    if (invFetchError) {
      return NextResponse.json({ success: false, message: "Failed to fetch inventory" }, { status: 500 });
    }

    // Build a map of current quantities
    const quantityMap = new Map();
    if (inventories) {
      for (const inv of inventories) {
        quantityMap.set(inv.location_id, inv.quantity || 0);
      }
    }

    const toUpdate = [];
    const toInsert = [];

    for (const locId of location_id) {
      if (quantityMap.has(locId)) {
        // Update existing
        toUpdate.push({
          product_id,
          location_id: locId,
          quantity: quantityMap.get(locId) + quantity,
        });
      } else {
        // Insert new
        toInsert.push({
          product_id,
          location_id: locId,
          quantity: quantity,
        });
      }
    }

    // Update existing inventory rows
    if (toUpdate.length > 0) {
      for (const row of toUpdate) {
        const { error: updateError } = await supabase
          .from("inventory")
          .update({ quantity: row.quantity })
          .eq("product_id", row.product_id)
          .eq("location_id", row.location_id);
        if (updateError) {
          return NextResponse.json({ success: false, message: "Failed to update inventory" }, { status: 500 });
        }
      }
    }

    // Insert new inventory rows
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("inventory")
        .insert(toInsert);
      if (insertError) {
        return NextResponse.json({ success: false, message: "Failed to insert inventory" }, { status: 500 });
      }
    }

    // Decrease stock if not unlimited (only once, by total assigned)
    if (!product.unlimited) {
      const totalToAssign = quantity * location_id.length;
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: product.stock - totalToAssign })
        .eq("product_id", product_id);

      if (updateError) {
        return NextResponse.json({ success: false, message: "Failed to update product stock" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Inventory assigned successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}; 
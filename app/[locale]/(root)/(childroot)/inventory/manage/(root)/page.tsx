"use client";

import { InventoryView } from "@/components/Inventory/InventoryView";

/** Stock for the location picked in the sidebar. The view itself lives in components/Inventory so Warehouse can show any location. */
export default function InventoryPage() {
  return <InventoryView />;
}

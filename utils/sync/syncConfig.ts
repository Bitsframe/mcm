/**
 * Database Sync Configuration
 * Centralized configuration for table sync settings
 */

export interface TableSyncConfig {
  enabled: boolean;
  columns?: string[]; // Optional: specify which columns to sync
  primaryKey?: string; // Default: 'id'
  description?: string;
}

export const SYNC_TABLES: Record<string, TableSyncConfig> = {
  forms: {
    enabled: true,
    columns: ['id', 'name', 'is_active', 'created_at', 'content'],
    primaryKey: 'id',
    description: 'Medical forms'
  },
  pharmacy: {
    enabled: true, // ✅ Enabled - syncing to child DB
    columns: [
      'id', 'name', 'address', 'city', 'state', 'zip_code',
      'phone_number', 'spanish_language_service', 'disabled_access',
      'license_status', 'opening_hours', 'delivers',
      'delivered_to_status_updated', 'is_active'
    ],
    primaryKey: 'id',
    description: 'Pharmacy data'
  },
  allpatients: {
    enabled: false, // Disabled - not syncing to child DB yet
    columns: [
      'id', 'firstname', 'lastname', 'email', 'phone',
      'date_of_birth', 'gender', 'address', 'city', 'state',
      'zip_code', 'location_id', 'created_at', 'is_active'
    ],
    primaryKey: 'id',
    description: 'Patient records'
  },
  Locations: {
    enabled: false, // Disabled - not syncing to child DB yet
    columns: [
      'id', 'name', 'address', 'city', 'state', 'zip_code',
      'phone', 'email', 'is_active', 'created_at'
    ],
    primaryKey: 'id',
    description: 'Location data'
  }
};

/**
 * Get list of enabled tables
 */
export function getEnabledTables(): string[] {
  return Object.keys(SYNC_TABLES).filter(table => SYNC_TABLES[table].enabled);
}

/**
 * Check if a table is enabled for sync
 */
export function isTableEnabled(table: string): boolean {
  return SYNC_TABLES[table]?.enabled || false;
}

/**
 * Get configuration for a specific table
 */
export function getTableConfig(table: string): TableSyncConfig | null {
  return SYNC_TABLES[table] || null;
}

/**
 * Filter data to only include configured columns
 */
export function filterColumns(table: string, data: any): any {
  const config = getTableConfig(table);
  
  // If no columns specified, return all data
  if (!config || !config.columns) {
    return data;
  }

  // Filter to only include configured columns
  const filtered: any = {};
  config.columns.forEach(col => {
    if (data.hasOwnProperty(col)) {
      filtered[col] = data[col];
    }
  });
  
  return filtered;
}
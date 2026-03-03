import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnabledTables, isTableEnabled, filterColumns } from './syncConfig';

/**
 * Simple Direct Database Sync Service
 * Follows best practices: Singleton pattern, error handling, logging, modularity
 */

interface SyncConfig {
  enabled: boolean;
  tables: string[];
}

export class DirectDbSync {
  private static instance: DirectDbSync;
  private childSupabase: SupabaseClient | null = null;
  private config: SyncConfig;
  
  private constructor() {
    // Initialize configuration from syncConfig
    this.config = {
      enabled: this.isConfigured(),
      tables: getEnabledTables()
    };

    // Initialize child database connection only if configured
    if (this.config.enabled) {
      this.childSupabase = createClient(
        process.env.CHILD_SUPABASE_URL!,
        process.env.CHILD_SUPABASE_SERVICE_ROLE_KEY!
      );
      console.log('[DB Sync] ✅ Child database connection initialized');
      console.log('[DB Sync] 📋 Enabled tables:', this.config.tables.join(', '));
    } else {
      console.log('[DB Sync] ⚠️ Child database not configured - sync disabled');
    }
  }
  
  static getInstance(): DirectDbSync {
    if (!DirectDbSync.instance) {
      DirectDbSync.instance = new DirectDbSync();
    }
    return DirectDbSync.instance;
  }

  /**
   * Sync CREATE operation to child database
   * @param table - Table name to sync
   * @param data - Data to insert
   */
  async syncCreate(table: string, data: any): Promise<void> {
    if (!this.shouldSync(table)) return;

    try {
      // Filter data to only include configured columns
      let filteredData = filterColumns(table, data);
      
      // Remove ID for CREATE operations (let child DB auto-generate)
      const { id, ...dataWithoutId } = filteredData;
      
      console.log(`[DB Sync] Creating record in child ${table} table`);
      
      const { error } = await this.childSupabase!
        .from(table)
        .insert(dataWithoutId)
        .select();
        
      if (error) throw error;
      console.log(`[DB Sync] ✅ Created record in child ${table} table`);
      
    } catch (error: any) {
      this.handleError('CREATE', table, error);
    }
  }

  /**
   * Sync UPDATE operation to child database
   * @param table - Table name to sync
   * @param id - Record ID to update
   * @param data - Data to update
   */
  async syncUpdate(table: string, id: string | number, data: any): Promise<void> {
    if (!this.shouldSync(table)) return;

    try {
      // Filter data to only include configured columns
      let filteredData = filterColumns(table, data);
      
      // Remove ID from update data (can't update identity columns)
      const { id: _, ...dataWithoutId } = filteredData;
      
      console.log(`[DB Sync] Updating record in child ${table} table`);
      
      const { error } = await this.childSupabase!
        .from(table)
        .update(dataWithoutId)
        .eq('id', id);
        
      if (error) throw error;
      console.log(`[DB Sync] ✅ Updated record in child ${table} table`);
      
    } catch (error: any) {
      this.handleError('UPDATE', table, error);
    }
  }

  /**
   * Sync DELETE operation to child database
   * @param table - Table name to sync
   * @param id - Record ID to delete
   */
  async syncDelete(table: string, id: string | number): Promise<void> {
    if (!this.shouldSync(table)) return;

    try {
      console.log(`[DB Sync] Deleting record from child ${table} table`);
      
      const { error } = await this.childSupabase!
        .from(table)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      console.log(`[DB Sync] ✅ Deleted record from child ${table} table`);
      
    } catch (error: any) {
      this.handleError('DELETE', table, error);
    }
  }

  /**
   * Batch sync multiple records (for bulk operations)
   * @param table - Table name to sync
   * @param data - Array of records to sync
   */
  async syncBatch(table: string, data: any[]): Promise<void> {
    if (!this.shouldSync(table) || !data || data.length === 0) return;

    try {
      // Filter each record to only include configured columns
      const filteredData = data.map(record => filterColumns(table, record));
      
      console.log(`[DB Sync] Batch creating ${data.length} records in child ${table} table`);
      
      const { error } = await this.childSupabase!
        .from(table)
        .upsert(filteredData, { onConflict: 'id' });
        
      if (error) throw error;
      console.log(`[DB Sync] ✅ Batch created ${data.length} records in child ${table} table`);
      
    } catch (error: any) {
      this.handleError('BATCH_CREATE', table, error);
    }
  }

  /**
   * Check if sync should be performed for a table
   * @param table - Table name to check
   * @returns boolean indicating if sync should proceed
   */
  private shouldSync(table: string): boolean {
    if (!this.config.enabled) {
      console.log(`[DB Sync] Sync disabled - skipping ${table}`);
      return false;
    }

    if (!isTableEnabled(table)) {
      console.log(`[DB Sync] Table ${table} not configured for sync - skipping`);
      return false;
    }

    return true;
  }

  /**
   * Check if child database is configured
   * @returns boolean indicating if credentials are present
   */
  private isConfigured(): boolean {
    return !!(
      process.env.CHILD_SUPABASE_URL && 
      process.env.CHILD_SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Centralized error handling
   * @param operation - Operation type
   * @param table - Table name
   * @param error - Error object
   */
  private handleError(operation: string, table: string, error: any): void {
    console.error(`[DB Sync] ❌ Failed to ${operation} in child ${table}:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });

    // In production, you might want to:
    // 1. Send to error tracking service (Sentry, etc.)
    // 2. Store in error log table
    // 3. Send alert to monitoring system
  }

  /**
   * Get sync configuration status
   * @returns Configuration status object
   */
  getStatus(): {
    enabled: boolean;
    configured: boolean;
    tables: string[];
    childDbUrl: string;
  } {
    return {
      enabled: this.config.enabled,
      configured: this.isConfigured(),
      tables: this.config.tables,
      childDbUrl: process.env.CHILD_SUPABASE_URL || 'Not configured'
    };
  }

  /**
   * Enable/disable sync at runtime
   * @param enabled - Whether to enable sync
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled && this.isConfigured();
    console.log(`[DB Sync] Sync ${this.config.enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const dbSync = DirectDbSync.getInstance();
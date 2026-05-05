// Services API utility functions using the secret key route

interface ServiceData {
  id?: number;
  title: string;
  description: string;
  image: string;
  icon?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Insert a new service using the admin API
 */
export async function insertService(language: 'en' | 'es', serviceData: Omit<ServiceData, 'id'>): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'insert',
        language,
        serviceData
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to insert service');
    }

    return result;
  } catch (error: any) {
    console.error('Insert service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to insert service'
    };
  }
}

/**
 * Update an existing service using the admin API
 */
export async function updateService(language: 'en' | 'es', serviceData: ServiceData): Promise<ApiResponse> {
  try {
    if (!serviceData.id) {
      throw new Error('Service ID is required for update');
    }

    const response = await fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        language,
        serviceData
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update service');
    }

    return result;
  } catch (error: any) {
    console.error('Update service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update service'
    };
  }
}

/**
 * Fetch services using the admin API
 */
export async function fetchServices(language: 'en' | 'es'): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/services?language=${language}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch services');
    }

    return result;
  } catch (error: any) {
    console.error('Fetch services error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch services'
    };
  }
}

/**
 * Fetch a specific service by ID using the admin API
 */
export async function fetchServiceById(language: 'en' | 'es', id: number): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/services?language=${language}&id=${id}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch service');
    }

    return result;
  } catch (error: any) {
    console.error('Fetch service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch service'
    };
  }
}

/**
 * Delete a service using the admin API
 */
export async function deleteService(language: 'en' | 'es', id: number): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/services?id=${id}&language=${language}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete service');
    }

    return result;
  } catch (error: any) {
    console.error('Delete service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete service'
    };
  }
}

/**
 * Upsert service (insert if new, update if exists)
 */
export async function upsertService(language: 'en' | 'es', serviceData: ServiceData): Promise<ApiResponse> {
  if (serviceData.id) {
    return updateService(language, serviceData);
  } else {
    return insertService(language, serviceData);
  }
}
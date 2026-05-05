import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleSupabase } from '@/utils/supabase/service-role-client';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getServiceRoleSupabase();
    const body = await request.json();
    const { action, language, serviceData } = body;

    // Validate required fields
    if (!action || !language || !serviceData) {
      return NextResponse.json(
        { error: 'Missing required fields: action, language, serviceData' },
        { status: 400 }
      );
    }

    // Determine table name based on language
    const tableName = language === 'en' ? 'services' : 'services_es';

    let result;

    if (action === 'insert') {
      // Insert new service
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .insert([{
          title: serviceData.title,
          description: serviceData.description,
          image: serviceData.image,
          icon: serviceData.icon || null
        }])
        .select();

      if (error) {
        console.error('Insert error:', error);
        return NextResponse.json(
          { error: `Failed to insert service: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;

    } else if (action === 'update') {
      // Update existing service
      if (!serviceData.id) {
        return NextResponse.json(
          { error: 'Service ID is required for update operation' },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from(tableName)
        .update({
          title: serviceData.title,
          description: serviceData.description,
          image: serviceData.image,
          icon: serviceData.icon || null
        })
        .eq('id', serviceData.id)
        .select();

      if (error) {
        console.error('Update error:', error);
        return NextResponse.json(
          { error: `Failed to update service: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "insert" or "update"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Service ${action}ed successfully`,
      data: result
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getServiceRoleSupabase();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'en';
    const id = searchParams.get('id');

    // Determine table name based on language
    const tableName = language === 'en' ? 'services' : 'services_es';

    // If ID is provided, get specific service
    if (id) {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('id, title, description, image, icon, created_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Fetch error:', error);
        return NextResponse.json(
          { error: `Failed to fetch service: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data
      });
    } else {
      // Otherwise get all services ordered by creation date
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('id, title, description, image, icon, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        return NextResponse.json(
          { error: `Failed to fetch services: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data
      });
    }

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getServiceRoleSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const language = searchParams.get('language') || 'en';

    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required for delete operation' },
        { status: 400 }
      );
    }

    // Determine table name based on language
    const tableName = language === 'en' ? 'services' : 'services_es';

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: `Failed to delete service: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
      data: data
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
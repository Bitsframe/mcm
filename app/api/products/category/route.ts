import { NextRequest, NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
    const supabase = supabaseCreateClient();

    const searchParams = request.nextUrl.searchParams
    const locationId = +searchParams.get('locationId')!

    try {


        let query = supabase

            .from('inventory')
            .select('*,products(category_id, product_name,archived, categories(category_name, category_id, archived))')
            .eq('location_id', locationId)
            .neq('quantity', 0)
            .eq('archived', false)
            .not('products', 'is', null)
            .not('products.categories', 'is', null)
            .eq('products.categories.archived', false)
            .not('products', 'is', null)


        const { data, error }: any = await query;
        if (error) {
            console.log(error.message);
            throw new Error(error.message);
        }

        const uniqueItemsMap = new Map();

        data.forEach((item:any) => {
          const categoryId = item.products?.category_id;
          if (categoryId && !uniqueItemsMap.has(categoryId)) {
            uniqueItemsMap.set(categoryId, item.products.categories); // Store whole object
          }
        });
      
        const uniqueItems = Array.from(uniqueItemsMap.values());



        return NextResponse.json(
            {
                success: true,
                data: uniqueItems
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('User details error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Internal Server Error'
            },
            { status: 500 }
        );
    }
};
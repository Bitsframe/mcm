import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { NextResponse } from "next/server";
export const POST = async (req: Request) => {
    const { promocode, patientid } = await req.json();

    try {
        // Check if the promocode exists in the promocodes table
        const promocodeData: any = await fetch_content_service({
            table: 'promocodes',
            matchCase: { key: 'code', value: promocode },
        });

        if (!promocodeData.length) {
            return NextResponse.json(
                { success: false, message: 'Invalid Promo Code' },
                { status: 400 }
            );
        }

        const promocodeId = promocodeData[0].id;
        const promoTypeId: any = promocodeData[0].type;

        // Fetch promo type details
        const promoTypeData = await fetch_content_service({
            table: 'promotype',
            matchCase: { key: 'id', value: promoTypeId },
        });

        const promoTypeDetails: any = promoTypeData[0]

        if (!promoTypeData.length || !promoTypeData[0].active || new Date(promoTypeDetails.expiry) < new Date()) {
            return NextResponse.json(
                { success: false, message: 'Promo code is expired or inactive' },
                { status: 400 }
            );
        }

        if (!promoTypeDetails.multiple) {
            if (promocodeData.assign !== patientid) {
                return NextResponse.json(
                    { success: false, message: 'Invalid Promo Code' },
                    { status: 400 }
                );
            }
        }

        // Check if the promocode has been used
        const promoUsage = await fetch_content_service({
            table: 'promousage',
            matchCase: { key: 'promocodeid', value: promocodeId },
        });

        const hasBeenUsed = promoUsage.some(usage => usage.patientid === Number(patientid)); // Ensure type matching
        if (hasBeenUsed) {
            return NextResponse.json(
                { success: false, message: 'Promo code has already been used' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            data: { discount: promoTypeData[0].percentage, promocodeId },
            message: 'Promo code applied successfully',
        }, { status: 200 });

    } catch (error) {
        console.error('Error:', error); // Log the error for debugging
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

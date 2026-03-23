import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: Request) {
    try {
        const session: any = await getServerSession(authOptions);
        const token = session?.accessToken;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Use the BASE_URL from environment for proper consistent calls
        const magentoUrl = `${BASE_URL}/my-orders/filter-options`;

        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'platform': 'web',
            },
            cache: 'no-store',
        });

        const rawText = await response.text();

        let data: any;
        try {
            data = JSON.parse(rawText);
        } catch {
            return NextResponse.json(
                { message: 'Invalid response from server' },
                { status: 502 }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || `Magento returned ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[my-orders-filters] Catch error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error fetching filter options' },
            { status: 500 }
        );
    }
}

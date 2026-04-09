import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(request: Request) {
    try {
        const BASE_URL = getBaseUrl(request);
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const magentoUrl = `${BASE_URL}/orders/export`;

        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'platform': 'web',
            },
            cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || `Magento returned ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[orders-export] Catch error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error exporting orders' },
            { status: 500 }
        );
    }
}

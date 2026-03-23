import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pageSize = searchParams.get('pageSize') || '10';
        const currentPage = searchParams.get('currentPage') || '1';
        const status = searchParams.get('status');
        const orderNumber = searchParams.get('orderNumber');
        const companyCode = searchParams.get('companyCode');

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use the BASE_URL from environment for proper consistent calls
        let magentoUrl = `${BASE_URL}/my-orders?pageSize=${pageSize}&currentPage=${currentPage}`;

        if (status && status !== 'All') {
            magentoUrl += `&orderStatus=${encodeURIComponent(status)}`;
        }

        if (companyCode && companyCode !== 'All') {
            magentoUrl += `&companyCode=${encodeURIComponent(companyCode)}`;
        }

        if (orderNumber && orderNumber !== 'All' && orderNumber.trim() !== '') {
            // Correct the parameter name and ensure it's properly encoded
            magentoUrl += `&orderNumber=${encodeURIComponent(orderNumber)}`;
        }

        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
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
                { message: 'Invalid response from server', items: [], total_count: 0 },
                { status: 502 }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || `Magento returned ${response.status}`, items: [], total_count: 0 },
                { status: response.status }
            );
        }

        // Magento returns { orders: [...], total_count: N }
        let items: any[] = [];
        let totalCount = 0;

        if (Array.isArray(data)) {
            items = data;
            totalCount = data.length;
        } else if (data.orders && Array.isArray(data.orders)) {
            items = data.orders;
            totalCount = data.total_count ?? items.length;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
            totalCount = data.total_count ?? items.length;
        }

        return NextResponse.json({
            items,
            total_count: totalCount,
        });

    } catch (error: any) {
        console.error('[my-orders] Catch error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error fetching orders', items: [], total_count: 0 },
            { status: 500 }
        );
    }
}

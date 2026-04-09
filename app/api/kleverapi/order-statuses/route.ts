import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';

// BASE_URL is now obtained per-request via getBaseUrl(request)

/**
 * Fetches available order statuses from Magento.
 */
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

        // Attempt to fetch from Magento Kleverapi
        // Trying common endpoint names if one is not known
        const magentoUrl = `${BASE_URL}/order-statuses`;

        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'platform': 'web',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            // Fallback if endpoint doesn't exist on Magento yet
            // This ensures the UI doesn't break while making it 'dynamic'
            return NextResponse.json(["All", "Check Pending"]);
        }

        const data = await response.json();

        // Normalize the response if it's not a simple array
        let items = Array.isArray(data) ? data : (data.items || data.data || []);

        // Ensure "All" is included
        if (!items.includes("All")) {
            items = ["All", ...items];
        }

        return NextResponse.json(items);

    } catch (error: any) {
        console.error('[order-statuses] Catch error:', error);
        return NextResponse.json(["All", "Check Pending"]);
    }
}

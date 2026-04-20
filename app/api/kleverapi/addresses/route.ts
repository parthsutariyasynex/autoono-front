import { NextResponse } from 'next/server';
import { getBaseUrl, getGlobalBaseUrl } from '@/lib/api/magento-url';
import { getRequestToken } from '@/lib/api/auth-helper';

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(request: Request) {
    try {
        const BASE_URL = getBaseUrl(request);
        const token = await getRequestToken(request);

        if (!token) {
            console.warn('[API ROUTE] Addresses: No token found');
            return NextResponse.json(
                { message: 'Authentication required. Authorization header is missing.' },
                { status: 401 }
            );
        }

        const magentoUrl = `${BASE_URL}/addresses`;
        console.log(`[API ROUTE] Fetching Customer Addresses from: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'platform': 'web',
            },
            cache: 'no-store',
        });

        let data = await response.json();

        // --- FALLBACK STRATEGY ---
        if (response.status === 404 || (data && data.message && data.message.toLowerCase().includes('not found'))) {
            const globalBase = getGlobalBaseUrl(request);
            const globalUrl = `${globalBase}/addresses`;
            if (globalUrl !== magentoUrl) {
                console.log(`[API ROUTE] Addresses not found at ${magentoUrl}. Retrying global: ${globalUrl}`);
                const fallbackResponse = await fetch(globalUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'platform': 'web',
                    },
                    cache: 'no-store',
                });
                if (fallbackResponse.ok) {
                    data = await fallbackResponse.json();
                    return NextResponse.json(data);
                }
            }
        }

        if (!response.ok) {
            console.error(`[API ROUTE ERROR] Addresses Magento returned ${response.status}:`, JSON.stringify(data).substring(0, 500));
        }

        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('[API ROUTE ERROR] Addresses GET Catch:', error);
        return NextResponse.json(
            { message: error.message || 'Server-side error fetching addresses.' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const BASE_URL = getBaseUrl(request);
        const authHeader = request.headers.get('Authorization');
        const body = await request.json();

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/addresses`;
        console.log(`[API ROUTE] Adding Customer Address at: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'platform': 'web',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('[API ROUTE ERROR] Addresses POST Catch:', error);
        return NextResponse.json(
            { message: 'Server-side error adding address.' },
            { status: 500 }
        );
    }
}

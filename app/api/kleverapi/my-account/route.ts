import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';
import { getRequestToken } from '@/lib/api/auth-helper';

export async function GET(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        const token = await getRequestToken(request);

        if (!token) {
            return NextResponse.json(
                { message: 'Authentication required.' },
                { status: 401 }
            );
        }

        const magentoUrl = `${baseUrl}/my-account`;
        console.log(`[API ROUTE] Fetching Customer Info from: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'platform': 'web',
            },
            cache: 'no-store',
        });

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = { message: await response.text() };
        }

        if (!response.ok) {
            console.error(`[API ROUTE ERROR] Magento returned ${response.status}:`, data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[API ROUTE ERROR] My Account GET Catch:', error);
        return NextResponse.json(
            { message: error.message || 'Server-side error fetching account details.' },
            { status: 500 }
        );
    }
}

/**
 * Optional: Handle POST requests for updating profile data
 */
export async function POST(request: Request) {
    try {
        const baseUrl = getBaseUrl(request);
        const authHeader = request.headers.get('Authorization');
        const body = await request.json();

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        // Use normalized URL to match standard REST path

        const magentoUrl = `${baseUrl}/my-account`;
        console.log(`[API ROUTE] Updating Customer Info at: ${magentoUrl}`);

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
        console.error('[API ROUTE ERROR] My Account POST:', error);
        return NextResponse.json(
            { message: 'Server-side error updating account details.' },
            { status: 500 }
        );
    }
}

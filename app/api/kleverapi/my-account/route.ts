import { NextResponse } from 'next/server';



export async function GET(request: Request) {
    try {
        // 1. Get the customer token from the incoming request headers
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json(
                { message: 'Authentication required. Authorization header is missing.' },
                { status: 401 }
            );
        }

        // Use a more robust normalization to match the expected https://altalayi-demo.btire.com/rest/V1/kleverapi format
        // Removing the localized /en/rest/en/ prefixes
        const cleanBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/https?:\/\/[^\/]+(\/en)?\/rest\/en/, 'https://altalayi-demo.btire.com/rest');
        const magentoUrl = `${cleanBaseUrl}/my-account`;

        console.log(`[API ROUTE] Fetching Customer Info from: ${magentoUrl}`);

        // 3. Forward the request to the Magento REST API
        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'platform': 'web',
            },
            // Disable caching for real-time account data
            cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`[API ROUTE ERROR] Magento returned ${response.status}:`, data);
        }

        // 4. Return the data back to the frontend (Redux)
        return NextResponse.json(data, { status: response.status });

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
        const authHeader = request.headers.get('Authorization');
        const body = await request.json();

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        // Use normalized URL to match standard REST path
        const cleanBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/https?:\/\/[^\/]+(\/en)?\/rest\/en/, 'https://altalayi-demo.btire.com/rest');
        const magentoUrl = `${cleanBaseUrl}/my-account`;
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

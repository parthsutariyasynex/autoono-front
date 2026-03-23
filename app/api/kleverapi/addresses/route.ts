import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
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
                'Authorization': authHeader,
                'platform': 'web',
            },
            cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`[API ROUTE ERROR] Magento returned ${response.status}:`, data);
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

import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = searchParams.get('currentPage') || '1';
        const pageSize = searchParams.get('pageSize') || '10';

        const magentoUrl = `${BASE_URL}/favorite-products?pageSize=${pageSize}&currentPage=${page}`;
        console.log(`[API ROUTE] Fetching Favorite Products from: ${magentoUrl}`);

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
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('[API ROUTE ERROR] Favorite Products GET Catch:', error);
        return NextResponse.json(
            { message: error.message || 'Server-side error fetching favorites.' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const magentoUrl = `${BASE_URL}/favorite-products`;
        console.log(`[API ROUTE] Adding Favorite Product to: ${magentoUrl}`, body);

        const response = await fetch(magentoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'platform': 'web',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('[API ROUTE ERROR] Favorite Products POST Catch:', error);
        return NextResponse.json(
            { message: error.message || 'Server-side error adding to favorites.' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const BASE_URL = getBaseUrl(request);
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/addresses/${id}`;
        console.log(`[API ROUTE] Accessing Customer Address ${id} from: ${magentoUrl}`);

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
        console.error('[API ROUTE ERROR] Addresses GET Catch:', error);
        return NextResponse.json(
            { message: 'Server-side error fetching address.' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const BASE_URL = getBaseUrl(request);
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');
        const body = await request.json();

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/addresses/${id}`;
        console.log(`[API ROUTE] Updating Customer Address ${id} at: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'PUT',
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
        console.error('[API ROUTE ERROR] Addresses PUT Catch:', error);
        return NextResponse.json(
            { message: 'Server-side error updating address.' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const BASE_URL = getBaseUrl(request);
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/addresses/${id}`;
        console.log(`[API ROUTE] Deleting Customer Address ${id} at: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'platform': 'web',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('[API ROUTE ERROR] Addresses DELETE Catch:', error);
        return NextResponse.json(
            { message: 'Server-side error deleting address.' },
            { status: 500 }
        );
    }
}

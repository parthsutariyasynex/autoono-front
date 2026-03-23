import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/addresses/${params.id}`;
        console.log(`[API ROUTE] Fetching Customer Address ${params.id} from: ${magentoUrl}`);

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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const authHeader = request.headers.get('Authorization');
        const body = await request.json();

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/addresses/${params.id}`;
        console.log(`[API ROUTE] Updating Customer Address ${params.id} at: ${magentoUrl}`);

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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/addresses/${params.id}`;
        console.log(`[API ROUTE] Deleting Customer Address ${params.id} at: ${magentoUrl}`);

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

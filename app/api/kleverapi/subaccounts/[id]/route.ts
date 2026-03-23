import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const { id } = await params;
        const magentoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subaccounts/${id}`;

        console.log(`[API ROUTE] Get Sub Account by ID: ${magentoUrl}`);

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
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('[API ROUTE ERROR] Sub Account GET by ID:', error);
        return NextResponse.json(
            { message: error.message || 'Server-side error fetching sub account.' },
            { status: 500 }
        );
    }
}

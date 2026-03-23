import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/favorite-products/${id}`;
        console.log(`[API ROUTE] Removing Favorite Product ID: ${id} at: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'DELETE',
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
        console.error('[API ROUTE ERROR] Favorite Products DELETE Catch:', error);
        return NextResponse.json(
            { message: error.message || 'Server-side error removing favorite.' },
            { status: 500 }
        );
    }
}

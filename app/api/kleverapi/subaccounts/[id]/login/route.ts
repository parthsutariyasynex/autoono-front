import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const { id } = await params;
        const magentoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subaccounts/${id}/login`;

        console.log(`[API ROUTE] Sub-Account Login at: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'platform': 'web',
            },
            body: JSON.stringify({}),
        });

        const data = await response.json();
        console.log(`[API ROUTE] Sub-Account Login response: ${response.status}`, JSON.stringify(data));

        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('[API ROUTE ERROR] Sub Account Login POST:', error);
        return NextResponse.json(
            { message: 'Server-side error logging into sub account.' },
            { status: 500 }
        );
    }
}

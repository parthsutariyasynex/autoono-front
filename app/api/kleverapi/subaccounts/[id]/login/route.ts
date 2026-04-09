import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const baseUrl = getBaseUrl(request);
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const { id } = await params;
        const magentoUrl = `${baseUrl}/subaccounts/${id}/login`;

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

import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getGlobalBaseUrl } from '@/lib/api/magento-url';
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
        console.log(`[MY-ACCOUNT] GET ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'platform': 'web',
            },
            cache: 'no-store',
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            console.error(`[MY-ACCOUNT] Error ${response.status}:`, data);
            return NextResponse.json(
                data || { message: `Magento returned error ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[MY-ACCOUNT] Exception:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to fetch account details.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        const token = await getRequestToken(request);
        const body = await request.json();

        if (!token) {
            return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
        }

        const magentoUrl = `${baseUrl}/my-account`;
        console.log(`[MY-ACCOUNT] POST ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'platform': 'web',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            console.error(`[MY-ACCOUNT] POST Error ${response.status}:`, data);
            return NextResponse.json(
                data || { message: `Failed to update account (${response.status})` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[MY-ACCOUNT] POST Exception:', error);
        return NextResponse.json(
            { message: error.message || 'Server-side error updating account details.' },
            { status: 500 }
        );
    }
}

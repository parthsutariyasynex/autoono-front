import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';
import { getRequestToken } from '@/lib/api/auth-helper';
import axios from 'axios';

export async function GET(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        const tokenStart = Date.now();
        const token = await getRequestToken(request);
        const tokenEnd = Date.now();
        console.log(`[MY-ACCOUNT] Token retrieved in ${tokenEnd - tokenStart}ms`);

        if (!token) {
            return NextResponse.json(
                { message: 'Authentication required.' },
                { status: 401 }
            );
        }

        const magentoUrl = `${baseUrl}/my-account`;
        console.log(`[MY-ACCOUNT] GET ${magentoUrl}`);
        console.log(`[MY-ACCOUNT] Fetching with token length: ${token?.length}`);

        const fetchStart = Date.now();
        const response = await axios.get(magentoUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'platform': 'web',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 15000, // 15 seconds
        });
        const fetchEnd = Date.now();
        console.log(`[MY-ACCOUNT] Axios completed in ${fetchEnd - fetchStart}ms`);

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[MY-ACCOUNT] Exception:', error.message);
        if (error.response) {
            console.error('[MY-ACCOUNT] Status:', error.response.status);
            console.error('[MY-ACCOUNT] Data:', error.response.data);
            return NextResponse.json(
                error.response.data || { message: `Magento returned error ${error.response.status}` },
                { status: error.response.status }
            );
        }
        return NextResponse.json(
            { 
                message: error.message || 'Failed to fetch account details.',
                code: error.code || 'unknown'
            },
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

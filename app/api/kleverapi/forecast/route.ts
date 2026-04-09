import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        // Step 1: Get token
        let token: string | null = null;

        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).replace(/['"]/g, '').trim();
        }

        if (!token || token === 'null') {
            const cookie = request.cookies.get('auth-token')?.value;
            if (cookie) token = cookie.replace(/['"]/g, '').trim();
        }

        if (!token || token === 'null') {
            const session: any = await getServerSession(authOptions);
            token = session?.accessToken;
        }

        if (!token) {
            return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
        }

        // Step 2: Forward query parameters
        const { searchParams } = new URL(request.url);
        const pageSize = searchParams.get('pageSize') || '10';
        const currentPage = searchParams.get('currentPage') || '1';

        const magentoUrl = `${baseUrl}/forecast?pageSize=${pageSize}&currentPage=${currentPage}`;

        console.log('[forecast] Fetching:', magentoUrl);

        // Step 3: Fetch from Magento
        const res = await fetch(magentoUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('[forecast] Magento error:', res.status, errBody);
            return NextResponse.json(
                { message: 'Failed to fetch forecast files', details: errBody },
                { status: res.status }
            );
        }

        const data = await res.json();
        // The data might be an array or { items: [], total_count: ... }
        // Let's return it as is, but we might need to handle it in the frontend
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[forecast] Error:', error.message);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        // Step 1: Get token
        let token: string | null = null;
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).replace(/['"]/g, '').trim();
        }

        if (!token || token === 'null') {
            const session: any = await getServerSession(authOptions);
            token = session?.accessToken;
        }

        if (!token) {
            return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
        }

        // Step 2: Build Magento Upload URL
        const magentoUrl = `${baseUrl}/forecast/upload`;

        console.log('[forecast-upload] Proxying to:', magentoUrl);

        // Step 3: Forward the request body (which is FormData)
        // We shouldn't set Content-Type manually for FormData, fetch will do it with the correct boundary
        const formData = await request.formData();

        // Re-construct the FormData for the outgoing request
        const outputFormData = new FormData();
        formData.forEach((value, key) => {
            outputFormData.append(key, value);
        });

        const res = await fetch(magentoUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Content-Type': 'multipart/form-data' is omitted so fetch adds the boundary
            },
            body: outputFormData,
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('[forecast-upload] Magento error:', res.status, errBody);
            return NextResponse.json(
                { message: 'Upload failed', details: errBody },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[forecast-upload] Error:', error.message);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}



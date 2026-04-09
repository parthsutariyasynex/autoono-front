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

        // Step 2: Get query params (searchYear, compareYear)
        const { searchParams } = new URL(request.url);
        const searchYear = searchParams.get('searchYear');
        const compareYear = searchParams.get('compareYear');

        // Step 3: Build Magento URL
        const queryParts: string[] = [];
        if (searchYear) queryParts.push(`searchYear=${encodeURIComponent(searchYear)}`);
        if (compareYear) queryParts.push(`compareYear=${encodeURIComponent(compareYear)}`);

        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const magentoUrl = `${baseUrl}/customer-target/dashboard${queryString}`;

        console.log('[dashboard] Fetching:', magentoUrl);

        // Step 4: Fetch from Magento
        const res = await fetch(magentoUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('[dashboard] Magento error:', res.status, errBody);
            return NextResponse.json(
                { message: 'Failed to fetch dashboard data', details: errBody },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[dashboard] Error:', error.message);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}

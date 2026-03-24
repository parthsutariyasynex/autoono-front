import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json(
                { message: 'Authentication required. Authorization header is missing.' },
                { status: 401 }
            );
        }

        const magentoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subaccounts`;

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
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Server-side error fetching sub accounts.' },
            { status: 500 }
        );
    }
}

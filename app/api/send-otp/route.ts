import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';

export async function POST(request: Request) {
    try {
        const baseUrl = getBaseUrl(request);
        const body = await request.json();
        const magentoUrl = `${baseUrl}/auth/send-otp`;

        console.log(`>>> PROXY HIT: Sending OTP to Magento: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'platform': 'web',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Send OTP Proxy Error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

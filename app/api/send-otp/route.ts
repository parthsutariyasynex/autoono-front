import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const magentoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/send-otp`;

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

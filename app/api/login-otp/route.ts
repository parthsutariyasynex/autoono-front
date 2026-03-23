import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const magentoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login/otp`;

        console.log(`Proxying Login OTP request to: ${magentoUrl}`);

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
        console.error('Login OTP Proxy Error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

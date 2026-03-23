import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // The Magento endpoint is 'forget-password' not 'forgot-password'
        const magentoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/forget-password`;

        console.log(`>>> PROXY ATTEMPT: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'platform': 'web'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`>>> PROXY SUCCESS: ${magentoUrl}`);
        } else {
            console.error(`>>> PROXY FAILURE: ${magentoUrl} returned ${response.status}`, data);
        }

        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('>>> PROXY CRITICAL ERROR:', error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
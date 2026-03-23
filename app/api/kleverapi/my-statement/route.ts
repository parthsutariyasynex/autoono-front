import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('fromDate') || '2025-01-01';
        const toDate = searchParams.get('toDate') || '2026-03-16';
        const type = searchParams.get('type') || 'account_statement';

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const magentoUrl = `${BASE_URL}/my-statement?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&type=${encodeURIComponent(type)}`;

        console.log(`[my-statement] Initial request to: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'platform': 'web',
                'Accept': 'application/pdf, application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch statement' }));
            return NextResponse.json(
                { message: errorData.message || `Backend returned error ${response.status}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type');

        // Check if the response is JSON (potentially containing pdf_url)
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            if (data.pdf_url) {
                console.log(`[my-statement] Found PDF URL in JSON: ${data.pdf_url}. Fetching binary data...`);

                // Fetch the actual PDF content to avoid CORS and force binary delivery
                const pdfResponse = await fetch(data.pdf_url, {
                    method: 'GET',
                    headers: {
                        'Authorization': authHeader,
                    },
                    cache: 'no-store',
                });

                if (pdfResponse.ok) {
                    const buffer = await pdfResponse.arrayBuffer();
                    return new Response(buffer, {
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': `attachment; filename="statement_${fromDate}_${toDate}.pdf"`,
                        },
                    });
                } else {
                    console.error(`[my-statement] Failed to fetch PDF binary from URL. Status: ${pdfResponse.status}`);
                    // Return the original JSON if binary fetch fails
                    return NextResponse.json(data);
                }
            }

            // If it's just normal JSON without a URL, return it
            return NextResponse.json(data);
        }

        // Check if the response is already a PDF
        if (contentType && contentType.includes('application/pdf')) {
            console.log(`[my-statement] Server returned PDF binary directly.`);
            const buffer = await response.arrayBuffer();
            return new Response(buffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="statement_${fromDate}_${toDate}.pdf"`,
                },
            });
        }

        // Default: return whatever we got
        const fallbackData = await response.text();
        return new Response(fallbackData, {
            headers: { 'Content-Type': contentType || 'text/plain' },
        });

    } catch (error: any) {
        console.error('[my-statement] Server error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error proxying request' },
            { status: 500 }
        );
    }
}

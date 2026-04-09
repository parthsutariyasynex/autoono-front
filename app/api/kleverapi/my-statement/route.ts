import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api/magento-url';

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(request: Request) {
    try {
        const BASE_URL = getBaseUrl(request);
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

        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            const responseText = await response.text();
            let errorData;
            try {
                errorData = responseText ? JSON.parse(responseText) : {};
            } catch (err) {
                console.error(`<<< My Statement GET ERROR: ${response.status}`, responseText);
                return NextResponse.json({ message: "Backend error" }, { status: response.status });
            }
            return NextResponse.json(errorData, { status: response.status });
        }

        // Check if the response is JSON (potentially containing pdf_url)
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.pdf_url) {
                console.log(`>>> Found PDF URL: ${data.pdf_url}`);
                const pdfResponse = await fetch(data.pdf_url, {
                    method: 'GET',
                    headers: { 'Authorization': authHeader },
                });
                if (pdfResponse.ok) {
                    const buffer = await pdfResponse.arrayBuffer();
                    return new Response(buffer, {
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': `attachment; filename="statement_${fromDate}_${toDate}.pdf"`,
                        },
                    });
                }
                return NextResponse.json(data);
            }
            return NextResponse.json(data);
        }

        // Check if the response is already a PDF
        if (contentType && contentType.includes('application/pdf')) {
            const buffer = await response.arrayBuffer();
            return new Response(buffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="statement_${fromDate}_${toDate}.pdf"`,
                },
            });
        }

        // Default: return as text
        const fallbackData = await response.text();
        return new Response(fallbackData, {
            headers: { 'Content-Type': contentType || 'text/plain' },
        });
    } catch (error: any) {
        console.error('[my-statement] Server error:', error);
        return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
    }
}

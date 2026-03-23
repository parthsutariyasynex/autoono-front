import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Forward matching query parameters
        const magentoParams = new URLSearchParams();
        const orderId = searchParams.get('order_id');
        const documentType = searchParams.get('document_type');
        const invoiceDue = searchParams.get('invoice_due');
        const pageSize = searchParams.get('pageSize') || '10';
        const currentPage = searchParams.get('currentPage') || '1';

        if (orderId) magentoParams.append('orderIncrementId', orderId);
        if (documentType && documentType !== 'All') magentoParams.append('documents', documentType);
        if (invoiceDue && invoiceDue !== 'All') magentoParams.append('invoiceDue', invoiceDue);
        magentoParams.append('pageSize', pageSize);
        magentoParams.append('currentPage', currentPage);

        const magentoUrl = `${BASE_URL}/orderupload/search${magentoParams.toString() ? `?${magentoParams.toString()}` : ''}`;

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
            return NextResponse.json(
                { message: data.message || `Magento returned ${response.status}`, attachments: [] },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[orderupload-search] Catch error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error searching attachments', attachments: [] },
            { status: 500 }
        );
    }
}

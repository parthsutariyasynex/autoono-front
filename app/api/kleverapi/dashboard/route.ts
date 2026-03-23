import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json(
                { message: 'Authentication required.' },
                { status: 401 }
            );
        }

        // Mock data to match the UI requirements and avoid JSON errors
        // In a real scenario, this would fetch from Magento
        const mockDashboardData = {
            total_order_qty: {
                year: "138",
                quarter: "138",
                months: "24"
            },
            total_order_value: {
                year: "212,337.90",
                quarter: "212,337.90",
                months: "14,769.30"
            },
            product_groups: [
                { name: "Cars" },
                { name: "Trucks" },
                { name: "Industrial" }
            ],
            tyre_sizes: [
                { name: "265/40 R21 Turanza T005" },
                { name: "205/55 R16 ECOPIA" },
                { name: "225/45 R18 POTENZA" }
            ],
            selected_product_group_value: "38",
            selected_tyre_size_value: "10"
        };

        return NextResponse.json(mockDashboardData);

    } catch (error: any) {
        console.error('[DASHBOARD API ERROR]:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

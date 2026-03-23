import { NextResponse } from "next/server";

export async function GET() {
    // Mock API Response for all filters requested
    const filters = [
        {
            attribute_code: "item_code",
            label: "Item Code",
            options: [
                { label: "IC-001", value: "ic_001" },
                { label: "IC-002", value: "ic_002" },
            ],
        },
        {
            attribute_code: "brand",
            label: "Brand",
            options: [
                { label: "Michelin", value: "michelin" },
                { label: "Bridgestone", value: "bridgestone" },
                { label: "Pirelli", value: "pirelli" },
            ],
        },
        {
            attribute_code: "product_group",
            label: "Product Group",
            options: [
                { label: "Passenger", value: "passenger" },
                { label: "Commercial", value: "commercial" },
            ],
        },
        {
            attribute_code: "tyre_size",
            label: "Tyre Size",
            options: [
                { label: "205/55 R16", value: "205_55_r16" },
                { label: "225/45 R17", value: "225_45_r17" },
            ],
        },
        {
            attribute_code: "pattern",
            label: "Pattern",
            options: [
                { label: "All Season", value: "all_season" },
                { label: "Summer", value: "summer" },
            ],
        },
        {
            attribute_code: "warranty_period",
            label: "Warranty Period",
            options: [
                { label: "1 Year", value: "1_year" },
                { label: "3 Years", value: "3_years" },
                { label: "5 Years", value: "5_years" },
            ],
        },
        {
            attribute_code: "year",
            label: "Year",
            options: [
                { label: "2023", value: "2023" },
                { label: "2024", value: "2024" },
            ],
        },
        {
            attribute_code: "origin",
            label: "Origin",
            options: [
                { label: "Germany", value: "germany" },
                { label: "Japan", value: "japan" },
            ],
        },
        {
            attribute_code: "types",
            label: "Types",
            options: [
                { label: "Run Flat", value: "run_flat" },
                { label: "Standard", value: "standard" },
            ],
        },
        {
            attribute_code: "oem_marking",
            label: "OEM Marking",
            options: [
                { label: "BMW (*)", value: "bmw_star" },
                { label: "Mercedes (MO)", value: "mercedes_mo" },
            ],
        },
        {
            attribute_code: "new_arrivals",
            label: "New Arrivals",
            options: [
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
            ],
        },
    ];

    // Return exactly the fields expected by the component logic
    return NextResponse.json({ filters });
}

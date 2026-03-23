"use client";

import React from "react";
import RegionCard from "./RegionCard";

const regionsData = [
    {
        id: 1,
        title: "WEST REGION",
        address: "Jeddah - Falastin st. Sharafiyah - Unit No: 66\nJeddah Mail box: 42023 Postal code: 21541\nBuilding No: 8146 - Zip Code: 23218 - 4th Floor",
        mapLink: "https://maps.google.com"
    },
    {
        id: 2,
        title: "CENT REGION",
        address: "Riyadh - Al-Malaz st. Khurais Road. Abo Al-Alaa Amere\nRiyadh Mail box: 42023 Postal code: 21541\n2nd Floor",
        mapLink: "https://maps.google.com"
    },
    {
        id: 3,
        title: "EAST REGION",
        address: "Al-Kubar - Al-Waleed Investment Group. Al-Rakah District. Khalid Bin Al-Walid Street\nAl-Kubar Mail post: 42023 Postal code: 21541\n3rd Floor",
        mapLink: "https://maps.google.com"
    }
];

const RegionGrid: React.FC = () => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {regionsData.map((region) => (
                <RegionCard
                    key={region.id}
                    title={region.title}
                    address={region.address}
                    mapLink={region.mapLink}
                />
            ))}
        </section>
    );
};

export default RegionGrid;

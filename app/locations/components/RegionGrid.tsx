"use client";

import React from "react";
import RegionCard from "./RegionCard";
import { useTranslation } from "@/hooks/useTranslation";

const RegionGrid: React.FC = () => {
    const { t } = useTranslation();

    const regionsData = [
        {
            id: 1,
            title: t("locations.westRegion"),
            address: t("locations.westAddress"),
            mapLink: "https://maps.google.com"
        },
        {
            id: 2,
            title: t("locations.centRegion"),
            address: t("locations.centAddress"),
            mapLink: "https://maps.google.com"
        },
        {
            id: 3,
            title: t("locations.eastRegion"),
            address: t("locations.eastAddress"),
            mapLink: "https://maps.google.com"
        }
    ];

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

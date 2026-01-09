"use client";

import { Card, Title, DonutChart } from "@tremor/react";

const valueFormatter = (number: number) => {
    return Intl.NumberFormat("en-US").format(number).toString();
};

export const DonutChartDemo = ({
    chartData,
    title,
    colors = ["cyan", "violet", "indigo", "fuchsia", "sky", "purple"],
    chartClassName = "mt-6 h-96",
}: any) => {
    const data = (chartData || []).map((d: any) => ({
        name: d?.name ?? d?.label ?? "",
        value:
            d?.value ??
            d?.Number ??
            d?.count ??
            d?.total ??
            d?.amount ??
            0,
    }));

    return (
        <Card className="rounded-lg bg-card text-card-foreground border-border ring-0 shadow-sm">
            <Title className="text-primary">{title}</Title>
            <DonutChart
                className={chartClassName}
                data={data}
                category="value"
                index="name"
                colors={colors}
                valueFormatter={valueFormatter}
            />
        </Card>
    );
};

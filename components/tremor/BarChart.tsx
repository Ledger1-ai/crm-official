"use client";

import { Card, Title, BarChart, Subtitle } from "@tremor/react";

const dataFormatter = (number: number) => {
  // return number no decimal places
  return number.toFixed(0);
};

export const BarChartDemo = ({ chartData, title }: any) => {
  return (
    <Card className="rounded-lg bg-card text-card-foreground border-border ring-0 shadow-sm">
      <Title className="text-foreground">{title}</Title>

      <BarChart
        className="mt-6 text-foreground"
        data={chartData}
        index="name"
        categories={["Number"]}
        colors={["orange"]}
        valueFormatter={dataFormatter}
        yAxisWidth={48}
      />
    </Card>
  );
};

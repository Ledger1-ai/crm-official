"use client";

import { Card, Title, AreaChart } from "@tremor/react";

const dataFormatter = (number: number) => {
  return Intl.NumberFormat("us").format(number).toString();
};

export const AreaChartDemo = ({ chartData, title }: any) => (
  <Card className="rounded-lg bg-card text-card-foreground border-border ring-0 shadow-sm">
    <Title className="text-foreground">{title}</Title>
    <AreaChart
      className="h-72 mt-4 text-foreground"
      data={chartData}
      index="date"
      categories={["Number"]}
      colors={["orange"]}
      valueFormatter={dataFormatter}
    />
  </Card>
);

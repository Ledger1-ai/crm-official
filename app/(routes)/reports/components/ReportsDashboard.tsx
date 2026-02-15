"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, BarChart } from "@tremor/react";
import { Activity, DollarSign, TrendingUp, Filter, Printer, Plus } from "lucide-react";
import { useState, useTransition, useEffect, useRef } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getFinancialsByMonth } from "@/actions/reports/get-financials";
import { getOpportunitiesByMonth } from "@/actions/crm/get-opportunities";
import { getTasksByMonth } from "@/actions/campaigns/get-tasks";
import { getLeadsByMonth } from "@/actions/crm/get-leads";
import { AISummaryModal } from "@/components/reports/AISummaryModal";
import { CustomReportsPanel } from "@/components/reports/CustomReportsPanel";
import Link from "next/link";

// Types
type DashboardData = {
    usersInitial: any[];
    oppsInitial: any[];
    tasksInitial: any[];
    financialsInitial: any[];
    leadsInitial: any[];
    departments: any[];
    savedReports: any[];
};

export default function ReportsDashboard({
    usersInitial,
    oppsInitial,
    tasksInitial,
    financialsInitial,
    leadsInitial,
    departments = [],
    savedReports = []
}: DashboardData) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [departmentId, setDepartmentId] = useState<string>("all");
    const [isPending, startTransition] = useTransition();
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: "CRM_Report",
    });

    // Local state - Default to empty array if initial data is undefined/null
    const [financials, setFinancials] = useState(financialsInitial || []);
    const [opps, setOpps] = useState(oppsInitial || []);
    const [tasks, setTasks] = useState(tasksInitial || []);
    // Defensive check for leads
    const [leads, setLeads] = useState(leadsInitial || []);

    // Effect to refresh data when filters change
    useEffect(() => {
        startTransition(async () => {
            try {
                const [newFinancials, newOpps, newTasks, newLeads] = await Promise.all([
                    getFinancialsByMonth(date?.from, date?.to, departmentId),
                    getOpportunitiesByMonth(date?.from, date?.to, departmentId),
                    getTasksByMonth(date?.from, date?.to, departmentId),
                    getLeadsByMonth(date?.from, date?.to, departmentId)
                ]);

                // Ensure we stick to arrays even if server returns null/undefined
                setFinancials(newFinancials || []);
                setOpps(newOpps || []);
                setTasks(newTasks || []);
                setLeads(newLeads || []);
            } catch (error) {
                console.error("Failed to fetch report data", error);
            }
        });
    }, [date, departmentId]);

    // Derived values with safe fallbacks
    const totalRevenue = (financials || []).reduce((acc: number, curr: any) => acc + (curr.Revenue || 0), 0);
    const newLeadsCount = (leads || []).reduce((acc: number, curr: any) => acc + (curr.Number || 0), 0);
    const pipelineCount = (opps || []).reduce((acc: number, curr: any) => acc + (curr.Number || 0), 0);
    const tasksCount = (tasks || []).reduce((acc: number, curr: any) => acc + (curr.Number || 0), 0);

    return (
        <div className="flex flex-col space-y-6">
            {/* Utility Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <DateRangePicker
                        date={date}
                        setDate={setDate}
                    />
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex space-x-2">
                    <CustomReportsPanel savedReports={savedReports} />
                    <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                    <Link href="/reports/builder">
                        <Button size="sm" className="gap-2 bg-primary">
                            <Plus className="w-4 h-4" />
                            Create Report
                        </Button>
                    </Link>
                    <AISummaryModal
                        data={{
                            financials,
                            leads,
                            opps,
                            tasks,
                            dateRange: { from: date?.from?.toISOString(), to: date?.to?.toISOString() },
                            department: departments.find(d => d.id === departmentId)?.name
                        }}
                    />
                </div>
            </div>

            {/* Main Content Area to Print */}
            <div ref={componentRef} className="space-y-6 p-1">
                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">Total for selected period</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {newLeadsCount}
                            </div>
                            <p className="text-xs text-muted-foreground">New leads in period</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pipeline Volume</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {pipelineCount}
                            </div>
                            <p className="text-xs text-muted-foreground">Opportunities in period</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {tasksCount}
                            </div>
                            <p className="text-xs text-muted-foreground">Tasks completed in period</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <AreaChart
                            className="h-72 mt-4"
                            data={financials || []}
                            index="name"
                            categories={["Revenue"]}
                            colors={["emerald"]}
                            valueFormatter={(number: number) =>
                                `$ ${Intl.NumberFormat("us").format(number).toString()}`
                            }
                            showAnimation={true}
                        />
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leads Growth</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BarChart
                                className="h-72 mt-4"
                                data={leads || []}
                                index="name"
                                categories={["Number"]}
                                colors={["blue"]}
                                showAnimation={true}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Opportunity Velocity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BarChart
                                className="h-72 mt-4"
                                data={opps || []}
                                index="name"
                                categories={["Number"]}
                                colors={["amber"]}
                                showAnimation={true}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Task Velocity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BarChart
                                className="h-72 mt-4"
                                data={tasks || []}
                                index="name"
                                categories={["Number"]}
                                colors={["indigo"]}
                                showAnimation={true}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

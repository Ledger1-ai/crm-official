"use client";

import { useState, useMemo } from "react";
import {
    ChevronRight,
    ChevronLeft,
    Database,
    LayoutList,
    Filter as FilterIcon,
    BarChart3,
    Save,
    Plus,
    X,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REPORTABLE_OBJECTS, ReportableObject } from "@/lib/reports-config";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { runVisualReport, saveVisualReport } from "@/actions/reports/visual-reports";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { BarChart } from "@tremor/react";

export default function ReportBuilderClient() {
    const [step, setStep] = useState(1);
    const [selectedObject, setSelectedObject] = useState<ReportableObject | null>(null);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [filters, setFilters] = useState<{ field: string, operator: string, value: string }[]>([]);
    const [chartType, setChartType] = useState<string>("table");
    const [reportTitle, setReportTitle] = useState("");
    const [reportResults, setReportResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // Helper to format data for charts
    const chartData = useMemo(() => {
        if (chartType !== "bar" || reportResults.length === 0 || selectedFields.length < 1) return [];

        // Simple grouping by the first selected field (dimension) and counting
        const dimension = selectedFields[0];
        const counts: Record<string, number> = {};

        reportResults.forEach(item => {
            const val = item[dimension]?.toString() || "Unknown";
            counts[val] = (counts[val] || 0) + 1;
        });

        return Object.entries(counts).map(([name, count]) => ({
            name,
            "Count": count
        }));
    }, [reportResults, chartType, selectedFields]);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const toggleField = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const addFilter = () => {
        if (!selectedObject) return;
        setFilters([...filters, { field: selectedObject.fields[0].id, operator: "equals", value: "" }]);
    };

    const removeFilter = (index: number) => {
        setFilters(prev => prev.filter((_, i) => i !== index));
    };

    const updateFilter = (index: number, key: string, value: string) => {
        const newFilters = [...filters];
        (newFilters[index] as any)[key] = value;
        setFilters(newFilters);
    };

    const handleRunReport = async () => {
        if (!selectedObject) return;
        setIsLoading(true);
        try {
            const res = await runVisualReport({
                objectType: selectedObject.id,
                fields: selectedFields,
                filters,
                chartType
            });
            if (res.success) {
                setReportResults(res.data || []);
                nextStep();
            } else {
                toast.error(res.error || "Failed to run report");
            }
        } catch (error) {
            toast.error("An error occurred while running the report");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveReport = async () => {
        if (!selectedObject || !reportTitle) {
            toast.error("Please provide a report title");
            return;
        }
        setIsSaving(true);
        try {
            const res = await saveVisualReport({
                title: reportTitle,
                objectType: selectedObject.id,
                fields: selectedFields,
                filters,
                chartType,
                content: `Visual Report on ${selectedObject.label}. Rows: ${reportResults.length}`
            });
            if (res.success) {
                toast.success("Report saved successfully");
                router.push("/reports");
            } else {
                toast.error(res.error || "Failed to save report");
            }
        } catch (error) {
            toast.error("An error occurred while saving the report");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto space-y-8">
            {/* Stepper */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-full border border-border/50">
                {[
                    { n: 1, label: "Data Source", icon: Database },
                    { n: 2, label: "Fields", icon: LayoutList },
                    { n: 3, label: "Filters", icon: FilterIcon },
                    { n: 4, label: "Result Preview", icon: BarChart3 }
                ].map((s) => (
                    <div key={s.n} className="flex items-center gap-2">
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                            step === s.n ? "bg-primary text-primary-foreground shadow-lg scale-110" :
                                step > s.n ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                            {step > s.n ? "✓" : s.n}
                        </div>
                        <span className={cn(
                            "text-sm font-medium hidden md:inline",
                            step === s.n ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {s.label}
                        </span>
                        {s.n < 4 && <ChevronRight className="h-4 w-4 text-muted-foreground/30 mx-2" />}
                    </div>
                ))}
            </div>

            <div className="flex-1 min-h-[500px]">
                {/* Step 1: Select Data Source */}
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {REPORTABLE_OBJECTS.map((obj) => (
                            <Card
                                key={obj.id}
                                className={cn(
                                    "cursor-pointer hover:border-primary transition-all",
                                    selectedObject?.id === obj.id ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                                )}
                                onClick={() => setSelectedObject(obj)}
                            >
                                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10">
                                        <Database className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wide">{obj.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground">
                                        Report on {obj.label.toLowerCase()} including {obj.fields.length} available fields.
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Step 2: Select Fields */}
                {step === 2 && selectedObject && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Choose columns for {selectedObject.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {selectedObject.fields.map((field) => (
                                    <div
                                        key={field.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors",
                                            selectedFields.includes(field.id) ? "border-primary bg-primary/5" : ""
                                        )}
                                        onClick={() => toggleField(field.id)}
                                    >
                                        <Checkbox
                                            checked={selectedFields.includes(field.id)}
                                            onCheckedChange={() => toggleField(field.id)}
                                        />
                                        <span className="text-sm font-medium">{field.label}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Filters */}
                {step === 3 && selectedObject && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Filter your results</CardTitle>
                            <Button variant="outline" size="sm" onClick={addFilter} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Filter
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {filters.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="text-sm italic">No filters applied. Showing all records.</p>
                                </div>
                            )}
                            {filters.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg border animate-in fade-in slide-in-from-top-1">
                                    <Select
                                        value={f.field}
                                        onValueChange={(val) => updateFilter(i, 'field', val)}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Field" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedObject.fields.map(field => (
                                                <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={f.operator}
                                        onValueChange={(val) => updateFilter(i, 'operator', val)}
                                    >
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Operator" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="equals">Equals</SelectItem>
                                            <SelectItem value="contains">Contains</SelectItem>
                                            <SelectItem value="gt">Greater than</SelectItem>
                                            <SelectItem value="lt">Less than</SelectItem>
                                            <SelectItem value="not_empty">Is Not Empty</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        className="flex-1"
                                        placeholder="Value"
                                        value={f.value}
                                        onChange={(e) => updateFilter(i, 'value', e.target.value)}
                                    />

                                    <Button variant="ghost" size="icon" onClick={() => removeFilter(i)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Preview Result */}
                {step === 4 && selectedObject && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Preview: {selectedFields.length} Columns | {reportResults.length} Rows</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={chartType === "table" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setChartType("table")}
                                    >
                                        Table
                                    </Button>
                                    <Button
                                        variant={chartType === "bar" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setChartType("bar")}
                                    >
                                        Summary
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {chartType === "table" ? (
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {selectedFields.map(fId => {
                                                        const f = selectedObject.fields.find(field => field.id === fId);
                                                        return <TableHead key={fId}>{f?.label}</TableHead>;
                                                    })}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reportResults.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={selectedFields.length} className="text-center py-10 text-muted-foreground">
                                                            No results found matching your criteria.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    reportResults.map((row, idx) => (
                                                        <TableRow key={idx}>
                                                            {selectedFields.map(fId => (
                                                                <TableCell key={fId} className="whitespace-nowrap">
                                                                    {row[fId]?.toString() || "-"}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="h-80 w-full pt-4">
                                        <BarChart
                                            data={chartData}
                                            index="name"
                                            categories={["Count"]}
                                            colors={["blue"]}
                                            valueFormatter={(number: number) =>
                                                Intl.NumberFormat("us").format(number).toString()
                                            }
                                            yAxisWidth={48}
                                            className="h-full"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Report Title</label>
                            <Input
                                placeholder="Enter report name (e.g., Q1 Open Opportunities)"
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                className="text-lg font-bold"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t">
                <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 1 || isLoading || isSaving}
                    className="gap-2"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="flex items-center gap-3">
                    {step < 3 ? (
                        <Button
                            onClick={nextStep}
                            disabled={step === 1 ? !selectedObject : (step === 2 ? selectedFields.length === 0 : false)}
                            className="gap-2"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : step === 3 ? (
                        <Button
                            onClick={handleRunReport}
                            disabled={isLoading}
                            className="gap-2 bg-primary"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview Results"}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                            onClick={handleSaveReport}
                            disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Report
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

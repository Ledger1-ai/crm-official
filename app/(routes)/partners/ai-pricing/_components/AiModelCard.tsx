"use client";

import { useState, useTransition } from "react";
import { AiModel } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Assuming sonner is used, or generic toast
import { updateModelPricing } from "@/actions/ai/manage-models"; // Verify import path
import { cn } from "@/lib/utils";

// Reusing the implementation from AiModelRow logic-wise
interface AiModelCardProps {
    model: AiModel;
    mode: 'compact' | 'card';
}

export const AiModelCard = ({ model, mode }: AiModelCardProps) => {
    const [isPending, startTransition] = useTransition();

    const [inputPrice, setInputPrice] = useState(model.inputPrice || 0);
    const [outputPrice, setOutputPrice] = useState(model.outputPrice || 0);
    const [markup, setMarkup] = useState((model as any).defaultMarkup || 20);
    const [context, setContext] = useState((model as any).maxContext || 128000);

    const [isActive, setIsActive] = useState(model.isActive);
    const [isDefault, setIsDefault] = useState(model.isDefault);

    const calculatePrice = (base: number) => {
        if (isNaN(base) || isNaN(markup)) return "0.0000";
        return (base * (1 + markup / 100)).toFixed(4);
    };

    const onSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("id", model.id);
            formData.append("inputPrice", String(isNaN(inputPrice) ? 0 : inputPrice));
            formData.append("outputPrice", String(isNaN(outputPrice) ? 0 : outputPrice));
            formData.append("defaultMarkup", String(isNaN(markup) ? 0 : markup));
            formData.append("maxContext", String(context));
            if (isActive) formData.append("isActive", "on");
            if (isDefault) formData.append("isDefault", "on");

            try {
                await updateModelPricing(formData);
                toast.success("Model updated");
            } catch (error) {
                toast.error("Something went wrong");
            }
        });
    };

    // Compact View: Minimal info, read-only mostly? Or just condensed.
    // User asked for "list, grid, and card views with the information!" implying they want to see info.

    if (mode === 'compact') {
        return (
            <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-semibold truncate">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.provider}</div>
                    </div>
                    <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", isActive ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-muted text-muted-foreground")}>
                        {isActive ? "Active" : "Inactive"}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div>
                        <span className="text-muted-foreground">In (Our Price):</span>
                        <div className="font-mono font-bold">${calculatePrice(inputPrice)}</div>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Out (Our Price):</span>
                        <div className="font-mono font-bold">${calculatePrice(outputPrice)}</div>
                    </div>
                </div>

                <div className="flex justify-end mt-2">
                    <Button size="sm" variant="outline" className="h-6 text-xs w-full" onClick={() => toast.info("Switch to Card/Table view to edit")}>
                        Details
                    </Button>
                </div>
            </div>
        );
    }

    // Card View: Full Editable
    return (
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
                <div>
                    <div className="text-xs text-muted-foreground font-mono mb-1">{model.modelId}</div>
                    <div className="font-semibold text-lg">{model.name}</div>
                    <div className="text-sm text-muted-foreground">{model.provider}</div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Active</span>
                        <Switch checked={isActive} onCheckedChange={setIsActive} disabled={isPending} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Default</span>
                        <Switch checked={isDefault} onCheckedChange={setIsDefault} disabled={isPending} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Context</label>
                    <Input
                        type="number"
                        value={isNaN(context) ? "" : context}
                        onChange={(e) => setContext(e.target.value === "" ? NaN : parseInt(e.target.value))}
                        className="h-8 font-mono text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Markup %</label>
                    <Input
                        type="number"
                        value={isNaN(markup) ? "" : markup}
                        onChange={(e) => setMarkup(e.target.value === "" ? NaN : parseFloat(e.target.value))}
                        className="h-8 font-mono text-sm font-bold text-amber-600"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <div className="text-xs font-semibold border-b pb-1">Input (1M Tokens)</div>
                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <span className="text-[10px] text-muted-foreground">Base Cost</span>
                            <Input
                                type="number"
                                step="0.0001"
                                value={isNaN(inputPrice) ? "" : inputPrice}
                                onChange={(e) => setInputPrice(e.target.value === "" ? NaN : parseFloat(e.target.value))}
                                className="h-8 font-mono text-xs"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground">Our Price</span>
                            <div className="h-8 flex items-center px-3 rounded-md border bg-muted font-mono font-bold text-green-600 text-sm">
                                ${calculatePrice(inputPrice)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-semibold border-b pb-1">Output (1M Tokens)</div>
                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <span className="text-[10px] text-muted-foreground">Base Cost</span>
                            <Input
                                type="number"
                                step="0.0001"
                                value={isNaN(outputPrice) ? "" : outputPrice}
                                onChange={(e) => setOutputPrice(e.target.value === "" ? NaN : parseFloat(e.target.value))}
                                className="h-8 font-mono text-xs"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground">Our Price</span>
                            <div className="h-8 flex items-center px-3 rounded-md border bg-muted font-mono font-bold text-green-600 text-sm">
                                ${calculatePrice(outputPrice)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Button className="w-full mt-2" onClick={onSave} disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
            </Button>
        </div>
    );
};

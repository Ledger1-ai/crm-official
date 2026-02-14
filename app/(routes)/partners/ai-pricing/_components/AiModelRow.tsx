
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { updateModelPricing } from "@/actions/ai/manage-models";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";

import { AiModel } from "@prisma/client";

interface AiModelRowProps {
    model: AiModel;
    visibleColumns: {
        provider: boolean;
        name: boolean;
        modelId: boolean;
        context: boolean;
        inputCost: boolean;
        outputCost: boolean;
        markup: boolean;
        ourPrice: boolean;
        active: boolean;
        default: boolean;
    };
}

export const AiModelRow = ({ model, visibleColumns }: AiModelRowProps) => {
    const [isPending, startTransition] = useTransition();
    const [inputPrice, setInputPrice] = useState(model.inputPrice);
    const [outputPrice, setOutputPrice] = useState(model.outputPrice);
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

    return (
        <TableRow>
            {visibleColumns.provider && <TableCell className="font-medium">{model.provider}</TableCell>}
            {visibleColumns.name && <TableCell>{model.name}</TableCell>}
            {visibleColumns.modelId && <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">{model.modelId}</TableCell>}
            {visibleColumns.context && (
                <TableCell>
                    <div className="flex flex-col gap-1">
                        <Input
                            type="number"
                            step="1000"
                            value={isNaN(context) ? "" : context}
                            onChange={(e) => setContext(e.target.value === "" ? NaN : parseInt(e.target.value))}
                            className="w-24 h-8 text-xs"
                            disabled={isPending}
                        />
                    </div>
                </TableCell>
            )}
            {visibleColumns.inputCost && (
                <TableCell>
                    <div className="flex flex-col gap-1">
                        <Input
                            type="number"
                            step="0.0001"
                            value={isNaN(inputPrice) ? "" : inputPrice}
                            onChange={(e) => setInputPrice(e.target.value === "" ? NaN : parseFloat(e.target.value))}
                            className="w-24 h-8 text-xs"
                            disabled={isPending}
                        />
                    </div>
                </TableCell>
            )}
            {visibleColumns.outputCost && (
                <TableCell>
                    <div className="flex flex-col gap-1">
                        <Input
                            type="number"
                            step="0.0001"
                            value={isNaN(outputPrice) ? "" : outputPrice}
                            onChange={(e) => setOutputPrice(e.target.value === "" ? NaN : parseFloat(e.target.value))}
                            className="w-24 h-8 text-xs"
                            disabled={isPending}
                        />
                    </div>
                </TableCell>
            )}
            {visibleColumns.markup && (
                <TableCell>
                    <div className="flex flex-col gap-1">
                        <Input
                            type="number"
                            step="1"
                            value={isNaN(markup) ? "" : markup}
                            onChange={(e) => setMarkup(e.target.value === "" ? NaN : parseFloat(e.target.value))}
                            className="w-20 h-8 text-xs font-bold text-amber-600"
                            disabled={isPending}
                        />
                    </div>
                </TableCell>
            )}
            {visibleColumns.ourPrice && (
                <TableCell>
                    <div className="flex flex-col gap-1 min-w-[100px]">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">In:</span>
                            <span className="font-mono font-bold text-green-600">${calculatePrice(inputPrice)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Out:</span>
                            <span className="font-mono font-bold text-green-600">${calculatePrice(outputPrice)}</span>
                        </div>
                    </div>
                </TableCell>
            )}

            {visibleColumns.active && (
                <TableCell>
                    <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={isPending}
                    />
                </TableCell>
            )}
            {visibleColumns.default && (
                <TableCell>
                    <Switch
                        checked={isDefault}
                        onCheckedChange={setIsDefault}
                        disabled={isPending}
                    />
                </TableCell>
            )}
            <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={onSave} disabled={isPending}>
                    {isPending ? "..." : "Save"}
                </Button>
            </TableCell>
        </TableRow>
    );
};


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
}

export const AiModelRow = ({ model }: AiModelRowProps) => {
    const [isPending, startTransition] = useTransition();
    const [inputPrice, setInputPrice] = useState(model.inputPrice);
    const [outputPrice, setOutputPrice] = useState(model.outputPrice);
    const [isActive, setIsActive] = useState(model.isActive);
    const [isDefault, setIsDefault] = useState(model.isDefault);

    const onSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("id", model.id);
            formData.append("inputPrice", String(inputPrice));
            formData.append("outputPrice", String(outputPrice));
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
            <TableCell className="font-medium">{model.provider}</TableCell>
            <TableCell>{model.name}</TableCell>
            <TableCell className="font-mono text-xs">{model.modelId}</TableCell>
            <TableCell>
                <Input
                    type="number"
                    step="0.0001"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(parseFloat(e.target.value))}
                    className="w-24"
                    disabled={isPending}
                />
            </TableCell>
            <TableCell>
                <Input
                    type="number"
                    step="0.0001"
                    value={outputPrice}
                    onChange={(e) => setOutputPrice(parseFloat(e.target.value))}
                    className="w-24"
                    disabled={isPending}
                />
            </TableCell>
            <TableCell>
                <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isPending}
                />
            </TableCell>
            <TableCell>
                <Switch
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                    disabled={isPending}
                />
            </TableCell>
            <TableCell>
                <Button size="sm" variant="ghost" onClick={onSave} disabled={isPending}>
                    {isPending ? "Saving..." : "Save"}
                </Button>
            </TableCell>
        </TableRow>
    );
};

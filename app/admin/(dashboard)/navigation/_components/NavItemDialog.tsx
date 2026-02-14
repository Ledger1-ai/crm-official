
"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavItem } from "@/lib/navigation-defaults";
import { ICON_MAP } from "../../../../(routes)/components/dynamic-navigation/icon-map";
import { cn } from "@/lib/utils";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: NavItem) => void;
    item?: NavItem | null;
}

export function NavItemDialog({ isOpen, onClose, onSave, item }: Props) {
    const [formData, setFormData] = useState<Partial<NavItem>>({
        label: "",
        href: "",
        iconName: "Grid",
        type: "item",
        permissions: { minRole: "MEMBER" }
    });

    useEffect(() => {
        if (item) {
            setFormData(item);
        } else {
            setFormData({
                label: "",
                href: "",
                iconName: "Grid",
                type: "item",
                permissions: { minRole: "MEMBER" }
            });
        }
    }, [item, isOpen]);

    const handleSave = () => {
        if (!formData.label) return;
        onSave(formData as NavItem);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#18181b] border-primary/20 text-primary font-sans">
                <DialogHeader>
                    <DialogTitle className="text-primary">{item?.id ? "Edit Item" : "Add New Item"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs font-bold uppercase text-primary/60">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val as any })}
                        >
                            <SelectTrigger className="col-span-3 bg-primary/5 border-primary/20 text-primary">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#18181b] border-primary/20 text-primary">
                                <SelectItem value="item">Link (Item)</SelectItem>
                                <SelectItem value="group">Header (Group)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="label" className="text-right text-xs font-bold uppercase text-primary/60">Label</Label>
                        <Input
                            id="label"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            className="col-span-3 bg-primary/5 border-primary/20 text-primary"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="href" className="text-right text-xs font-bold uppercase text-primary/60">Link (URL)</Label>
                        <Input
                            id="href"
                            value={formData.href}
                            onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                            className="col-span-3 bg-primary/5 border-primary/20 text-primary"
                            placeholder="/crm/example"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs font-bold uppercase text-primary/60">Icon</Label>
                        <div className="col-span-3 grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-2 rounded-lg bg-primary/5 border border-primary/20 custom-scrollbar">
                            {Object.entries(ICON_MAP).map(([name, Icon]: [string, any]) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, iconName: name })}
                                    className={cn(
                                        "p-2 rounded-md hover:bg-primary/20 transition-all flex items-center justify-center border border-transparent",
                                        formData.iconName === name ? "bg-primary/30 border-primary text-primary" : "text-primary/40 hover:text-primary/70"
                                    )}
                                    title={name}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs font-bold uppercase text-primary/60">Min Role</Label>
                        <Select
                            value={formData.permissions?.minRole}
                            onValueChange={(val) => setFormData({
                                ...formData,
                                permissions: { ...formData.permissions, minRole: val as any }
                            })}
                        >
                            <SelectTrigger className="col-span-3 bg-primary/5 border-primary/20 text-primary">
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#18181b] border-primary/20 text-primary">
                                <SelectItem value="MEMBER">Member (All)</SelectItem>
                                <SelectItem value="ADMIN">Admin Only</SelectItem>
                                <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-primary/60 hover:text-primary hover:bg-primary/10">Cancel</Button>
                    <Button onClick={handleSave} className="bg-primary text-primary-foreground font-bold">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

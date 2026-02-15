"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";

type Props = {
  projectId: string;
};

type ImageOption = { name: string; url: string };

export default function BrandEditor({ projectId }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("");
  const [availableImages, setAvailableImages] = useState<ImageOption[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/campaigns/${projectId}/brand`);
        if (res.ok) {
          const j = await res.json();
          setBrandLogoUrl(j?.brand_logo_url || "");
          setBrandPrimaryColor(j?.brand_primary_color || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  useEffect(() => {
    (async () => {
      try {
        // Load existing project documents to pick an already-uploaded logo/icon
        const res = await fetch(`/api/campaigns/${projectId}/documents`);
        if (res.ok) {
          const j = await res.json();
          const docs = Array.isArray(j?.documents) ? j.documents : [];
          const isImageUrl = (url: string) => /(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(url || "");
          const imgs: ImageOption[] = docs
            .map((d: any): ImageOption => ({ name: d.document_name || d.id || "image", url: String(d.document_file_url || "") }))
            .filter((x: ImageOption) => !!x.url && isImageUrl(x.url));
          setAvailableImages(imgs);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [projectId]);

  async function onSave() {
    try {
      setSaving(true);
      const res = await fetch(`/api/campaigns/${projectId}/brand`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_logo_url: brandLogoUrl, brand_primary_color: brandPrimaryColor })
      });
      if (!res.ok) {
        const txt = await res.text();
        toast.error(txt || "Failed to save brand");
      } else {
        toast.success("Brand saved");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save brand");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Logo URL</Label>
          <div className="flex gap-2">
            <Input
              value={brandLogoUrl}
              onChange={(e) => setBrandLogoUrl(e.target.value)}
              placeholder="https://..."
              className="bg-background/50 border-border/50"
            />
            {brandLogoUrl ? (
              <div className="h-10 w-10 shrink-0 rounded border border-border/50 bg-background/50 flex items-center justify-center overflow-hidden">
                <img src={brandLogoUrl} alt="Campaign logo" className="w-8 h-8 object-contain" />
              </div>
            ) : (
              <div className="h-10 w-10 shrink-0 rounded border border-border/50 bg-muted/50" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Primary Color</Label>
          <div className="flex gap-2">
            <Input
              value={brandPrimaryColor}
              onChange={(e) => setBrandPrimaryColor(e.target.value)}
              placeholder="#0ea5e9 or rgb(...)"
              className="bg-background/50 border-border/50"
            />
            <div
              className="h-10 w-10 shrink-0 rounded border border-border/50 shadow-sm"
              style={{ backgroundColor: brandPrimaryColor || 'transparent' }}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Pick Logo from Uploads</Label>
          <Select
            value={brandLogoUrl || ""}
            onValueChange={(val) => setBrandLogoUrl(val)}
          >
            <SelectTrigger className="w-full bg-background/50 border-border/50">
              <SelectValue placeholder="Select from uploads" />
            </SelectTrigger>
            <SelectContent>
              {availableImages.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">No images found</div>
              ) : (
                availableImages.map((img) => (
                  <SelectItem key={img.url} value={img.url} className="truncate">
                    {img.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Select an image uploaded to the Documents tab.</p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border/30">
        <Button onClick={onSave} disabled={saving || loading} className="min-w-[100px]">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

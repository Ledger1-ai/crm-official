"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function InitModulesButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleInit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/initModules", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      toast({
        title: "Modules initialized",
        description:
          data?.created > 0
            ? `Created ${data.created} default modules.`
            : "Modules already exist. Refreshed list.",
      });
      router.refresh();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Initialization failed",
        description: e?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleInit} disabled={loading}>
      {loading ? "Initializing..." : "Initialize default modules"}
    </Button>
  );
}

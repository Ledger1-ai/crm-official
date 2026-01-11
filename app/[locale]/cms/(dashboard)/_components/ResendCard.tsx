import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Eye, EyeOff, Shield } from "lucide-react";

// Client component for reveal toggle
import MaskedKeyDisplay from "./MaskedKeyDisplay";

const ResendCard = async () => {
  const setSMTP = async (formData: FormData) => {
    "use server";
    const schema = z.object({
      id: z.string(),
      serviceKey: z.string(),
    });
    const parsed = schema.parse({
      id: formData.get("id"),
      serviceKey: formData.get("serviceKey"),
    });

    if (!parsed.id) {
      await prismadb.systemServices.create({
        data: {
          v: 0,
          name: "resend_smtp",
          serviceKey: parsed.serviceKey,
        },
      });
      revalidatePath("/admin");
    } else {
      await prismadb.systemServices.update({
        where: {
          id: parsed.id,
        },
        data: {
          serviceKey: parsed.serviceKey,
        },
      });
      revalidatePath("/admin");
    }
  };

  const resend_key = await prismadb.systemServices.findFirst({
    where: {
      name: "resend_smtp",
    },
  });

  const envKey = process.env.RESEND_API_KEY;
  const dbKey = resend_key?.serviceKey;

  return (
    <div className="space-y-4">
      {/* Key Status Section */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">API Key Status</p>
          <p className="text-xs text-muted-foreground">
            {envKey ? "ENV key configured" : dbKey ? "DB key configured" : "Not configured"}
          </p>
        </div>
        {(envKey || dbKey) && (
          <MaskedKeyDisplay keyValue={envKey || dbKey || ""} />
        )}
      </div>

      {/* Update Key Form */}
      <form action={setSMTP} className="flex items-center gap-2">
        <input type="hidden" name="id" value={resend_key?.id ?? ""} readOnly />
        <Input
          type="password"
          name="serviceKey"
          placeholder="Enter new API key"
          className="bg-background h-9 max-w-sm"
        />
        <Button type="reset" variant="outline" size="sm" className="min-w-[100px]">
          Reset
        </Button>
        <Button type="submit" size="sm" className="min-w-[120px]">
          Update Key
        </Button>
      </form>
    </div>
  );
};

export default ResendCard;

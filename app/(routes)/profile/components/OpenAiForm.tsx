"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OpenAiForm({ userId }: { userId: string }) {
  return (
    <div className="flex space-x-5 w-full p-5 items-end">
      <div className="w-1/3 space-y-2">
        <Label>Azure Endpoint</Label>
        <Input
          disabled
          value="https://panopticon.openai.azure.com/"
          className="bg-muted"
        />
      </div>
      <div className="w-1/3 space-y-2">
        <Label>Deployment</Label>
        <Input
          disabled
          value="gpt-5"
          className="bg-muted"
        />
      </div>
      <div className="w-1/3 space-y-2">
        <Label>API Version</Label>
        <Input
          disabled
          value="2025-01-01-preview"
          className="bg-muted"
        />
      </div>
    </div>
  );
}

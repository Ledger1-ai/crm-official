"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";

interface AISummaryModalProps {
  data: any; // The whole dashboard data block
}

export function AISummaryModal({ data }: AISummaryModalProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const { complete, completion, isLoading } = useCompletion({
    api: "/api/reports/generate", 
  });

  const handleGenerate = () => {
    complete("", { 
      body: { 
        data: data,
        userPrompt: prompt 
      } 
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate AI Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Bot className="w-5 h-5 text-emerald-500" />
             AI Executive Summary
          </DialogTitle>
          <DialogDescription>
            Generate a custom insight report based on the current dashboard view.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="prompt">Custom Focus (Optional)</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., Focus on the drop in leads compared to last month and suggest marketing adjustments."
              value={prompt}
              onChange={(e: any) => setPrompt(e.target.value)}
              className="resize-none h-24"
            />
          </div>
          
          {isLoading && (
             <div className="flex items-center justify-center py-8 text-muted-foreground animate-pulse">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing report data...
             </div>
          )}

          {completion && (
            <div className="rounded-md bg-muted/50 p-4 max-h-[300px] overflow-y-auto prose prose-sm dark:prose-invert">
                {completion.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={handleGenerate} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
             {isLoading ? "Generating..." : "Generate Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

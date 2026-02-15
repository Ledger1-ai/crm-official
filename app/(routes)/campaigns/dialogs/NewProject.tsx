"use client";

import LoadingComponent from "@/components/LoadingComponent";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  FolderKanban,
  Target,
  MessageSquare,
  Palette,
  X,
  Plus,
  ShieldCheck,
} from "lucide-react";

type Props = {
  customTrigger?: React.ReactNode;
}

const NewProjectDialog = ({ customTrigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basics");

  // Multi-value input states
  const [industriesInput, setIndustriesInput] = useState("");
  const [geosInput, setGeosInput] = useState("");
  const [titlesInput, setTitlesInput] = useState("");
  const [propsInput, setPropsInput] = useState("");

  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const formSchema = z.object({
    // Basic fields
    title: z.string().min(3).max(255),
    description: z.string().min(3).max(500),
    visibility: z.string().min(3).max(255),

    // Branding
    brand_logo_url: z.string().optional(),
    brand_primary_color: z.string().optional(),

    // Context fields - optional arrays
    target_industries: z.array(z.string()).optional(),
    target_geos: z.array(z.string()).optional(),
    target_titles: z.array(z.string()).optional(),
    campaign_brief: z.string().optional(),
    messaging_tone: z.string().optional(),
    key_value_props: z.array(z.string()).optional(),
    meeting_link: z.string().optional(),
    signature_template: z.string().optional(),

    // Workflow settings
    require_approval: z.boolean().optional(),
  });

  type NewProjectFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      visibility: "",
      brand_logo_url: "",
      brand_primary_color: "",
      target_industries: [],
      target_geos: [],
      target_titles: [],
      campaign_brief: "",
      messaging_tone: "",
      key_value_props: [],
      meeting_link: "",
      signature_template: "",
      require_approval: false,
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Helper to add items to array fields
  const addToArrayField = (
    fieldName: "target_industries" | "target_geos" | "target_titles" | "key_value_props",
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = form.getValues(fieldName) || [];
    if (!current.includes(trimmed)) {
      form.setValue(fieldName, [...current, trimmed]);
    }
    setter("");
  };

  // Helper to remove items from array fields
  const removeFromArrayField = (
    fieldName: "target_industries" | "target_geos" | "target_titles" | "key_value_props",
    value: string
  ) => {
    const current = form.getValues(fieldName) || [];
    form.setValue(fieldName, current.filter((item) => item !== value));
  };

  const onSubmit = async (data: NewProjectFormValues) => {
    console.log(data);
    setIsLoading(true);
    try {
      await axios.post("/api/campaigns/", data);
      toast({
        title: "Success",
        description: `New campaign: ${data.title}, created successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data,
      });
    } finally {
      setIsLoading(false);
      setOpen(false);
      form.reset();
      setActiveTab("basics");
      router.refresh();
    }
  };

  const renderArrayInputField = (
    label: string,
    placeholder: string,
    fieldName: "target_industries" | "target_geos" | "target_titles" | "key_value_props",
    inputValue: string,
    setInputValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const values = form.watch(fieldName) || [];
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addToArrayField(fieldName, inputValue, setInputValue);
                }
              }}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => addToArrayField(fieldName, inputValue, setInputValue)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {values.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {values.map((item) => (
                <Badge key={item} variant="secondary" className="pl-2 pr-1 py-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => removeFromArrayField(fieldName, item)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </FormItem>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? (
          <div className="cursor-pointer" onClick={() => setOpen(true)}>{customTrigger}</div>
        ) : (
          <Button className="px-2">New campaign</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5" />
            New Campaign
          </DialogTitle>
          <DialogDescription>
            Create a campaign with context for your team's outreach.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <LoadingComponent />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basics" className="text-xs">
                    <FolderKanban className="w-3 h-3 mr-1" />
                    Basics
                  </TabsTrigger>
                  <TabsTrigger value="targeting" className="text-xs">
                    <Target className="w-3 h-3 mr-1" />
                    ICP
                  </TabsTrigger>
                  <TabsTrigger value="messaging" className="text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Messaging
                  </TabsTrigger>
                  <TabsTrigger value="branding" className="text-xs">
                    <Palette className="w-3 h-3 mr-1" />
                    Branding
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[400px] pr-4">
                  {/* Basics Tab */}
                  <TabsContent value="basics" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign name *</FormLabel>
                          <FormControl>
                            <Input
                              disabled={isLoading}
                              placeholder="e.g., Q1 Enterprise Outreach"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              disabled={isLoading}
                              placeholder="Describe the campaign goals and scope"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select visibility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="private">Private (Team only)</SelectItem>
                              <SelectItem value="public">Public (All users)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="require_approval"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-amber-500" />
                              Require Outreach Approval
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Members must get admin approval before sending outreach
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Targeting / ICP Tab */}
                  <TabsContent value="targeting" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Define your Ideal Customer Profile. These values will pre-populate campaign settings.
                    </p>

                    {renderArrayInputField(
                      "Industries",
                      "e.g., SaaS, FinTech, Healthcare",
                      "target_industries",
                      industriesInput,
                      setIndustriesInput
                    )}

                    {renderArrayInputField(
                      "Geographies",
                      "e.g., United States, Europe, APAC",
                      "target_geos",
                      geosInput,
                      setGeosInput
                    )}

                    {renderArrayInputField(
                      "Target Job Titles",
                      "e.g., VP of Sales, CTO, Founder",
                      "target_titles",
                      titlesInput,
                      setTitlesInput
                    )}
                  </TabsContent>

                  {/* Messaging Tab */}
                  <TabsContent value="messaging" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="campaign_brief"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Brief</FormLabel>
                          <FormControl>
                            <Textarea
                              disabled={isLoading}
                              placeholder="Describe the overall campaign message and goals"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            AI will use this to generate personalized messages
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="messaging_tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Messaging Tone</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="formal">Formal / Professional</SelectItem>
                              <SelectItem value="casual">Casual / Friendly</SelectItem>
                              <SelectItem value="technical">Technical / Expert</SelectItem>
                              <SelectItem value="executive">Executive / Concise</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {renderArrayInputField(
                      "Key Value Propositions",
                      "e.g., 50% faster onboarding, AI-powered insights",
                      "key_value_props",
                      propsInput,
                      setPropsInput
                    )}

                    <FormField
                      control={form.control}
                      name="meeting_link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting Link</FormLabel>
                          <FormControl>
                            <Input
                              disabled={isLoading}
                              placeholder="https://calendly.com/yourname"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Auto-inserted in campaign CTAs
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="signature_template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Signature</FormLabel>
                          <FormControl>
                            <Textarea
                              disabled={isLoading}
                              placeholder="Your email signature for this campaign"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Branding Tab */}
                  <TabsContent value="branding" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="brand_primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <ColorPicker
                              value={field.value || ""}
                              onChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="brand_logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Logo</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              {field.value && (
                                <div className="flex items-center gap-3 p-2 rounded-md bg-white/5 border border-white/10">
                                  <img
                                    src={field.value}
                                    alt="Logo preview"
                                    className="h-10 w-10 rounded object-contain bg-white/10"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => field.onChange("")}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                              <Input
                                type="file"
                                accept="image/*"
                                disabled={isLoading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (!file.type.startsWith("image/")) {
                                    alert("Please select an image file");
                                    return;
                                  }
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert("Max file size is 5MB");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const dataUrl = reader.result as string;
                                    field.onChange(dataUrl);
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogTrigger>
                <Button type="submit">Create Campaign</Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;

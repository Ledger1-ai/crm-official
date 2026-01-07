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

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Props = {
  customTrigger?: React.ReactNode;
}

const NewProjectDialog = ({ customTrigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const formSchema = z.object({
    title: z.string().min(3).max(255),
    description: z.string().min(3).max(500),
    visibility: z.string().min(3).max(255),
    brand_logo_url: z.string().optional(),
    brand_primary_color: z.string().optional(),
  });

  type NewAccountFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewAccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      visibility: "",
      brand_logo_url: "",
      brand_primary_color: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  //Actions

  const onSubmit = async (data: NewAccountFormValues) => {
    console.log(data);
    setIsLoading(true);
    try {
      await axios.post("/api/projects/", data);
      toast({
        title: "Success",
        description: `New project: ${data.title}, created successfully`,
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
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? (
          <div className="cursor-pointer" onClick={() => setOpen(true)}>{customTrigger}</div>
        ) : (
          <Button className="px-2">New project</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new project.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <LoadingComponent />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Project name - most important field first */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Enter project name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project description</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={isLoading}
                        placeholder="Enter project description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project visibility */}
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project visibility</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Branding section */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <p className="text-sm text-muted-foreground">Branding (optional)</p>

                {/* Primary color with color picker popup */}
                <FormField
                  control={form.control}
                  name="brand_primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary color</FormLabel>
                      <FormControl>
                        <ColorPicker
                          value={field.value || ""}
                          onChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project logo */}
                <FormField
                  control={form.control}
                  name="brand_logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project logo</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogTrigger>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;

"use client";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
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
  initialData: any;
  openEdit: (value: boolean) => void;
};

const UpdateProjectForm = ({ initialData, openEdit }: Props) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const formSchema = z.object({
    id: z.string(),
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
      id: initialData.id || "",
      title: initialData.title || "",
      description: initialData.description || "",
      visibility: initialData.visibility || "",
      brand_logo_url: initialData.brand_logo_url || "",
      brand_primary_color: initialData.brand_primary_color || "",
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
    setIsLoading(true);
    try {
      await axios.put("/api/projects/", data);
      toast({
        title: "Success",
        description: `Project: ${data.title}, updated successfully`,
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
      openEdit(false);
      router.refresh();
    }
  };

  return (
    <div className="flex w-full py-5 ">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full w-full space-y-3"
        >
          <div className="flex flex-col space-y-3">
            {/* Project logo (optional) */}
            <FormField
              control={form.control}
              name="brand_logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project logo (optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value ? (
                        <img src={field.value} alt="Logo preview" className="h-12 w-12 rounded object-contain" />
                      ) : null}
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
                      {field.value && (
                        <Button type="button" variant="secondary" size="sm" onClick={() => field.onChange("")}>Clear logo</Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary color */}
            <FormField
              control={form.control}
              name="brand_primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary color (optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        disabled={isLoading}
                        placeholder="#0ea5e9 or rgb(...)"
                        {...field}
                      />
                      <div className="h-6 w-6 rounded border" style={{ backgroundColor: field.value || undefined }} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={10}
                      disabled={isLoading}
                      placeholder="Enter project description"
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
                      <SelectItem value={"public"}>{`Public`}</SelectItem>
                      <SelectItem value={"private"}>{`Private`}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex w-full justify-end space-x-2 pt-2">
            <DialogTrigger asChild>
              <Button variant={"destructive"}>Cancel</Button>
            </DialogTrigger>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Icons.spinner className="animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UpdateProjectForm;

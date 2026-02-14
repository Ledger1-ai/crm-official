"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CalendarIcon, Linkedin, Twitter, Facebook } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

//TODO: fix all the types
type NewTaskFormProps = {
  users: any[];
  accounts: any[];
  projects?: any[];
  onFinish?: () => void;
  redirectOnSuccess?: boolean;
};

export function NewLeadForm({ users, accounts, projects = [], onFinish, redirectOnSuccess = true }: NewTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    // Strip everything that is not a digit
    let digits = value.replace(/\D/g, "");

    // If user deleted everything, return empty
    if (!digits) return "";

    // If it starts with 1, keep it. If not, prepending +1 will happen below?
    // Actually, let's assume if they type "619", they mean US "619".
    // If they type "1619", they mean US "619".
    // Ideally we want "+1" + digits (excluding leading 1 if present).

    if (digits.startsWith("1")) {
      digits = digits.substring(1);
    }

    // Limit to 10 digits for standard US number (or just let it grow if international support needed later, but user asked for +1)
    // "I want the +1 formatting" implies US focus.

    return `+1${digits}`;
  };


  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formSchema = z.object({
    first_name: z.string(),
    last_name: z.string().min(3).max(30).nonempty(),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(0).max(15).optional(),
    description: z.string().optional(),
    lead_source: z.string().optional(),
    refered_by: z.string().optional(),
    // Socials
    social_twitter: z.string().optional(),
    social_facebook: z.string().optional(),
    social_linkedin: z.string().optional(),
    assigned_to: z.string().optional().nullable(),
    accountIDs: z.string().optional().nullable(),
    project: z.string().optional().nullable(),
  });

  type NewLeadFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      company: "",
      jobTitle: "",
      email: "",
      phone: "",
      description: "",
      lead_source: "",
      refered_by: "",
      social_twitter: "",
      social_facebook: "",
      social_linkedin: "",
      assigned_to: null,
      accountIDs: null,
      project: null,
    },
  });



  // State for duplicate dialog
  const [duplicateLeadId, setDuplicateLeadId] = useState<string | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  // ... (rest of form state)

  const onSubmit = async (data: NewLeadFormValues) => {
    setIsLoading(true);
    try {
      const payload = { ...data, accountIDs: data.accountIDs || undefined };
      await axios.post("/api/crm/leads", payload);
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      if (redirectOnSuccess) {
        router.push("/crm/leads");
      }
      router.refresh();
      onFinish?.();
    } catch (error: any) {
      if (error.response?.status === 409) {
        const existingId = error.response.data?.leadId;
        if (existingId) {
          setDuplicateLeadId(existingId);
          setDuplicateDialogOpen(true);
        }
        toast({
          variant: "destructive",
          title: "Duplicate Detected",
          description: "A lead with this email already exists.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.response?.data || "Something went wrong",
        });
      }
    } finally {
      setIsLoading(false);
      // Only reset if NOT a duplicate (so they can fix it if they want)? 
      // Or if successful. Since we redirect on success, resetting is less critical there, but good practice.
      // If duplicate, we keep the form data so they see what they typed.
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-10 space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Company & Job Title */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Job title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1XXXXXXXXXX"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Lead Source & Referred By */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lead_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Source</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="advertisement">Advertisement</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="refered_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referred By</FormLabel>
                  <FormControl>
                    <Input placeholder="Referrer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assigned To, Account & Project */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Assigned To</FormLabel>
                  <FormControl>
                    <Combobox
                      options={users?.map((user: any) => ({
                        label: user.name || user.email,
                        value: user.id,
                      })) || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select user"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountIDs"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Account</FormLabel>
                  <FormControl>
                    <Combobox
                      options={accounts?.map((account: any) => ({
                        label: account.name,
                        value: account.id,
                      })) || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select account"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="project"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Project</FormLabel>
                  <FormControl>
                    <Combobox
                      options={projects?.map((project: any) => ({
                        label: project.title,
                        value: project.id,
                      })) || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select project"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <FormLabel className="text-sm font-medium">Social Profiles</FormLabel>
            <FormField
              control={form.control}
              name="social_linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="LinkedIn URL or username" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="social_facebook"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Facebook URL or username" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="social_twitter"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="X/Twitter handle (e.g., @username)" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this lead..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-2 py-5">
            <Button disabled={isLoading} type="submit">
              {isLoading ? (
                <span className="flex items-center animate-pulse">
                  Saving data ...
                </span>
              ) : (
                "Create lead"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Lead Detected</DialogTitle>
            <DialogDescription>
              A lead with the email <strong>{form.getValues("email")}</strong> already exists in the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => router.push(`/crm/leads/${duplicateLeadId}`)}>View Existing Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

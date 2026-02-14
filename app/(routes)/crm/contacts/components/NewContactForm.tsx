"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

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
import { Switch } from "@/components/ui/switch";

type NewTaskFormProps = {
  users: any[];
  accounts: any[];
  onFinish: () => void;
};

export function NewContactForm({
  users,
  accounts,
  onFinish,
}: NewTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formSchema = z.object({
    birthday_year: z.string().optional().nullable(),
    birthday_month: z.string().optional().nullable(),
    birthday_day: z.string().optional().nullable(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().min(1, "Last name is required"),
    description: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    personal_email: z.string().optional().nullable(),
    office_phone: z.string().optional().nullable(),
    mobile_phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    status: z.boolean(),
    type: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
    assigned_account: z.string().optional().nullable(),
    social_twitter: z.string().optional().nullable(),
    social_facebook: z.string().optional().nullable(),
    social_linkedin: z.string().optional().nullable(),
    social_skype: z.string().optional().nullable(),
    social_youtube: z.string().optional().nullable(),
    social_tiktok: z.string().optional().nullable(),
  });

  type NewAccountFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewAccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: true,
      first_name: "",
      last_name: "",
      description: "",
      email: "",
      personal_email: "",
      office_phone: "",
      mobile_phone: "",
      website: "",
      position: "",
      type: null,
      assigned_to: null,
      assigned_account: null,
      social_twitter: "",
      social_facebook: "",
      social_linkedin: "",
      social_skype: "",
      social_youtube: "",
      social_tiktok: "",
      birthday_year: null,
      birthday_month: null,
      birthday_day: null,
    },
  });

  const contactType = [
    { name: "Customer", id: "Customer" },
    { name: "Partner", id: "Partner" },
    { name: "Vendor", id: "Vendor" },
  ];

  const yearArray = Array.from(
    { length: 100 },
    (_, i) => i + 1923
  );

  const onSubmit = async (data: NewAccountFormValues) => {
    setIsLoading(true);
    try {
      await axios.post("/api/crm/contacts", data);
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data,
      });
    } finally {
      setIsLoading(false);
      form.reset();
      router.refresh();
      onFinish();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-10">
        <div className=" w-[800px] text-sm">
          <div className="pb-5 space-y-2">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="John" {...field} value={field.value ?? ""} />
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
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="Doe" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile phone</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="+11 1236 77 55"
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
              name="office_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Office phone</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="+11 1236 77 55"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="john@domain.com"
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
              name="personal_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="littlejohny@gmail.com"
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
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="https://www.domain.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <h3>Birthday - (optional)</h3>
            <div className="flex space-x-3 w-full mx-auto">
              <FormField
                control={form.control}
                name="birthday_year"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex space-x-2 w-32">
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <SelectTrigger>Year</SelectTrigger>
                        <SelectContent>
                          {yearArray.map((yearOption) => (
                            <SelectItem
                              key={yearOption}
                              value={yearOption.toString()}
                            >
                              {yearOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthday_month"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex space-x-2 w-28">
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <SelectTrigger>Month</SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (monthOption) => (
                              <SelectItem
                                key={monthOption}
                                value={monthOption.toString()}
                              >
                                {monthOption}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthday_day"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex space-x-2">
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <SelectTrigger>Day</SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (dayOption) => (
                              <SelectItem
                                key={dayOption}
                                value={dayOption.toString()}
                              >
                                {dayOption}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isLoading}
                      placeholder="Useful information about the contact"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex space-x-5">
              <div className="w-1/2 space-y-2">
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Assigned user</FormLabel>
                      <FormControl>
                        <Combobox
                          options={users.map((item: any) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select assigned user"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_account"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Assign an Account</FormLabel>
                      <FormControl>
                        <Combobox
                          options={accounts.map((account: any) => ({
                            label: account.name,
                            value: account.id,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select assigned account"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="CTO"
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
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Is contact active?
                        </FormLabel>
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
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Contact type</FormLabel>
                      <FormControl>
                        <Combobox
                          options={contactType.map((type) => ({
                            label: type.name,
                            value: type.id,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Choose type"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-1/2 space-y-2">
                <FormField
                  control={form.control}
                  name="social_twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="https://www.twitter.com/john"
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
                  name="social_facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="https://www.facebook.com/john"
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
                  name="social_linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Linkedin</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="https://www.linkedin.com/john"
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
                  name="social_skype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skype</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="https://www.skype.com/john"
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
                  name="social_youtube"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="https://www.youtube.com/@basalthq"
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
                  name="social_tiktok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TikTok</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="https://www.domain.com"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-2 py-5">
          <Button disabled={isLoading} type="submit">
            {isLoading ? (
              <span className="flex items-center animate-pulse">
                Saving data ...
              </span>
            ) : (
              "Create contact"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

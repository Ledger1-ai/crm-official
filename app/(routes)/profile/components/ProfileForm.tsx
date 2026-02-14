"use client";

import Modal from "@/components/ui/modal";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Users } from "@prisma/client";

interface ProfileFormProps {
  data: any;
}

const FormSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(50),
  username: z.string().min(2).max(50),
  account_name: z.string().min(2).max(50),
});

export function ProfileForm({ data }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const router = useRouter();

  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: data?.id || "",
      name: data?.name || "",
      username: data?.username || "",
      account_name: data?.account_name || "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsLoading(true);
      await axios.put(`/api/user/${data.id}/updateprofile`, data);
      //TODO: send data to the server
      setShowSuccessModal(true);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Something went wrong while activating your notion integration.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <Modal
        title="Success!"
        description="Your profile details have been successfully saved."
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      >
        <div className="flex w-full items-center justify-end pt-6 space-x-2">
          <Button onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-5 w-full p-5 items-end"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full md:w-1/3">
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="John Doe" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full md:w-1/3">
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="jdoe" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="account_name"
          render={({ field }) => (
            <FormItem className="w-full md:w-1/3">
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="Tesla Inc.,"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full md:w-[150px]" type="submit">
          Update
        </Button>
      </form>
    </Form>
  );
}

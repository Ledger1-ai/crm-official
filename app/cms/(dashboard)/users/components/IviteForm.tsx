"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";

import ConfigureModulesModal from "@/app/admin/(dashboard)/modules/components/ConfigureModulesModal";
import { ROLE_CONFIGS } from "@/lib/role-permissions";
import { Settings2 } from "lucide-react";

const FormSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  language: z
    .string({
      message: "Please select a user language.",
    })
    .min(2),
});

export function InviteForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModulesModal, setShowModulesModal] = useState(false);

  // Default to MEMBER modules
  const [selectedModules, setSelectedModules] = useState<string[]>(ROLE_CONFIGS.MEMBER.defaultModules);

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        assigned_modules: selectedModules
      };
      const response = await axios.post("/api/user/inviteuser", payload);

      if (response.data.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.data.error,
        });
      } else {
        toast({
          title: "Success!",
          description: "User invited successfully.",
        });
      }
    } catch (error: any) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data || "Something went wrong while inviting the user.",
      });
    } finally {
      form.reset({
        name: "",
        email: "",
        language: "en",
      });
      // Reset modules to default
      setSelectedModules(ROLE_CONFIGS.MEMBER.defaultModules);
      router.refresh();
      setIsLoading(false);
    }
  }

  return (
    <>
      <ConfigureModulesModal
        isOpen={showModulesModal}
        onClose={() => setShowModulesModal(false)}
        roleName="New User"
        enabledModules={selectedModules}
        onSave={async (modules) => {
          setSelectedModules(modules);
          setShowModulesModal(false);
          toast({ title: "Modules Selected", description: `${modules.length} modules configured for invite.` });
        }}
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full p-5 items-end"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="jdoe" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    placeholder="name@domain.com"
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
            name="language"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Language</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowModulesModal(true)}
          >
            <Settings2 className="w-4 h-4" />
            <span>Configure Modules</span>
          </Button>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? (
              <Icons.spinner className="animate-spin" />
            ) : (
              "Invite user"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}

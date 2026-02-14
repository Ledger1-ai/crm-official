"use client";

import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import React, { ElementRef, useRef } from "react";

import { sendMailToAll } from "@/actions/admin/send-mail-to-all";

import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { useAction } from "@/hooks/use-action";

const SendMailToAll = () => {
  const closeRef = useRef<ElementRef<"button">>(null);

  const { execute, fieldErrors, isLoading } = useAction(sendMailToAll, {
    onSuccess: (data) => {
      toast.success("Message sent!");
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSendMail = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;

    await execute({ title, message });
  };

  return (
    <Sheet>
      <SheetTrigger ref={closeRef} asChild>
        <Button size="sm" className="gap-2">
          <Mail className="h-4 w-4" />
          Send Mail To All Users
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <h4 className="text-xl font-semibold tracking-tight">
              Send Mail To All Users
            </h4>
            <p>This will send an email to all users with a message from you.</p>
            <form action={onSendMail} className="space-y-4">
              <FormInput
                id="title"
                label="Message title"
                type="text"
                errors={fieldErrors}
              />
              <FormTextarea
                id="message"
                label="Message"
                placeholder="Message"
                required
                errors={fieldErrors}
              />
              <FormSubmit className="w-full">
                {isLoading ? (
                  <Loader2 className="h-6 w-6  animate-spin" />
                ) : (
                  "Send Mail"
                )}
              </FormSubmit>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SendMailToAll;

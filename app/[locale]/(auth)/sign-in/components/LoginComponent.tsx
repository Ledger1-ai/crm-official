"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { FingerprintIcon } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import LoadingComponent from "@/components/LoadingComponent";

export function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);
  //State for dialog to be by opened and closed by DialogTrigger
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const router = useRouter();
  const locale = useLocale();
  const dashboardPath = `/${locale}/dashboard`;
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("loggedOut")) {
      toast({
        description: "You have been logged out.",
      });
    }
  }, [searchParams, toast]);

  const formSchema = z.object({
    email: z.string().min(3).max(50),
    password: z.string().min(8).max(50),
  });

  type LoginFormValues = z.infer<typeof formSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signIn("google", {
        callbackUrl: dashboardPath,
        //callbackUrl: "/",
      });
    } catch (error) {
      console.log(error, "error");
      toast({
        variant: "destructive",
        description:
          "Something went wrong while logging with your Google account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGitHub = async () => {
    setIsLoading(true);
    try {
      await signIn("github", {
        callbackUrl: dashboardPath,
        //callbackUrl: "/",
      });
    } catch (error) {
      console.log(error, "error");
      toast({
        variant: "destructive",
        description:
          "Something went wrong while logging with your Google account.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const loginWithMicrosoft = async () => {
    setIsLoading(true);
    try {
      await signIn("azure-ad", {
        callbackUrl: dashboardPath,
      });
    } catch (error) {
      console.log(error, "error");
      toast({
        variant: "destructive",
        description:
          "Something went wrong while logging with your Microsoft account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  //Login with username(email)/password
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const status = await signIn("credentials", {
        redirect: false,
        email: normalizedEmail,
        password: data.password,
        callbackUrl: process.env.NEXT_PUBLIC_APP_URL,
      });
      //console.log(status, "status");
      if (status?.error) {
        const msg = status.error as string;
        toast({
          variant: "destructive",
          title: "Error",
          description: msg,
        });
        // If the account exists but has no password set (OAuth-only), prefill and open reset dialog
        if (typeof msg === "string" && msg.toLowerCase().includes("no password is set")) {
          setEmail(normalizedEmail);
          setOpen(true);
        }
      }
      if (status?.ok) {
        // console.log("Status OK");
        toast({
          description: "Login successful.",
        });
        router.replace(dashboardPath);
      }
    } catch (error: any) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error!,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onPasswordReset(email: string) {
    try {
      setIsLoading(true);
      await axios.post("/api/user/passwordReset", {
        email,
      });
      toast({
        title: "Success",
        description: "Password reset email has been sent.",
      });
    } catch (error) {
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong while resetting the password.",
        });
      }
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  }

  return (
    <Card className="shadow-lg my-5 w-full max-w-md sm:max-w-lg mx-auto bg-transparent border-border/40 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-white">Login</CardTitle>
        <CardDescription className="text-gray-300">Click here to login with: </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={loginWithGitHub} className="px-0">
            <Icons.gitHub className="mr-2 h-4 w-4" />
            Github
          </Button>
          <Button
            variant="outline"
            onClick={loginWithGoogle}
            disabled={isLoading}
            className="px-0"
          >
            {isLoading ? (
              <Icons.google className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}{" "}
            Google
          </Button>
          <Button
            variant="outline"
            onClick={loginWithMicrosoft}
            disabled={isLoading}
            className="px-0"
          >
            <Icons.microsoft className="mr-2 h-4 w-4" />
            Microsoft
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-gray-400">
              Or continue with
            </span>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="John Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center w-full ">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <Input
                          className="w-full"
                          disabled={isLoading}
                          placeholder="Password"
                          type={show ? "text" : "password"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <span
                  className="flex px-4 pt-7 w-16"
                  onClick={() => setShow(!show)}
                >
                  <FingerprintIcon size={25} className="text-gray-400" />
                </span>
              </div>
            </div>
            <div className="grid gap-2 py-8">
              <Button
                disabled={isLoading}
                type="submit"
                className="flex gap-2 h-12"
              >
                <span
                  className={
                    isLoading
                      ? " border rounded-full px-3 py-2 animate-spin"
                      : "hidden"
                  }
                >
                  N
                </span>
                <span className={isLoading ? " " : "hidden"}>Loading ...</span>
                <span className={isLoading ? "hidden" : ""}>Login</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-5">
        <div className="text-sm text-gray-300">
          Need account? Register{" "}
          <Link href={"/register"} className="text-primary">
            here
          </Link>
        </div>
        <div className="text-sm text-gray-300">
          Need password reset? Click
          {/* Dialog start */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="text-primary">
              <span className="px-2">here</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="p-5">Password Reset</DialogTitle>
                <DialogDescription className="p-5">
                  Enter your email address and we will send new password to your
                  e-mail.
                </DialogDescription>
              </DialogHeader>
              {isLoading ? (
                <LoadingComponent />
              ) : (
                <div className="flex px-2 space-x-5 py-5">
                  <Input
                    type="email"
                    placeholder="name@domain.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button
                    disabled={email === ""}
                    onClick={() => {
                      onPasswordReset(email);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              )}
              <DialogTrigger asChild>
                <Button variant={"destructive"} className="w-full mt-5">
                  Cancel
                </Button>
              </DialogTrigger>
            </DialogContent>
          </Dialog>
          {/* Dialog end */}
        </div>
      </CardFooter>
    </Card>
  );
}

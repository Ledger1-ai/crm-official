"use server";

import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

import { generateRandomPassword } from "@/lib/utils";

import { hash } from "bcryptjs";
import PasswordResetEmail from "@/emails/PasswordReset";
import resendHelper from "@/lib/resend";

export async function POST(req: Request) {
  /*
  Resend.com function init - this is a helper function that will be used to send emails
  */
  const resend = await resendHelper();
  try {
    const body = await req.json();
    const { email } = body;

    //console.log(body, "body");
    //console.log(email, "email");

    if (!email) {
      return new NextResponse("Email is required!", {
        status: 401,
      });
    }

    // Normalize incoming email to reduce case sensitivity issues
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : email;

    const password = generateRandomPassword();

    // Try to find user by provided email or normalized form (covers legacy mixed-case storage)
    const user = await prismadb.users.findFirst({
      where: {
        OR: [
          { email: email },
          { email: normalizedEmail as string },
        ],
      },
    });

    if (!user) {
      return new NextResponse("No user with that email exists.", {
        status: 401,
      });
    }

    const newpassword = await prismadb.users.update({
      where: { id: user.id },
      data: {
        password: await hash(password, 12),
      },
    });

    if (!newpassword) {
      return new NextResponse("Password not updated!", {
        status: 401,
      });
    } else {
      if (resend) {
        try {
          const data = await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: user.email,
            subject: "Ledger1CRM - Password reset",
            text: "", // Add this line to fix the types issue
            react: PasswordResetEmail({
              username: user?.name!,
              avatar: user.avatar,
              email: user.email,
              password: password,
              userLanguage: user.userLanguage,
            }),
          });
          console.log(data, "data");
          console.log("Email sent to: " + user.email);
        } catch (e) {
          console.log("[USER_PASSWORD_CHANGE_EMAIL_ERROR]", e);
        }
      } else {
        console.log(
          "RESEND_API_KEY not configured; skipping password reset email"
        );
      }
    }

    return NextResponse.json({ message: "Password changed!", status: true });
  } catch (error) {
    console.log("[USER_PASSWORD_CHANGE_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

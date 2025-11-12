import { prismadb } from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { newUserNotify } from "./new-user-notify";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

function getGoogleCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_SECRET;
  if (!clientId || clientId.length === 0) {
    throw new Error("Missing GOOGLE_ID");
  }

  if (!clientSecret || clientSecret.length === 0) {
    throw new Error("Missing GOOGLE_SECRET");
  }

  return { clientId, clientSecret };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.JWT_SECRET,
  //adapter: PrismaAdapter(prismadb),
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: getGoogleCredentials().clientId,
      clientSecret: getGoogleCredentials().clientSecret,
    }),

    GitHubProvider({
      name: "github",
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },

      async authorize(credentials) {
        // console.log(credentials, "credentials");
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email or password is missing");
        }

        // Normalize email to avoid case sensitivity issues in lookups
        const normalizedEmail =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : credentials.email;

        const user = await prismadb.users.findFirst({
          where: {
            email: normalizedEmail,
          },
        });

        //clear white space from password
        const trimmedPassword = credentials.password.trim();

        if (!user) {
          throw new Error("User not found. Please register first.");
        }

        if (!user?.password) {
          throw new Error(
            "Account exists but no password is set. Sign in with Google/GitHub or use 'Forgot password' to set one."
          );
        }

        const isCorrectPassword = await bcrypt.compare(
          trimmedPassword,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Password is incorrect");
        }

        //console.log(user, "user");
        return user;
      },
    }),
  ],
  events: {
    // Update lastLoginAt only on sign-in to avoid concurrent session-triggered writes
    async signIn({ user }: any) {
      if (!user?.id) return;
      try {
        await prismadb.users.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (_err) {
        // swallow to avoid deadlocks during concurrent sign-ins
      }
    },
  },
  callbacks: {
    //TODO: fix this any
    async session({ token, session }: any) {
      // Guard against missing token data to avoid runtime errors and JWT session failures
      if (!token?.email) {
        return session;
      }

      // Normalize email for stable lookups and consistent storage
      const tokenEmail =
        typeof token?.email === "string" ? token.email.toLowerCase() : token?.email;

      const user = await prismadb.users.findFirst({
        where: {
          email: tokenEmail,
        },
      });

      if (!user) {
        try {
          const newUser = await prismadb.users.create({
            data: {
              email: tokenEmail,
              name: token.name,
              avatar: token.picture,
              is_admin: false,
              is_account_admin: false,
              lastLoginAt: new Date(),
              userStatus:
                process.env.NEXT_PUBLIC_APP_URL === "https://demo.nextcrm.io"
                  ? "ACTIVE"
                  : "PENDING",
            },
          });

          await newUserNotify(newUser);

          //Put new created user data in session
          session.user.id = newUser.id;
          session.user.name = newUser.name;
          session.user.email = newUser.email;
          session.user.avatar = newUser.avatar;
          session.user.image = newUser.avatar;
          session.user.isAdmin = false;
          session.user.userLanguage = newUser.userLanguage;
          session.user.userStatus = newUser.userStatus;
          session.user.lastLoginAt = newUser.lastLoginAt;
          return session;
        } catch (error) {
          console.error("[auth.session] users.create error:", error);
          return session;
        }
      } else {
        // User already exists in localDB, put user data in session (avoid DB writes here)
        //User allready exist in localDB, put user data in session
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.avatar = user.avatar;
        session.user.image = user.avatar;
        session.user.isAdmin = user.is_admin;
        session.user.userLanguage = user.userLanguage;
        session.user.userStatus = user.userStatus;
        session.user.lastLoginAt = user.lastLoginAt;
      }

      //console.log(session, "session");
      return session;
    },
  },
};

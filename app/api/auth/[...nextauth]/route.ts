import NextAuth from "next-auth";
import { getDynamicAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = async (req: NextRequest, context: any) => {
    const authOptions = await getDynamicAuthOptions();
    return NextAuth(req as any, context, authOptions);
};

export { handler as GET, handler as POST };

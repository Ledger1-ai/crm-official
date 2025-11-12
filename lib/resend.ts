import { Resend } from "resend";
import { prismadb } from "./prisma";

export default async function resendHelper() {
  const resendKey = await prismadb.systemServices.findFirst({
    where: {
      name: "resend_smtp",
    },
  });

  const key =
    process.env.RESEND_API_KEY || resendKey?.serviceKey;
  if (!key) {
    return null as any;
  }
  const resend = new Resend(key);

  return resend;
}

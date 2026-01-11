import { prismadb } from "@/lib/prisma";
import SystemResendConfig from "./SystemResendConfig";

const SystemResendConfigWrapper = async () => {
    const resend_key = await prismadb.systemServices.findFirst({
        where: {
            name: "resend_smtp",
        },
    });

    const envKey = process.env.RESEND_API_KEY;
    const dbKey = resend_key?.serviceKey || undefined;
    const resendKeyId = resend_key?.id ?? "";

    return (
        <SystemResendConfig
            resendKeyId={resendKeyId}
            envKey={envKey}
            dbKey={dbKey}
        />
    );
};

export default SystemResendConfigWrapper;

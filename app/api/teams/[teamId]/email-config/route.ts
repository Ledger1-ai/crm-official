import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { verifyEmailIdentity, getIdentityVerificationStatus, deleteEmailIdentity } from "@/lib/aws/ses-verify";

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const config = await prismadb.teamEmailConfig.findUnique({
        where: { team_id: params.teamId }
    });

    if (!config) {
        return NextResponse.json(null);
    }

    // Proactively check status if it was pending and is AWS SES
    if (config.provider === "AWS_SES" && config.verification_status === "PENDING" && config.aws_access_key_id && config.aws_secret_access_key) {
        const currentStatus = await getIdentityVerificationStatus(config.from_email, {
            accessKeyId: config.aws_access_key_id,
            secretAccessKey: config.aws_secret_access_key,
            region: config.aws_region
        });

        if (currentStatus !== "PENDING") {
            const updated = await prismadb.teamEmailConfig.update({
                where: { id: config.id },
                data: { verification_status: currentStatus }
            });
            // Return safe version
            return NextResponse.json({
                ...updated,
                aws_access_key_id: updated.aws_access_key_id ? "HasValue" : null,
                aws_secret_access_key: updated.aws_secret_access_key ? "HasValue" : null,
                resend_api_key: updated.resend_api_key ? "HasValue" : null
            });
        }
    }

    // Mask sensitive data before returning
    return NextResponse.json({
        ...config,
        aws_access_key_id: config.aws_access_key_id ? "HasValue" : null,
        aws_secret_access_key: config.aws_secret_access_key ? "HasValue" : null,
        resend_api_key: config.resend_api_key ? "HasValue" : null
    });
}

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const {
        provider = "AWS_SES",
        from_email,
        from_name,
        aws_access_key_id,
        aws_secret_access_key,
        aws_region,
        resend_api_key,
        sendgrid_api_key,
        mailgun_api_key,
        mailgun_domain,
        mailgun_region,
        postmark_api_token,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password
    } = body;

    if (!from_email) return new NextResponse("Email required", { status: 400 });

    try {
        // Fetch existing config to merge keys if not provided
        const existingConfig = await prismadb.teamEmailConfig.findUnique({
            where: { team_id: params.teamId }
        });

        const finalAwsKey = aws_access_key_id || existingConfig?.aws_access_key_id;
        const finalAwsSecret = aws_secret_access_key || existingConfig?.aws_secret_access_key;
        const finalResendKey = resend_api_key || existingConfig?.resend_api_key;



        // Verification Logic
        const finalSendgridKey = sendgrid_api_key || existingConfig?.sendgrid_api_key;
        const finalMailgunKey = mailgun_api_key || existingConfig?.mailgun_api_key;
        const finalPostmarkToken = postmark_api_token || existingConfig?.postmark_api_token;
        const finalSmtpPassword = smtp_password || existingConfig?.smtp_password;



        let verificationStatus = "PENDING";

        // Verification Logic
        if (provider === "AWS_SES") {
            if (!finalAwsKey || !finalAwsSecret) return new NextResponse("AWS Credentials required", { status: 400 });

            const triggerVerification = !existingConfig || existingConfig.from_email !== from_email || existingConfig.provider !== "AWS_SES";

            if (triggerVerification) {
                await verifyEmailIdentity(from_email, { accessKeyId: finalAwsKey, secretAccessKey: finalAwsSecret, region: aws_region || "us-east-1" });
            } else {
                const status = await getIdentityVerificationStatus(from_email, { accessKeyId: finalAwsKey, secretAccessKey: finalAwsSecret, region: aws_region || "us-east-1" });
                if (status === "SUCCESS") verificationStatus = "VERIFIED";
            }
        } else if (provider === "RESEND") {
            if (!finalResendKey) return new NextResponse("Resend API Key required", { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "SENDGRID") {
            if (!finalSendgridKey) return new NextResponse("SendGrid API Key required", { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "MAILGUN") {
            if (!finalMailgunKey || !mailgun_domain) return new NextResponse("Mailgun Config required", { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "POSTMARK") {
            if (!finalPostmarkToken) return new NextResponse("Postmark Token required", { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "SMTP") {
            if (!smtp_host || !smtp_port || !smtp_user || !finalSmtpPassword) return new NextResponse("SMTP Config required", { status: 400 });
            verificationStatus = "VERIFIED";
        }

        // Save Config
        const config = await prismadb.teamEmailConfig.upsert({
            where: { team_id: params.teamId },
            create: {
                team_id: params.teamId,
                provider,
                from_email,
                from_name,
                aws_access_key_id: provider === "AWS_SES" ? finalAwsKey : null,
                aws_secret_access_key: provider === "AWS_SES" ? finalAwsSecret : null,
                aws_region: provider === "AWS_SES" ? (aws_region || "us-east-1") : null,
                resend_api_key: provider === "RESEND" ? finalResendKey : null,
                sendgrid_api_key: provider === "SENDGRID" ? finalSendgridKey : null,
                mailgun_api_key: provider === "MAILGUN" ? finalMailgunKey : null,
                mailgun_domain: provider === "MAILGUN" ? mailgun_domain : null,
                mailgun_region: provider === "MAILGUN" ? (mailgun_region || "us") : null,
                postmark_api_token: provider === "POSTMARK" ? finalPostmarkToken : null,
                smtp_host: provider === "SMTP" ? smtp_host : null,
                smtp_port: provider === "SMTP" ? parseInt(String(smtp_port)) : null,
                smtp_user: provider === "SMTP" ? smtp_user : null,
                smtp_password: provider === "SMTP" ? finalSmtpPassword : null,
                verification_status: verificationStatus,
            },
            update: {
                provider,
                from_email,
                from_name,
                aws_access_key_id: provider === "AWS_SES" ? finalAwsKey : undefined,
                aws_secret_access_key: provider === "AWS_SES" ? finalAwsSecret : undefined,
                aws_region: provider === "AWS_SES" ? (aws_region || "us-east-1") : undefined,
                resend_api_key: provider === "RESEND" ? finalResendKey : undefined,
                sendgrid_api_key: provider === "SENDGRID" ? finalSendgridKey : undefined,
                mailgun_api_key: provider === "MAILGUN" ? finalMailgunKey : undefined,
                mailgun_domain: provider === "MAILGUN" ? mailgun_domain : undefined,
                mailgun_region: provider === "MAILGUN" ? (mailgun_region || "us") : undefined,
                postmark_api_token: provider === "POSTMARK" ? finalPostmarkToken : undefined,
                smtp_host: provider === "SMTP" ? smtp_host : undefined,
                smtp_port: provider === "SMTP" ? parseInt(String(smtp_port)) : undefined,
                smtp_user: provider === "SMTP" ? smtp_user : undefined,
                smtp_password: provider === "SMTP" ? finalSmtpPassword : undefined,
                verification_status: verificationStatus,
            }
        });

        return NextResponse.json({
            ...config,
            aws_access_key_id: config.aws_access_key_id ? "HasValue" : null,
            aws_secret_access_key: config.aws_secret_access_key ? "HasValue" : null,
            resend_api_key: config.resend_api_key ? "HasValue" : null
        });
    } catch (error: any) {
        console.error("Email Config Error:", error);
        return new NextResponse(error.message || "Failed to set config", { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const config = await prismadb.teamEmailConfig.findUnique({
        where: { team_id: params.teamId }
    });

    if (!config) {
        return new NextResponse("Configuration not found", { status: 404 });
    }

    try {
        if (config.provider === "AWS_SES" && config.aws_access_key_id && config.aws_secret_access_key) {
            await deleteEmailIdentity(config.from_email, {
                accessKeyId: config.aws_access_key_id,
                secretAccessKey: config.aws_secret_access_key,
                region: config.aws_region
            });
        }
    } catch (error) {
        console.error("Failed to delete identity", error);
    }

    await prismadb.teamEmailConfig.delete({
        where: { id: config.id }
    });

    return new NextResponse(null, { status: 204 });
}

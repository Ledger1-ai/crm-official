"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitApplication(formData: FormData) {
    const jobId = formData.get("jobId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const linkedinUrl = formData.get("linkedinUrl") as string;
    const portfolioUrl = formData.get("portfolioUrl") as string;
    const coverLetter = formData.get("coverLetter") as string;
    // For now, we'll just simulate a resume upload by storing the name or a placeholder if file input
    // If we had S3/Blob configured, we'd upload here.
    // Assuming text input for resume link or just placeholder for now based on previous assumptions.
    const resumeUrl = formData.get("resumeUrl") as string || "No resume link provided";

    if (!jobId || !name || !email) {
        return { success: false, message: "Missing required fields" };
    }

    try {
        const job = await prismadb.jobPosting.findUnique({ where: { id: jobId } });
        if (!job) return { success: false, message: "Job not found" };

        await prismadb.jobApplication.create({
            data: {
                jobId,
                jobTitle: job.title,
                name,
                email,
                phone,
                linkedinUrl,
                portfolioUrl,
                coverLetter,
                resumeUrl,
                status: "PENDING"
            }
        });

        // Optional: Trigger email notification here

        revalidatePath("/cms/applications");
        return { success: true, message: "Application submitted successfully!" };
    } catch (error) {
        console.error("Application Error:", error);
        return { success: false, message: "Failed to submit application. Please try again." };
    }
}

"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Environment variables should be set:
// JIRA_DOMAIN (e.g., "yourcompany.atlassian.net")
// JIRA_EMAIL (email of the user creating ticket)
// JIRA_API_TOKEN (API token from Atlassian)
// JIRA_PROJECT_KEY (e.g., "HR", "KAN")

export async function pushToJira(applicationId: string) {
    try {
        const app = await prismadb.jobApplication.findUnique({
            where: { id: applicationId },
            include: { job: true }
        });

        if (!app) return { success: false, message: "Application not found" };
        if (app.jiraTicketId) return { success: false, message: "Ticket already exists: " + app.jiraTicketId };

        const domain = process.env.JIRA_DOMAIN || "ledger1crm.atlassian.net"; // Fallback/Mock
        const email = process.env.JIRA_EMAIL || "admin@ledger1.com";
        const token = process.env.JIRA_API_TOKEN;
        const projectKey = process.env.JIRA_PROJECT_KEY || "HR";

        // Mocking Jira call if no token provided to avoid breaking demo
        if (!token) {
            console.warn("JIRA_API_TOKEN is missing. Mocking success.");
            await prismadb.jobApplication.update({
                where: { id: applicationId },
                data: { jiraTicketId: "MOCK-123", status: "REVIEWING" }
            });
            revalidatePath("/cms/applications");
            return { success: true, message: "Mock Jira Ticket Created: MOCK-123" };
        }

        const body = {
            fields: {
                project: { key: projectKey },
                summary: `Candidate: ${app.name} - ${app.job.title}`,
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                { type: "text", text: `Name: ${app.name}\nEmail: ${app.email}\nPhone: ${app.phone || "N/A"}\n\n` },
                                { type: "text", text: `LinkedIn: ${app.linkedinUrl || "N/A"}\nPortfolio: ${app.portfolioUrl || "N/A"}\n\n` },
                                { type: "text", text: `Resume: ${app.resumeUrl}\n\n` },
                                { type: "text", text: `Cover Letter:\n${app.coverLetter || "N/A"}` }
                            ]
                        }
                    ]
                },
                issuetype: { name: "Task" }
            }
        };

        const response = await fetch(`https://${domain}/rest/api/3/issue`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Jira API Error:", JSON.stringify(errorData));
            return { success: false, message: "Failed to create Jira ticket." };
        }

        const data = await response.json();

        await prismadb.jobApplication.update({
            where: { id: applicationId },
            data: { jiraTicketId: data.key, status: "REVIEWING" }
        });

        revalidatePath("/cms/applications");
        return { success: true, message: `Jira Ticket Created: ${data.key}` };

    } catch (error) {
        console.error("Jira Integration Error:", error);
        return { success: false, message: "Internal server error" };
    }
}

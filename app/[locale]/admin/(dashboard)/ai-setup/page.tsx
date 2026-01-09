import { redirect } from "next/navigation";

// This page has been consolidated into /admin overview
// Redirect to maintain existing links
export default function AdminAiSetupRedirect() {
    redirect("/admin");
}

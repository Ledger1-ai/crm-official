import { redirect } from "next/navigation";

// This page has been consolidated into the main /admin dashboard (Departments tab)
// Keeping this route as a redirect for bookmarks and existing links

export default function AdminDepartmentsRedirect() {
    redirect("/admin?tab=departments");
}

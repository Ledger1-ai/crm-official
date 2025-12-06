"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, UploadCloud } from "lucide-react";
import { submitApplication } from "@/actions/submit-application";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ApplicationForm({ jobId, jobTitle }: { jobId: string, jobTitle: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        formData.append("jobId", jobId);

        try {
            const result = await submitApplication(formData);
            if (result.success) {
                toast.success("Application submitted successfully!");
                router.push("/careers?success=true");
            } else {
                toast.error(result.message || "Something went wrong.");
            }
        } catch (error) {
            toast.error("Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Full Name *</Label>
                    <Input id="name" name="name" required placeholder="John Doe" className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
                    <Input id="email" name="email" type="email" required placeholder="john@example.com" className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                    <Input id="phone" name="phone" required placeholder="+1 (555) 000-0000" className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="text-slate-300">LinkedIn URL</Label>
                    <Input id="linkedinUrl" name="linkedinUrl" placeholder="https://linkedin.com/in/..." className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="resumeUrl" className="text-slate-300">Resume Link / URL *</Label>
                <div className="relative">
                    <Input id="resumeUrl" name="resumeUrl" required placeholder="Link to Google Drive / Dropbox PDF..." className="bg-white/5 border-white/10 text-white focus:border-primary/50 pl-10" />
                    <UploadCloud className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                </div>
                <p className="text-xs text-slate-500">Please provide a accessible link to your resume (PDF preferred).</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="portfolioUrl" className="text-slate-300">Portfolio / Website (Optional)</Label>
                <Input id="portfolioUrl" name="portfolioUrl" placeholder="https://..." className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="coverLetter" className="text-slate-300">Cover Letter *</Label>
                <Textarea id="coverLetter" name="coverLetter" required placeholder="Tell us why you're a great fit..." className="min-h-[150px] bg-white/5 border-white/10 text-white focus:border-primary/50" />
            </div>

            <div className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20">
                    {isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Application...</>
                    ) : (
                        "Submit Application"
                    )}
                </Button>
                <p className="text-center text-xs text-slate-500 mt-4">
                    By submitting, you agree to our privacy policy and potential background checks.
                </p>
            </div>
        </form>
    );
}

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
    const [resumeType, setResumeType] = useState<"link" | "file">("link");
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 10) value = value.slice(0, 10);

        if (value.length > 6) {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
        } else if (value.length > 3) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }

        e.target.value = value;
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        formData.append("jobId", jobId);

        try {
            // Handle file upload if 'file' type selected
            if (resumeType === "file") {
                const fileInput = event.currentTarget.querySelector('#resumeFile') as HTMLInputElement;
                const file = fileInput?.files?.[0];

                if (file) {
                    setUploading(true);
                    const uploadData = new FormData();
                    uploadData.append("file", file);

                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: uploadData,
                    });

                    if (!uploadRes.ok) throw new Error("Resume upload failed");

                    const uploadJson = await uploadRes.json();
                    // Assuming /api/upload returns { document: { document_file_url: string } } 
                    // or similar structure based on search results. 
                    // Let's inspect the searched file content again to be sure:
                    // It returns { ok: true, document: doc } where doc has document_file_url

                    const fileUrl = uploadJson.document?.document_file_url || uploadJson.url; // Fallback
                    if (fileUrl) {
                        formData.set("resumeUrl", fileUrl);
                    } else {
                        throw new Error("Failed to get resume URL");
                    }
                    setUploading(false);
                } else {
                    throw new Error("Please select a resume file");
                }
            }

            const result = await submitApplication(formData);
            if (result.success) {
                toast.success("Application submitted successfully!");
                router.push("/careers?success=true");
            } else {
                toast.error(result.message || "Something went wrong.");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit. Please try again.");
            setUploading(false);
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
                    <Input
                        id="phone"
                        name="phone"
                        required
                        placeholder="(555) 000-0000"
                        className="bg-white/5 border-white/10 text-white focus:border-primary/50"
                        onChange={handlePhoneChange}
                        maxLength={14}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="text-slate-300">LinkedIn URL</Label>
                    <Input id="linkedinUrl" name="linkedinUrl" placeholder="https://linkedin.com/in/..." className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                    <Label className="text-slate-300">Resume *</Label>
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setResumeType("link")}
                            className={`text-xs px-3 py-1 rounded-md transition-colors ${resumeType === "link" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
                        >
                            Link
                        </button>
                        <button
                            type="button"
                            onClick={() => setResumeType("file")}
                            className={`text-xs px-3 py-1 rounded-md transition-colors ${resumeType === "file" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
                        >
                            Upload
                        </button>
                    </div>
                </div>

                {resumeType === "link" ? (
                    <div className="relative">
                        <Input id="resumeUrl" name="resumeUrl" required placeholder="Link to Google Drive / Dropbox PDF..." className="bg-white/5 border-white/10 text-white focus:border-primary/50 pl-10" />
                        <UploadCloud className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    </div>
                ) : (
                    <div className="relative">
                        <Input
                            id="resumeFile"
                            name="resumeFile"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            required
                            className="bg-white/5 border-white/10 text-white focus:border-primary/50 file:bg-white/10 file:text-white file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-4 file:text-sm hover:file:bg-white/20"
                        />
                    </div>
                )}
                <p className="text-xs text-slate-500">
                    {resumeType === "link" ? "Please provide an accessible link to your resume (PDF preferred)." : "Upload your resume (PDF, DOC, DOCX up to 10MB)."}
                </p>
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
                <Button type="submit" disabled={isSubmitting || uploading} className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20">
                    {isSubmitting || uploading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {uploading ? "Uploading Resume..." : "Submitting Application..."}</>
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

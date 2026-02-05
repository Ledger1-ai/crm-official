"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner"; // Using sonner as it's likely used, or generic toast

// Define types locally for now or import shared types
interface FormField {
    id: string;
    name: string;
    label: string;
    field_type: string;
    placeholder?: string;
    help_text?: string;
    is_required: boolean;
    options?: any; // JSON
    position: number;
}

interface Form {
    id: string;
    name: string;
    description?: string;
    status: string;
    fields: FormField[];
    primary_color?: string;
    custom_css?: string; // JSON string of theme
    submission_behavior: "MESSAGE" | "REDIRECT";
    redirect_url?: string;
    success_message?: string;
}

export default function PublicFormPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Theme state
    const [theme, setTheme] = useState<any>({});

    const fetchForm = useCallback(async () => {
        try {
            const res = await fetch(`/api/forms/public/${slug}`);
            if (!res.ok) throw new Error("Form not found");
            const data = await res.json();
            setForm(data);

            // Parse custom CSS / Theme
            if (data.custom_css) {
                try {
                    setTheme(JSON.parse(data.custom_css));
                } catch (e) {
                    console.error("Failed to parse theme", e);
                }
            }

            // Track View
            await fetch(`/api/forms/${data.id}/view`, {
                method: "POST",
                body: JSON.stringify({
                    referrer: document.referrer,
                    user_agent: navigator.userAgent
                })
            });

        } catch (err) {
            setError("This form is currently unavailable.");
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        if (slug) {
            fetchForm();
        }
    }, [slug, fetchForm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/forms/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    form_id: form.id,
                    data: formData
                })
            });

            if (!res.ok) throw new Error("Submission failed");

            // Handle success behavior
            if (form.submission_behavior === "REDIRECT" && form.redirect_url) {
                window.location.href = form.redirect_url;
            } else {
                setSubmitted(true);
                toast.success("Form submitted successfully");
            }

        } catch (err) {
            toast.error("Failed to submit form. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !form) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-500">Error</CardTitle>
                        <CardDescription>{error || "Form not found"}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Apply Theme Styles
    const containerStyle = {
        fontFamily: theme.fontFamily || 'inherit',
        backgroundColor: theme.backgroundColor || '#ffffff',
        color: theme.textColor || '#333333',
        borderRadius: theme.borderRadius || '8px',
    };

    const buttonStyle = {
        backgroundColor: theme.primaryColor || form.primary_color || '#000000',
        color: theme.buttonTextColor || '#ffffff',
        borderRadius: theme.borderRadius || '8px',
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-lg shadow-md" style={{ borderRadius: theme.borderRadius }}>
                    <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold">Success!</h2>
                        <p className="text-muted-foreground">
                            {form.success_message || "Thank you for your submission!"}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50/50 flex flex-col items-center">
            <style jsx global>{`
                body { background-color: ${theme.backgroundColor || '#f9fafb'}; }
            `}</style>

            <form onSubmit={handleSubmit} className="w-full max-w-lg">
                <div style={containerStyle} className="p-6 md:p-8 shadow-sm border bg-white">
                    <div className="mb-8 space-y-2">
                        <h1 className="text-2xl font-bold">{form.name}</h1>
                        {form.description && (
                            <p className="text-sm opacity-80">{form.description}</p>
                        )}
                    </div>

                    <div className="space-y-6">
                        {form.fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                {/* Hide label for CONSENT as it's rendered next to checkbox */}
                                {field.field_type !== 'CONSENT' && (
                                    <Label
                                        htmlFor={field.id}
                                        style={{ color: theme.labelColor || theme.textColor }}
                                    >
                                        {field.label}{field.is_required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                )}

                                {field.field_type === 'TEXT' && (
                                    <Input
                                        id={field.id}
                                        required={field.is_required}
                                        placeholder={field.placeholder}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        style={{
                                            backgroundColor: theme.inputBgColor,
                                            borderColor: theme.borderColor,
                                            borderRadius: theme.borderRadius
                                        }}
                                    />
                                )}

                                {field.field_type === 'EMAIL' && (
                                    <Input
                                        id={field.id}
                                        type="email"
                                        required={field.is_required}
                                        placeholder={field.placeholder}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        style={{
                                            backgroundColor: theme.inputBgColor,
                                            borderColor: theme.borderColor,
                                            borderRadius: theme.borderRadius
                                        }}
                                    />
                                )}

                                {field.field_type === 'TEXTAREA' && (
                                    <Textarea
                                        id={field.id}
                                        required={field.is_required}
                                        placeholder={field.placeholder}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        style={{
                                            backgroundColor: theme.inputBgColor,
                                            borderColor: theme.borderColor,
                                            borderRadius: theme.borderRadius
                                        }}
                                    />
                                )}

                                {field.field_type === 'CONSENT' && (
                                    <div className="flex items-start space-x-2 pt-2">
                                        <Checkbox
                                            id={field.id}
                                            required={field.is_required}
                                            onCheckedChange={(checked) => handleInputChange(field.name, checked)}
                                        />
                                        <label
                                            htmlFor={field.id}
                                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            style={{ color: theme.labelColor || theme.textColor }}
                                        >
                                            {field.label}
                                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                    </div>
                                )}

                                {/* Add other field types as needed */}
                            </div>
                        ))}
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-8"
                        disabled={submitting}
                        style={buttonStyle}
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit
                    </Button>
                </div>
            </form>

            <div className="mt-8 text-xs text-muted-foreground">
                Powered by BasaltCRM
            </div>
        </div>
    );
}

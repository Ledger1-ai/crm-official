"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const error = searchParams.get("error");

    // Extract locale from pathname (e.g., /en/admin/login -> en)
    const locale = pathname.split("/")[1] || "en";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                toast.error("Invalid credentials");
                setLoading(false);
            } else {
                toast.success("Logged in successfully");
                // Use locale-aware redirect
                router.push(`/${locale}/cms`);
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] text-white">
            <div className="w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                    <div className="h-12 w-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">CMS Admin Login</h1>
                    <p className="text-gray-400 mt-2">Enter your credentials to access the dashboard</p>
                </div>

                {error === "unauthorized" && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                        <AlertCircle className="h-5 w-5" />
                        You do not have admin permissions.
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="admin@basalthq.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-500">
                    &copy; 2025 BasaltHQ. All rights reserved.
                </div>
            </div>
        </div>
    );
}

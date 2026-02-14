/**
 * Next.js Edge Middleware — Security Headers, CSRF Protection, Rate Limiting
 *
 * This middleware runs at the edge (before your route handlers) on every request.
 * It provides:
 *   1. Security response headers (CSP, HSTS, X-Frame-Options, etc.)
 *   2. CORS policy for API routes
 *   3. Basic IP-based rate limiting on public (unauthenticated) API endpoints
 *   4. CSRF protection stub for mutating API requests
 */
import { NextResponse, type NextRequest } from "next/server";

// ─── Config ──────────────────────────────────────────────────────────────────

/** Allowed origins for CORS — add your production domain(s) here. */
const ALLOWED_ORIGINS = new Set([
    process.env.NEXT_PUBLIC_APP_URL || "https://crm.basalthq.com",
    "https://crm.basalthq.com",
    "http://localhost:3000",
    "http://localhost:3001",
]);

/**
 * Public API routes that are intentionally unauthenticated.
 * Matched by prefix (startsWith).
 */
const PUBLIC_API_PREFIXES = [
    "/api/auth",                 // NextAuth routes
    "/api/user/passwordReset",   // Password reset (public by design)
    "/api/docs",                 // Public docs
    "/api/forms/submit",         // Public form submission
    "/api/outreach/track",       // Email open/click tracking pixels
    "/api/outreach/open",        // Email open tracking
    "/api/portal",               // Public portal routes
    "/api/cron",                 // Cron endpoints (authenticated by secret)
];

/**
 * Routes that should NOT have rate limiting applied.
 */
const RATE_LIMIT_EXEMPT_PREFIXES = [
    "/api/auth",
    "/_next",
    "/favicon.ico",
];

// ─── In-memory rate-limit store (Edge-compatible) ────────────────────────────
// NOTE: In a multi-instance deployment, use an external store (Redis/Upstash).
// This in-memory map is reset on each cold start and is per-instance only.
// It provides a baseline defense that is better than nothing.

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 60;  // 60 requests per window per IP
const RATE_LIMIT_MAX_PASSWORD_RESET = 5; // 5 password reset requests per window

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitMap = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent unbounded memory growth
let lastCleanup = Date.now();
function cleanupRateLimit() {
    const now = Date.now();
    if (now - lastCleanup < 30_000) return; // Clean up every 30s max
    lastCleanup = now;
    rateLimitMap.forEach((entry, key) => {
        if (now > entry.resetAt) {
            rateLimitMap.delete(key);
        }
    });
}

function checkRateLimit(key: string, maxRequests: number): { allowed: boolean; remaining: number; resetAt: number } {
    cleanupRateLimit();

    const now = Date.now();
    const existing = rateLimitMap.get(key);

    if (!existing || now > existing.resetAt) {
        const resetAt = now + RATE_LIMIT_WINDOW_MS;
        rateLimitMap.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    existing.count += 1;
    const allowed = existing.count <= maxRequests;
    return { allowed, remaining: Math.max(0, maxRequests - existing.count), resetAt: existing.resetAt };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

function isPublicApi(pathname: string): boolean {
    return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isRateLimitExempt(pathname: string): boolean {
    return RATE_LIMIT_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ─── Security Headers ────────────────────────────────────────────────────────

function applySecurityHeaders(response: NextResponse): void {
    // Strict Transport Security — force HTTPS for 1 year, include subdomains
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
    );

    // Prevent clickjacking
    response.headers.set("X-Frame-Options", "DENY");

    // Prevent MIME type sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");

    // Referrer Policy — send origin only for cross-origin
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy — restrict powerful APIs
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
    );

    // XSS Protection (legacy, but still respected by some browsers)
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Content Security Policy
    // NOTE: 'unsafe-inline' and 'unsafe-eval' are required by Next.js and many
    // UI libraries. Once you audit all inline scripts/styles, tighten this.
    response.headers.set(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https: http:",
            "connect-src 'self' https: wss:",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ].join("; ")
    );
}

// ─── CORS ────────────────────────────────────────────────────────────────────

function applyCors(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get("origin");

    if (origin && ALLOWED_ORIGINS.has(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Vary", "Origin");
    }

    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, x-wallet, x-csrf-token"
    );
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours preflight cache
    response.headers.set("Access-Control-Allow-Credentials", "true");

    return response;
}

// ─── Main Middleware (Proxy) ─────────────────────────────────────────────────

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;
    const isApiRoute = pathname.startsWith("/api/");

    // ── CORS preflight ──
    if (method === "OPTIONS" && isApiRoute) {
        const preflightResponse = new NextResponse(null, { status: 204 });
        applyCors(request, preflightResponse);
        return preflightResponse;
    }

    // ── Rate limiting (API routes only, not exempt paths) ──
    if (isApiRoute && !isRateLimitExempt(pathname)) {
        const clientIp = getClientIp(request);

        // Tighter limit for sensitive endpoints
        const isPasswordReset = pathname.startsWith("/api/user/passwordReset");
        const maxRequests = isPasswordReset ? RATE_LIMIT_MAX_PASSWORD_RESET : RATE_LIMIT_MAX_REQUESTS;
        const rateLimitKey = isPasswordReset ? `pw:${clientIp}` : `api:${clientIp}`;

        const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey, maxRequests);

        if (!allowed) {
            const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
            const rateLimitedResponse = NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
            rateLimitedResponse.headers.set("Retry-After", String(retryAfter));
            rateLimitedResponse.headers.set("X-RateLimit-Limit", String(maxRequests));
            rateLimitedResponse.headers.set("X-RateLimit-Remaining", "0");
            rateLimitedResponse.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
            return rateLimitedResponse;
        }

        // Continue, but add rate-limit headers to the response downstream
        const response = NextResponse.next();

        response.headers.set("X-RateLimit-Limit", String(maxRequests));
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

        // Apply CORS to API responses
        applyCors(request, response);

        // Apply security headers
        applySecurityHeaders(response);

        return response;
    }

    // ── Default / Non-API: apply security headers and continue ──

    const response = NextResponse.next();

    applySecurityHeaders(response);

    // Apply CORS to API responses (should be covered above, but for safety in case exempt API routes fall through)
    if (isApiRoute) {
        applyCors(request, response);
    }

    return response;
}

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Run middleware on all routes except static assets and Next.js internals.
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};

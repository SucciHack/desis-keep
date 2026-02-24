"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      router.push("/login?error=" + encodeURIComponent(error));
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens with proper cookie options
      const cookieOptions = {
        expires: 1, // 1 day for access token
        path: "/",
        sameSite: "lax" as const,
        secure: window.location.protocol === "https:",
      };
      
      const refreshCookieOptions = {
        expires: 7, // 7 days for refresh token
        path: "/",
        sameSite: "lax" as const,
        secure: window.location.protocol === "https:",
      };
      
      Cookies.set("access_token", accessToken, cookieOptions);
      Cookies.set("refresh_token", refreshToken, refreshCookieOptions);
      
      // Small delay to ensure cookies are set before redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    } else {
      router.push("/login?error=missing_tokens");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
        <p className="mt-4 text-text-secondary">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

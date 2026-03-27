"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

type LoginDemoProps = {
  user: User | null;
};

type Mode = "signup" | "signin"

export default function LoginDemo({ user }: LoginDemoProps) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [resetSent, setResetSent] = useState(false); // forgot password
  const pathname = usePathname();

  const router = useRouter();
  /*
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Signed in successfully");
    }
  }
  */

/*
  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setStatus("Signed out successfully");
  }
*/
  const locale = pathname.split("/")[1] || "en";

  // onAuthStateChange listener
  useEffect(() => {
    const { 
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {

        setCurrentUser(session?.user ?? null);

        // redirect when the session changes
        if (session?.user) {
          const locale = pathname.split("/")[1] || "en";
          router.replace(`/${locale}`);
          //router.replace("/"); // prevents the login page staying in browser history
          router.refresh();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router, pathname])

  // Google OAuth
  //-------------------------
  async function handleGoogleLogin() {
    const locale = pathname.split("/")[1] || "en";
  
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Pass "/" as the next destination so it goes to the dashboard/home
        redirectTo: `${window.location.origin}/${locale}/auth/callback?next=/`,
      },
    });

    /*
    const locale = pathname.split("/")[1] || "en";

    // 1. Determine the base callback URL
    const callbackUrl = `${window.location.origin}/${locale}/auth/callback`;

    // 2. Add the 'next' parameter correctly
    // Use "/" to go to the home page after login
    const redirectTo = `${callbackUrl}?next=/`;

    console.log("Redirecting to Supabase with:", redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo,
      },
    });

    if (error) console.error("OAuth Error:", error.message);
    */
    /*
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        //redirectTo: `${window.location.origin}/google-login`,
        //redirectTo: `${window.location.origin}/auth/callback`,
        redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${pathname}`,
        //skipBrowserRedirect: false,
      },
    });*/
  }

  // Email/password login
  //-------------------------
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Processing...");

    // Sign Up (Register with email)
    if (mode == "signup") {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        /*options: {
          emailRedirectTo: `${window.location.origin}`,
        },*/
      });
      if (error) {
        setStatus(error.message);
      } else {
        setStatus("If this email isn't registered yet, you'll receive a confirmation email shortly.");
      }
      console.log({data});
    } else {
      // Sign In (Login)
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setStatus(error.message);
      } else {
        setStatus("Signed in successfully");

        // Redirect to home page
        //router.push("/");
        //router.refresh();
      }
    }
  }

  // Forgot password
  //-------------------------
  async function handleForgotPassword() {
    if (!email) {
      setStatus("⚠️ Enter your email first");
      return;
    }

    setStatus("Sending reset email...");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Password reset email sent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg border border-gray-200">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h1 className="text-xl font-semibold text-gray-800">
            {mode === "signup" ? "Create your account" : "Sign in"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "signup" ? "No credit card required." : "Welcome back! Please sign in to continue"}
          </p>
        </div>

        <div className="px-8 pb-6">

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="relative w-full flex items-center justify-center gap-3 border rounded-lg py-2.5 hover:bg-gray-50 transition"
          >
            <img
              src="/google-icon.svg"
              alt="google"
              className="w-5 h-5"
            />
            Continue with Google
            {/*<span className="absolute right-2 text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-500">
              Last used
            </span>*/}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 text-gray-400 text-sm">
            <div className="flex-1 h-px bg-gray-200"></div>
            or
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative mt-1">

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

              </div>

              {mode === "signin" && (
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              className="w-full mt-2 rounded-lg py-2.5 font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
            >
              Continue
            </button>

          </form>

          {status && (
            <p className="text-sm text-center mt-3 text-gray-600">
              {status}
            </p>
          )}

        </div>

        {/* Footer */}
        <div className="border-t px-8 py-4 text-center text-sm text-gray-600">
          {mode === "signin" ? (
            <>
              Don’t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setStatus("");
                }}
                className="text-blue-500 font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setStatus("");
                }}
                className="text-blue-500 font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Bottom */}
        {/*<div className="text-center text-xs text-gray-400 pb-4">
          Secured by Supabase
        </div>
          */}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      setStatus("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      setStatus("Passwords do not match");
      return;
    }

    setStatus("Updating password...");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setStatus(error.message);
    } else {
      setStatus("✅ Password updated successfully");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg border border-gray-200 p-8">

        <h1 className="text-xl font-semibold text-gray-800 text-center">
          Set new password
        </h1>

        <form onSubmit={handleReset} className="space-y-4 mt-6">

          {/* New password */}
          <div>
            <label className="text-sm text-gray-700">
              New password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label className="text-sm text-gray-700">
              Confirm password
            </label>

            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 rounded-lg py-2.5 font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
          >
            Update password
          </button>

        </form>

        {status && (
          <p className="text-sm text-center mt-4 text-gray-600">
            {status}
          </p>
        )}

      </div>
    </div>
  );
}
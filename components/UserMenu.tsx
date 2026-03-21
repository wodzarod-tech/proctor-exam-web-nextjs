"use client";

import { User } from "@supabase/supabase-js";
import { useState, useRef, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/auth/getUserProfile";

type Props = {
  user: User;
};

export default function UserMenu({ user }: Props) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  console.log("UserMenu.user=",user);
  console.log(user.user_metadata);
  const profile = getUserProfile(user);
  console.log("UserMenu.profile=",profile);

  /*const avatar =
    user.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${user.email}`;
  */
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Avatar */}
      <img
        src={profile.avatar}
        alt="avatar"
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full cursor-pointer border shadow-sm"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-72 rounded-xl border bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in">

          {/* Profile */}
          <div className="flex items-center gap-3 p-4 border-b">

            <img
              src={profile.avatar}
              className="w-10 h-10 rounded-full"
            />

            <div>
              <p className="font-semibold text-sm">
                {profile.name}
                {/*{user.user_metadata?.full_name || "User"}*/}
              </p>

              <p className="text-xs text-gray-500">
                {profile.email}
                {/*{user.email}*/}
              </p>
            </div>

          </div>

          {/* Manage account */}
          {/*<button className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm">
            Manage account
          </button>*/}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm"
          >
            Sign out
          </button>

          <div className="text-center text-xs text-gray-400 py-3 border-t">
            Secured by Supabase
          </div>

        </div>
      )}
    </div>
  );
}
import { User } from "@supabase/supabase-js";

export function getUserProfile(user: User) {
  const meta = user.user_metadata || {};

  const name =
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    user.email?.split("@")[0] ||
    "User";

  const avatar =
    meta.avatar_url ||
    meta.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

  return {
    name,
    email: user.email,
    avatar,
  };
}
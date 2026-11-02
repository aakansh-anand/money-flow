import { useGetMeQuery } from "@/features/auth/services/auth-api";
import { useAppSelector } from "@/redux/hooks";

export function initialsFromName(name?: string) {
  if (!name) return "";
  const char = name.charAt(0);
  return char.toUpperCase();
}

/** Signed-in user from GET /auth/me, plus initials for the profile mark. */
export function useCurrentUser() {
  const status = useAppSelector((state) => state.auth.status);
  const query = useGetMeQuery(undefined, { skip: status !== "authenticated" });

  return {
    user: query.data,
    initials: initialsFromName(query.data?.name),
    isLoading: status === "authenticated" && query.isLoading,
  };
}

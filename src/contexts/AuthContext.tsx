import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase as hsmSupabase } from "@/integrations/supabase/client";
import { citizenSupabase } from "@/lib/citizenSupabase";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole =
  | "Citizen_User"
  | "BusinessOwner_User"
  | "BHW_User"
  | "BSI_User"
  | "Clerk_User"
  | "Captain_User"
  | "LGUAdmin_User"
  | "SysAdmin_User";

export const ROLE_LABELS: Record<UserRole, string> = {
  Citizen_User: "Citizen",
  BusinessOwner_User: "Business Owner",
  BHW_User: "Barangay Health Worker",
  BSI_User: "Sanitary Inspector",
  Clerk_User: "Health Center Staff",
  Captain_User: "City Health Officer",
  LGUAdmin_User: "LGU Admin",
  SysAdmin_User: "System Administrator",
};

/** Citizen profile from Citizen Information subsystem (read-only, not stored in HSM). */
export interface CitizenProfile {
  first_name: string;
  last_name: string;
  contact_number: string | null;
  address: string | null;
  barangay: string | null;
  birthdate: string | null;
  gender?: string | null;
  blood_type?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentRole: UserRole;
  userName: string;
  loading: boolean;
  hasEstablishments: boolean;
  hasRegisteredEstablishments: boolean;
  /** "citizen" = logged in via Citizen Information Supabase; "hsm" = staff via HSM Supabase */
  authRealm: "citizen" | "hsm" | null;
  /** Populated when authRealm === "citizen" — fetched from Citizen DB, not stored in HSM */
  citizenProfile: CitizenProfile | null;
  signIn: (email: string, password: string, userType: "citizen" | "staff") => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("Citizen_User");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasEstablishments, setHasEstablishments] = useState(false);
  const [hasRegisteredEstablishments, setHasRegisteredEstablishments] = useState(false);
  const [authRealm, setAuthRealm] = useState<"citizen" | "hsm" | null>(null);
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile | null>(null);

  const fetchCitizenProfile = useCallback(async (userId: string): Promise<CitizenProfile | null> => {
    // Normalize row from either schema: first_name/last_name/birthdate OR full_name/date_of_birth
    const normalize = (data: Record<string, unknown> | null): CitizenProfile | null => {
      if (!data) return null;
      const first = (data.first_name as string) ?? "";
      const last = (data.last_name as string) ?? "";
      const full = (data.full_name as string) ?? "";
      const [f, l] = first || last ? [first, last] : full ? [full.trim().split(/\s+/)[0] ?? "", full.trim().split(/\s+/).slice(1).join(" ") ?? ""] : ["", ""];
      const birth = (data.birthdate as string | null) ?? (data.date_of_birth as string | null) ?? null;
      const contact = (data.contact_number as string | null) ?? (data.phone as string | null) ?? null;
      return {
        first_name: f,
        last_name: l,
        contact_number: contact,
        address: (data.address as string | null) ?? null,
        barangay: (data.barangay as string | null) ?? null,
        birthdate: birth,
        gender: (data.gender as string | null) ?? null,
        blood_type: (data.blood_type as string | null) ?? null,
      };
    };
    // Fetch all columns so we support both schemas (classmate's Supabase may use full_name, date_of_birth, etc.)
    const { data: byUserId } = await citizenSupabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (byUserId) return normalize(byUserId as Record<string, unknown>);
    const { data: byId } = await citizenSupabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return normalize(byId as Record<string, unknown> | null);
  }, []);

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data } = await hsmSupabase.rpc("get_user_role", { _user_id: userId });
    if (data) {
      const mappedRole = data === "BusinessOwner_User" ? "Citizen_User" : (data as UserRole);
      setCurrentRole(mappedRole);
    }
  }, []);

  const fetchHsmProfile = useCallback(async (userId: string) => {
    const { data } = await hsmSupabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();
    if (data) setUserName((data as { full_name?: string }).full_name || "");
  }, []);

  const fetchEstablishments = useCallback(async (userId: string) => {
    const { data } = await hsmSupabase
      .from("establishments")
      .select("id, status")
      .eq("user_id", userId);
    setHasEstablishments(!!(data && data.length > 0));
    setHasRegisteredEstablishments(!!(data && data.some((e: { status: string }) => e.status === "registered")));
  }, []);

  const applyCitizenSession = useCallback(
    async (citizenUser: User) => {
      setUser(citizenUser);
      setSession(await citizenSupabase.auth.getSession().then((r) => r.data.session));
      setAuthRealm("citizen");
      setCurrentRole("Citizen_User");
      const profile = await fetchCitizenProfile(citizenUser.id);
      setCitizenProfile(profile);
      setUserName(
        profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "" : ""
      );
      await fetchEstablishments(citizenUser.id);
    },
    [fetchCitizenProfile, fetchEstablishments]
  );

  const applyHsmSession = useCallback(
    async (hsmUser: User) => {
      setUser(hsmUser);
      setSession(await hsmSupabase.auth.getSession().then((r) => r.data.session));
      setAuthRealm("hsm");
      setCitizenProfile(null);
      fetchUserRole(hsmUser.id);
      fetchHsmProfile(hsmUser.id);
      fetchEstablishments(hsmUser.id);
    },
    [fetchUserRole, fetchHsmProfile, fetchEstablishments]
  );

  useEffect(() => {
    let mounted = true;
    // Safety: never allow auth loading to hang indefinitely
    const safetyTimeout = setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
    }, 3000);

    const restoreSession = async () => {
      try {
        const [citizenRes, hsmRes] = await Promise.all([
          citizenSupabase.auth.getSession(),
          hsmSupabase.auth.getSession(),
        ]);
        if (!mounted) return;

        const citizenSession = citizenRes.data.session;
        const hsmSession = hsmRes.data.session;

        if (citizenSession?.user) {
          await applyCitizenSession(citizenSession.user);
        } else if (hsmSession?.user) {
          await applyHsmSession(hsmSession.user);
        } else {
          setUser(null);
          setSession(null);
          setAuthRealm(null);
          setCurrentRole("Citizen_User");
          setUserName("");
          setCitizenProfile(null);
          setHasEstablishments(false);
          setHasRegisteredEstablishments(false);
        }
      } catch {
        if (!mounted) return;
        setUser(null);
        setSession(null);
        setAuthRealm(null);
        setCurrentRole("Citizen_User");
        setUserName("");
        setCitizenProfile(null);
        setHasEstablishments(false);
        setHasRegisteredEstablishments(false);
      } finally {
        clearTimeout(safetyTimeout);
        if (mounted) setLoading(false);
      }
    };

    restoreSession();

    const citizenSub = citizenSupabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      try {
        if (session?.user) {
          const hsmSession = await hsmSupabase.auth.getSession();
          if (!hsmSession.data.session?.user) {
            await applyCitizenSession(session.user);
          }
        } else {
          const hsmSession = await hsmSupabase.auth.getSession();
          if (!hsmSession.data.session) {
            setUser(null);
            setSession(null);
            setAuthRealm(null);
            setCurrentRole("Citizen_User");
            setUserName("");
            setCitizenProfile(null);
            setHasEstablishments(false);
            setHasRegisteredEstablishments(false);
          }
        }
      } catch {
        if (!mounted) return;
        setUser(null);
        setSession(null);
        setAuthRealm(null);
        setCurrentRole("Citizen_User");
        setUserName("");
        setCitizenProfile(null);
        setHasEstablishments(false);
        setHasRegisteredEstablishments(false);
      }
    });

    const hsmSub = hsmSupabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      try {
        if (session?.user) {
          const citizenSession = await citizenSupabase.auth.getSession();
          if (!citizenSession.data.session?.user) {
            await applyHsmSession(session.user);
          }
        } else {
          const citizenSession = await citizenSupabase.auth.getSession();
          if (!citizenSession.data.session) {
            setUser(null);
            setSession(null);
            setAuthRealm(null);
            setCurrentRole("Citizen_User");
            setUserName("");
            setCitizenProfile(null);
            setHasEstablishments(false);
            setHasRegisteredEstablishments(false);
          }
        }
      } catch {
        if (!mounted) return;
        setUser(null);
        setSession(null);
        setAuthRealm(null);
        setCurrentRole("Citizen_User");
        setUserName("");
        setCitizenProfile(null);
        setHasEstablishments(false);
        setHasRegisteredEstablishments(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      citizenSub.data.subscription.unsubscribe();
      hsmSub.data.subscription.unsubscribe();
    };
  }, [applyCitizenSession, applyHsmSession]);

  const signIn = async (
    email: string,
    password: string,
    _userType: "citizen" | "staff"
  ): Promise<{ error: Error | null }> => {
    // Lenient login: first try citizen Supabase, then fall back to HSM/staff Supabase.
    // This removes the need for users to pick the correct portal up-front.
    try {
      const { data, error } = await citizenSupabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        await applyCitizenSession(data.user);
        return { error: null };
      }
    } catch {
      // Ignore and fall through to HSM login
    }

    try {
      const { data, error } = await hsmSupabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        await applyHsmSession(data.user);
        return { error: null };
      }
      if (error) {
        return { error: error as Error };
      }
    } catch {
      // Fall through to generic error
    }

    return { error: new Error("Invalid email or password.") };
  };

  const signOut = async () => {
    // Clear state immediately so UI updates (no endless "Loading...")
    setUser(null);
    setSession(null);
    setAuthRealm(null);
    setCurrentRole("Citizen_User");
    setUserName("");
    setCitizenProfile(null);
    setHasEstablishments(false);
    setHasRegisteredEstablishments(false);
    setLoading(false);

    // Sign out from both Supabase clients (then hard reset the app)
    await Promise.allSettled([citizenSupabase.auth.signOut(), hsmSupabase.auth.signOut()]);

    // Clear stored tokens / cached auth artifacts
    try {
      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
    } catch {
      // ignore storage errors (e.g. browser restrictions)
    }

    // Force full application reset to avoid stuck auth state
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        currentRole,
        userName,
        loading,
        hasEstablishments,
        hasRegisteredEstablishments,
        authRealm,
        citizenProfile,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

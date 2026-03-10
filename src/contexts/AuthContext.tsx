import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole =
  | "Resident_User"
  | "BusinessOwner_User"
  | "BHW_User"
  | "BSI_User"
  | "Clerk_User"
  | "Captain_User"
  | "SysAdmin_User";

export const ROLE_LABELS: Record<UserRole, string> = {
  Resident_User: "Resident",
  BusinessOwner_User: "Business Owner",
  BHW_User: "Barangay Health Worker",
  BSI_User: "Sanitary Inspector",
  Clerk_User: "Health Office Clerk",
  Captain_User: "Municipal Health Officer",
  SysAdmin_User: "System Administrator",
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentRole: UserRole;
  userName: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("Resident_User");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.rpc('get_user_role', { _user_id: userId });
    if (data) {
      setCurrentRole(data as UserRole);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single();
    if (data) {
      setUserName(data.full_name || '');
    }
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setCurrentRole("Resident_User");
          setUserName("");
        }
        setLoading(false);
      }
    );

    // THEN check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCurrentRole("Resident_User");
    setUserName("");
  };

  return (
    <AuthContext.Provider value={{ user, session, currentRole, userName, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

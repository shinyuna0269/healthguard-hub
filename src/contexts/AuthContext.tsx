import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentRole: UserRole;
  userName: string;
  loading: boolean;
  hasEstablishments: boolean;
  hasRegisteredEstablishments: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.rpc('get_user_role', { _user_id: userId });
    if (data) {
      const mappedRole = data === "BusinessOwner_User" ? "Citizen_User" : (data as UserRole);
      setCurrentRole(mappedRole);
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

  const fetchEstablishments = async (userId: string) => {
    const { data } = await supabase
      .from('establishments')
      .select('id, status')
      .eq('user_id', userId);
    setHasEstablishments(!!(data && data.length > 0));
    setHasRegisteredEstablishments(!!(data && data.some((e: { status: string }) => e.status === 'registered')));
  };

  const fetchUserData = (userId: string) => {
    fetchUserRole(userId);
    fetchProfile(userId);
    fetchEstablishments(userId);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setCurrentRole("Citizen_User");
          setUserName("");
          setHasEstablishments(false);
          setHasRegisteredEstablishments(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
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
    setCurrentRole("Citizen_User");
    setUserName("");
    setHasEstablishments(false);
    setHasRegisteredEstablishments(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, currentRole, userName, loading, hasEstablishments, hasRegisteredEstablishments, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

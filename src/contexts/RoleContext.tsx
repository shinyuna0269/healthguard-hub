import React, { createContext, useContext, useState } from "react";

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

interface RoleContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  userName: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>("Captain_User");

  const userName = ROLE_LABELS[currentRole];

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, userName }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};

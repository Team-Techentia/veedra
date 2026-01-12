import { UserRole } from "./auth.enums";

export interface AuthenticatedUser {
  _id: string;
  email?: string;
  firstName?: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  isAdmin?: boolean;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  branchId?: string;
  authorityLevel: number;
  // scopes: Permission[];
}
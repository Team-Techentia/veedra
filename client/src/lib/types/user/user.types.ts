// @/lib/types/user/user.types.ts (Updated)

import { UserRole } from "../auth/auth.enums";

export interface UserType {
  _id: string;
  email?: string;
  firstName?: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  isAdmin?: boolean;
}

export interface UserProfileType {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: UserRole;
  balance: number;
  points: number;
  status: string;
  isActive: boolean;
  isDeleted: boolean;
  isAdmin: boolean;
  deletedAt: string | null;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;

  metadata: {
    [key: string]: string;
  };
}
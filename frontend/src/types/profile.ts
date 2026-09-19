/** Mirrors the UserDto returned by the backend. */
export interface ProfileUser {
  id: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}
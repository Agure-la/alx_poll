// User types
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

// Poll types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  expiresAt?: Date;
}

// Vote types
export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: Date;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// Form types
export interface CreatePollForm {
  title: string;
  description?: string;
  options: string[];
  expiresAt?: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthService } from "@/lib/auth";
import { RegisterCredentials } from "@/types";
import { isValidEmail, isValidPassword } from "@/lib/utils";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isValidEmail(credentials.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (credentials.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long";
    }

    if (!isValidPassword(credentials.password)) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (credentials.password !== credentials.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const user = await AuthService.register(credentials);
      if (user) {
        onSuccess?.();
      } else {
        setErrors({ general: "Registration failed. Please try again." });
      }
    } catch (err) {
      setErrors({ general: "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Sign up to start creating and participating in polls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              required
            />
            {errors.email && (
              <div className="text-sm text-red-600">{errors.email}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              required
            />
            {errors.username && (
              <div className="text-sm text-red-600">{errors.username}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
            {errors.password && (
              <div className="text-sm text-red-600">{errors.password}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={credentials.confirmPassword}
              onChange={(e) =>
                setCredentials({ ...credentials, confirmPassword: e.target.value })
              }
              required
            />
            {errors.confirmPassword && (
              <div className="text-sm text-red-600">{errors.confirmPassword}</div>
            )}
          </div>
          {errors.general && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {errors.general}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

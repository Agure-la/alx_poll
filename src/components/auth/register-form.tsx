"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { RegisterCredentials } from "@/types";
import { isValidEmail, isValidPassword } from "@/lib/utils";

/**
 * A form for users to create a new account.
 * It handles user input, form validation, submission, and displays error messages.
 */
export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validates the registration form.
   * It checks for a valid email, username length, password strength, and if the passwords match.
   * @returns A boolean indicating whether the form is valid.
   */
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

  /**
   * Handles the form submission.
   * It validates the form, calls the `register` function from the authentication context,
   * and redirects the user to their profile page on success.
   * @param e The form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    console.log('Submitting registration form with credentials:', credentials);

    try {
      const user = await register(credentials);
      console.log('Registration response from auth context:', user);
      if (user) {
        // On successful registration, redirect the user to their profile page.
        router.push("/auth/profile");
      } else {
        setErrors({ general: "Registration failed. Please try again." });
      }
    } catch (err) {
      console.error('An unexpected error occurred during registration:', err);
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
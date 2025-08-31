"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface HeaderProps {
  user?: {
    id: string;
    email: string;
    username: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              Polly
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <nav className="flex items-center space-x-4">
              <Link
                href="/polls"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Browse Polls
              </Link>
              {user && (
                <Link
                  href="/polls/create"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Create Poll
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.username}</span>
                <Button variant="outline" size="sm">
                  <Link href="/auth/profile">Profile</Link>
                </Button>
                <Button variant="ghost" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm">
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

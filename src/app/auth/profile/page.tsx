"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AuthUser, Poll } from "@/types";
import { AuthService } from "@/lib/auth";
import { PollAPI } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", email: "" });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setEditData({
            username: currentUser.username,
            email: currentUser.email,
          });

          const polls = await PollAPI.getUserPolls(currentUser.id);
          setUserPolls(polls);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const updatedUser = await AuthService.updateProfile(user.id, editData);
      if (updatedUser) {
        setUser(updatedUser);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600">Please sign in to view your profile.</p>
          <Button className="mt-4">
            <a href="/auth/login">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account settings and view your polls</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editData.username}
                    onChange={(e) =>
                      setEditData({ ...editData, username: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        username: user.username,
                        email: user.email,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Username</Label>
                  <p className="text-sm mt-1">{user.username}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm mt-1">{user.email}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* User's Polls */}
        <Card>
          <CardHeader>
            <CardTitle>Your Polls</CardTitle>
            <CardDescription>
              Polls you've created ({userPolls.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userPolls.length > 0 ? (
              <div className="space-y-4">
                {userPolls.map((poll) => (
                  <div
                    key={poll.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{poll.title}</h3>
                        {poll.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {poll.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={poll.isActive ? "default" : "secondary"}>
                            {poll.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {poll.options.reduce((sum, opt) => sum + opt.votes, 0)} votes
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <a href={`/polls/${poll.id}`}>View</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You haven't created any polls yet.</p>
                <Button>
                  <a href="/polls/create">Create Your First Poll</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

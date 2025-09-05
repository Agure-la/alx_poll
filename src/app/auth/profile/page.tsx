"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Poll } from "@/types";
import { PollAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * The user profile page.
 * This page displays the user's account information and a list of the polls they have created.
 * It is a protected route, so only authenticated users can access it.
 */
function ProfilePage() {
  const { user, loading } = useAuth();
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", email: "" });

  useEffect(() => {
    // When the user is loaded, we fetch their polls and set the edit data.
    if (user) {
      setEditData({ username: user.username, email: user.email });
      const loadPolls = async () => {
        const polls = await PollAPI.getUserPolls(user.id);
        setUserPolls(polls);
      };
      loadPolls();
    }
  }, [user]);

  /**
   * Handles saving the user's profile information.
   * @todo Implement the logic to save the user's profile.
   */
  const handleSaveProfile = async () => {
    // Implement save profile logic here
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute>
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
                        if (user) {
                          setEditData({
                            username: user.username,
                            email: user.email,
                          });
                        }
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
                    <p className="text-sm mt-1">{user?.username}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm mt-1">{user?.email}</p>
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
    </ProtectedRoute>
  );
}

export default ProfilePage;
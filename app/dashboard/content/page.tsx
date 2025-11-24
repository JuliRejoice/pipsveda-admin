'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Instagram, Save } from 'lucide-react';

export default function ContentManagement() {
  const [instagramProfile, setInstagramProfile] = useState({
    username: '@tradingpro',
    bio: 'Professional Trading Education & AlgoBot Solutions',
    followers: '12.5K',
    following: '1,234',
    posts: '456'
  });

  const handleInstagramUpdate = () => {
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Instagram Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Instagram className="h-5 w-5 mr-2" />
            Instagram Profile Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={instagramProfile.username}
                onChange={(e) => setInstagramProfile({...instagramProfile, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followers">Followers</Label>
              <Input
                id="followers"
                value={instagramProfile.followers}
                onChange={(e) => setInstagramProfile({...instagramProfile, followers: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="following">Following</Label>
              <Input
                id="following"
                value={instagramProfile.following}
                onChange={(e) => setInstagramProfile({...instagramProfile, following: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="posts">Posts</Label>
              <Input
                id="posts"
                value={instagramProfile.posts}
                onChange={(e) => setInstagramProfile({...instagramProfile, posts: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={instagramProfile.bio}
              onChange={(e) => setInstagramProfile({...instagramProfile, bio: e.target.value})}
              rows={3}
            />
          </div>
          
          <Button onClick={handleInstagramUpdate}>
            <Save className="h-4 w-4 mr-2" />
            Update Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
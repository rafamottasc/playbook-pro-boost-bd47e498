import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  full_name: string;
  avatar_url: string | null;
  gender: string | null;
  points: number;
  team: string | null;
  creci: string | null;
}

const CACHE_KEY = "user_profile_cache";
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes - optimized caching

interface CacheData {
  profile: Profile;
  timestamp: number;
  userId: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    loadProfile();

    // Listen for profile updates from other components
    const handleProfileUpdate = (event: CustomEvent) => {
      const { avatar_url } = event.detail;
      
      setProfile(prev => {
        if (!prev) return prev;
        
        const updatedProfile = { ...prev, avatar_url };
        
        // Update cache immediately
        setCachedProfile(user.id, updatedProfile);
        
        return updatedProfile;
      });
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);

    // 🔄 REALTIME: Listen for profile changes (block/unblock by admin)
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated via realtime:', payload);
          
          // Invalidate cache and reload
          localStorage.removeItem(CACHE_KEY);
          
          // Update profile state with new data
          if (payload.new) {
            const updatedProfile: Profile = {
              full_name: payload.new.full_name,
              avatar_url: payload.new.avatar_url,
              gender: payload.new.gender,
              points: payload.new.points || 0,
              team: payload.new.team,
              creci: payload.new.creci,
            };
            setProfile(updatedProfile);
            setCachedProfile(user.id, updatedProfile);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    // Check cache first
    const cachedData = getCachedProfile(user.id);
    if (cachedData) {
      setProfile(cachedData);
      setLoading(false);
      return;
    }

    // If no cache, fetch from database
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, gender, points, team, creci")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        const profileData: Profile = {
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          gender: data.gender,
          points: data.points || 0,
          team: data.team,
          creci: data.creci,
        };
        setProfile(profileData);
        setCachedProfile(user.id, profileData);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCachedProfile = (userId: string): Profile | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid and for the same user
      if (
        cacheData.userId === userId &&
        now - cacheData.timestamp < CACHE_TTL
      ) {
        return cacheData.profile;
      }

      // Cache expired or different user, remove it
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  };

  const setCachedProfile = (userId: string, profile: Profile) => {
    try {
      const cacheData: CacheData = {
        profile,
        timestamp: Date.now(),
        userId,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    // Clear cache to force refresh
    localStorage.removeItem(CACHE_KEY);
    await loadProfile();
  };

  return { profile, loading, refreshProfile };
};

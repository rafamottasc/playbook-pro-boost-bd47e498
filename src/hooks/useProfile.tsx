import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  full_name: string;
  avatar_url: string | null;
  gender: string | null;
  points: number;
}

const CACHE_KEY = "user_profile_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
        .select("full_name, avatar_url, gender, points")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        const profileData: Profile = {
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          gender: data.gender,
          points: data.points || 0,
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

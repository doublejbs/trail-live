import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserLocation } from '@/types/map';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeLocationsParams {
  sessionId: string | null;
  userId: string | null;
}

interface UseRealtimeLocationsReturn {
  locations: UserLocation[];
  updateLocation: (lat: number, lon: number) => Promise<void>;
}

function useRealtimeLocations({
  sessionId,
  userId,
}: UseRealtimeLocationsParams): UseRealtimeLocationsReturn {
  const [locations, setLocations] = useState<UserLocation[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // 초기 위치 데이터 로드
      const { data: initialLocations } = await supabase
        .from('locations')
        .select(
          `
          id,
          user_id,
          lat,
          lon,
          updated_at,
          users:user_id (nickname)
        `
        )
        .eq('session_id', sessionId);

      if (initialLocations) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedLocations: UserLocation[] = initialLocations.map((loc: any) => ({
          userId: loc.user_id,
          nickname: loc.users?.nickname || '알 수 없음',
          lat: loc.lat,
          lon: loc.lon,
          updatedAt: loc.updated_at,
        }));
        setLocations(formattedLocations);
      }

      // Realtime 구독
      channel = supabase
        .channel(`session-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'locations',
            filter: `session_id=eq.${sessionId}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newLocation = payload.new as {
                user_id: string;
                lat: number;
                lon: number;
                updated_at: string;
              };

              // 사용자 닉네임 조회
              const { data: userData } = await supabase
                .from('users')
                .select('nickname')
                .eq('id', newLocation.user_id)
                .single();

              const userLocation: UserLocation = {
                userId: newLocation.user_id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                nickname: (userData as any)?.nickname || '알 수 없음',
                lat: newLocation.lat,
                lon: newLocation.lon,
                updatedAt: newLocation.updated_at,
              };

              setLocations((prev) => {
                const existingIndex = prev.findIndex((loc) => loc.userId === userLocation.userId);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = userLocation;
                  return updated;
                } else {
                  return [...prev, userLocation];
                }
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedLocation = payload.old as { user_id: string };
              setLocations((prev) => prev.filter((loc) => loc.userId !== deletedLocation.user_id));
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId]);

  const updateLocation = async (lat: number, lon: number): Promise<void> => {
    if (!sessionId || !userId) return;

    // @ts-expect-error - Supabase types don't match the actual API
    const { error } = await supabase.from('locations').upsert(
      {
        session_id: sessionId,
        user_id: userId,
        lat,
        lon,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'session_id,user_id',
      }
    );

    if (error) {
      console.error('위치 업데이트 실패:', error);
    }
  };

  return { locations, updateLocation };
}

export default useRealtimeLocations;

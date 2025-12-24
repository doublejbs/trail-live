import { useEffect, useRef } from 'react';
import type { Location } from '@/types/map';

interface UseLocationTrackingParams {
  myLocation: Location | null;
  sessionId: string | undefined;
  userId: string | null;
  isPageVisible: boolean;
  offRoute: boolean;
  updateLocation: (lat: number, lon: number, offRoute: boolean) => Promise<void>;
}

const useLocationTracking = ({
  myLocation,
  sessionId,
  userId,
  isPageVisible,
  offRoute,
  updateLocation,
}: UseLocationTrackingParams): void => {
  const offRouteRef = useRef(offRoute);

  useEffect(() => {
    offRouteRef.current = offRoute;
  }, [offRoute]);

  useEffect(() => {
    if (!myLocation || !sessionId || !userId) return;

    updateLocation(myLocation.lat, myLocation.lon, offRouteRef.current);

    const interval = isPageVisible ? 3000 : 10000;
    
    const intervalId = setInterval(() => {
      if (myLocation) {
        updateLocation(myLocation.lat, myLocation.lon, offRouteRef.current);
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myLocation, sessionId, userId, isPageVisible]);

  useEffect(() => {
    if (!myLocation || !sessionId || !userId) return;
    
    updateLocation(myLocation.lat, myLocation.lon, offRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offRoute, sessionId, userId]);
}

export default useLocationTracking;


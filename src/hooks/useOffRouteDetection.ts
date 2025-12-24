import { useState, useEffect } from 'react';
import { isOffRoute } from '@/utils/routeDistance';
import type { Location } from '@/types/map';
import type { RouteData } from '@/types/map';

interface UseOffRouteDetectionParams {
  myLocation: Location | null;
  routeData: RouteData | null;
}

interface UseOffRouteDetectionReturn {
  offRoute: boolean;
}

function useOffRouteDetection({
  myLocation,
  routeData,
}: UseOffRouteDetectionParams): UseOffRouteDetectionReturn {
  const [offRoute, setOffRoute] = useState(false);

  useEffect(() => {
    if (!myLocation || !routeData?.features?.[0]?.geometry?.coordinates) {
      setOffRoute(false);
      return;
    }

    const coordinates = routeData.features[0].geometry.coordinates as [number, number][];
    
    if (!coordinates || coordinates.length < 2) {
      setOffRoute(false);
      return;
    }

    const isOff = isOffRoute(
      myLocation.lat,
      myLocation.lon,
      coordinates,
      50
    );

    setOffRoute(isOff);
  }, [myLocation, routeData]);

  return { offRoute };
}

export default useOffRouteDetection;


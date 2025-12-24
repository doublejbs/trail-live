import { useState, useEffect } from 'react';
import SessionService from '@/lib/sessionService';
import type { RouteData } from '@/types/map';

interface UseSessionRouteReturn {
  routeData: RouteData | null;
}

function useSessionRoute(sessionId: string | undefined): UseSessionRouteReturn {
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  useEffect(() => {
    const loadSessionRoute = async () => {
      if (!sessionId) {
        setRouteData(null);
        return;
      }

      try {
        const sessionService = new SessionService();
        const route = await sessionService.getSessionRoute(sessionId);
        setRouteData(route);
      } catch (error) {
        console.error('경로 불러오기 실패:', error);
      }
    };

    loadSessionRoute();
  }, [sessionId]);

  return { routeData };
}

export default useSessionRoute;


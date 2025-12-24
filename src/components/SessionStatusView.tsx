import type { Location } from '@/types/map';
import type { RouteData } from '@/types/map';

interface Props {
  locationsCount: number;
  myLocation: Location | null;
  isPageVisible: boolean;
  geoLoading: boolean;
  geoError: string | null;
  offRoute: boolean;
  routeData: RouteData | null;
}

function SessionStatusView({
  locationsCount,
  myLocation,
  isPageVisible,
  geoLoading,
  geoError,
  offRoute,
  routeData,
}: Props) {
  return (
    <div className="bg-white p-3 border-b border-black">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-700">👥 참가자:</span>
              <span className="font-bold text-black">{locationsCount}명</span>
            </div>
          </div>
          {myLocation && isPageVisible && (
            <div className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-semibold">위치 공유 중</span>
            </div>
          )}
        </div>
        
        {geoLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="animate-spin h-3 w-3 border-2 border-gray-700 border-t-transparent rounded-full"></div>
            <span>위치 정보를 가져오는 중...</span>
          </div>
        )}
        
        {geoError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            ⚠️ {geoError}
          </div>
        )}
        
        {myLocation && !isPageVisible && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            🐢 백그라운드에서 위치 공유가 느리게 진행 중입니다 (10초마다)
          </div>
        )}
        
        {offRoute && routeData && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded font-semibold">
            📍 경로에서 벗어났습니다
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionStatusView;


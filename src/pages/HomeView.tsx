import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NaverMapView from '@/components/NaverMapView';
import useGeolocation from '@/hooks/useGeolocation';
import useRealtimeLocations from '@/hooks/useRealtimeLocations';
import SessionService from '@/lib/sessionService';
import type { RouteData } from '@/types/map';

interface LocationState {
  joinedSessionId?: string;
  sessionName?: string;
}

function HomeView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSessionName, setCurrentSessionName] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const userId = user?.id || null;

  // 초대 링크를 통한 참가 처리
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.joinedSessionId && state?.sessionName) {
      setSessionId(state.joinedSessionId);
      setCurrentSessionName(state.sessionName);
      // state 정리 (새로고침 시 중복 처리 방지)
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const { location: myLocation, error: geoError, loading: geoLoading } = useGeolocation();
  const { locations, updateLocation } = useRealtimeLocations({ sessionId, userId });

  // 페이지 가시성 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 위치 업데이트 (포그라운드: 3초, 백그라운드: 10초)
  useEffect(() => {
    if (!myLocation || !sessionId || !userId) return;

    // 초기 위치 즉시 업데이트
    updateLocation(myLocation.lat, myLocation.lon);

    // 페이지 상태에 따라 다른 주기로 위치 업데이트
    const interval = isPageVisible ? 3000 : 10000;
    
    const intervalId = setInterval(() => {
      if (myLocation) {
        updateLocation(myLocation.lat, myLocation.lon);
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [myLocation, sessionId, userId, isPageVisible, updateLocation]);

  // 세션 경로 불러오기
  useEffect(() => {
    const loadSessionRoute = async () => {
      if (!sessionId) {
        setRouteData(null);
        return;
      }

      const sessionService = new SessionService();
      const route = await sessionService.getSessionRoute(sessionId);
      setRouteData(route);
    };

    loadSessionRoute();
  }, [sessionId]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-black p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Trail Live</h1>
            <p className="text-sm text-gray-700">실시간 등산 위치 공유</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-1 border border-black hover:bg-gray-100 transition"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 상태 표시 */}
      <div className="bg-white p-3 border-b border-black">
        <div className="space-y-2">
          {sessionId && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                👥 참가자: <span className="font-bold text-black">{locations.length}명</span>
              </div>
              {myLocation && isPageVisible && (
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-semibold">위치 공유 중</span>
                </div>
              )}
            </div>
          )}
          
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
          
          {myLocation && sessionId && !isPageVisible && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              🐢 백그라운드에서 위치 공유가 느리게 진행 중입니다 (10초마다)
            </div>
          )}
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 relative">
        <NaverMapView
          center={myLocation}
          userLocations={locations}
          route={routeData}
          currentUserId={userId}
        />
      </div>

      {/* 하단 컨트롤 */}
      <div className="bg-white p-4 border-t border-black">
        {sessionId ? (
          // 모임에 참가한 상태
          <div>
            <div className="mb-3 p-3 border border-black bg-gray-50">
              <div className="text-sm text-gray-600 mb-1">현재 모임</div>
              <div className="font-bold text-black">{currentSessionName || '모임'}</div>
              <div className="text-xs text-gray-600 mt-1">
                참가자: {locations.length}명
              </div>
            </div>
            <button
              onClick={() => {
                setSessionId(null);
                setCurrentSessionName(null);
                setRouteData(null);
              }}
              className="w-full border border-black text-black py-3 px-4 font-semibold hover:bg-gray-100 transition"
            >
              모임 나가기
            </button>
          </div>
        ) : (
          // 모임에 참가하지 않은 상태
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/create-session')}
              disabled={!userId}
              className="flex-1 bg-black text-white py-3 px-4 font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              모임 만들기
            </button>
            <button 
              onClick={() => navigate('/join-session')}
              disabled={!userId}
              className="flex-1 border border-black text-black py-3 px-4 font-semibold hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
            >
              모임 참가하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeView;

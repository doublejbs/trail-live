import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NaverMapView from '@/components/NaverMapView';
import useGeolocation from '@/hooks/useGeolocation';
import useRealtimeLocations from '@/hooks/useRealtimeLocations';
import SessionService from '@/lib/sessionService';
import type { RouteData } from '@/types/map';

interface SessionInfo {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  is_active: boolean;
  host_id: string;
}

function SessionDetailView() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const userId = user?.id || null;

  const { location: myLocation, error: geoError, loading: geoLoading } = useGeolocation();
  const { locations, updateLocation } = useRealtimeLocations({ sessionId: sessionId || null, userId });

  // 세션 정보 불러오기
  useEffect(() => {
    const loadSessionInfo = async () => {
      if (!sessionId) {
        navigate('/join-session');
        return;
      }

      try {
        setLoading(true);
        const sessionService = new SessionService();
        const session = await sessionService.getSessionById(sessionId);
        
        if (!session) {
          alert('존재하지 않는 모임입니다.');
          navigate('/join-session');
          return;
        }

        setSessionInfo(session);
      } catch (error) {
        console.error('세션 정보 불러오기 실패:', error);
        alert('세션 정보를 불러오는데 실패했습니다.');
        navigate('/join-session');
      } finally {
        setLoading(false);
      }
    };

    loadSessionInfo();
  }, [sessionId, navigate]);

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

  const handleCopyInviteCode = () => {
    if (!sessionInfo) return;
    const shareUrl = `${window.location.origin}/invite/${sessionInfo.invite_code}`;
    navigator.clipboard.writeText(shareUrl);
    alert('초대 링크가 복사되었습니다!');
  };

  const handleLeaveSession = async () => {
    if (!sessionId || !userId || leaving) return;

    const isHost = userId === sessionInfo?.host_id;
    
    let confirmMessage = '모임을 나가시겠습니까?';
    if (isHost) {
      confirmMessage = '호스트가 나가면 모임이 종료됩니다.\n정말로 나가시겠습니까?';
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setLeaving(true);
      const sessionService = new SessionService();
      await sessionService.leaveSession(sessionId, userId);
      
      alert(isHost ? '모임이 종료되었습니다.' : '모임에서 나갔습니다.');
      navigate('/join-session');
    } catch (error) {
      console.error('모임 나가기 실패:', error);
      alert(error instanceof Error ? error.message : '모임 나가기에 실패했습니다.');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!sessionInfo) {
    return null;
  }

  const isHost = userId === sessionInfo.host_id;

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-black p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/join-session')}
            className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            <span className="font-semibold">뒤로</span>
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold">{sessionInfo.name}</h1>
            {isHost && (
              <p className="text-xs text-gray-600 mt-1">호스트</p>
            )}
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      {/* 상태 표시 */}
      <div className="bg-white p-3 border-b border-black">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-700">👥 참가자:</span>
                <span className="font-bold text-black">{locations.length}명</span>
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
      <div className="bg-white p-4 border-t border-black space-y-2">
        {isHost && (
          <button
            onClick={handleCopyInviteCode}
            className="w-full border border-black text-black py-3 px-4 font-semibold hover:bg-gray-100 transition"
          >
            초대 링크 복사
          </button>
        )}
        <button
          onClick={handleLeaveSession}
          disabled={leaving}
          className="w-full border border-black text-black py-3 px-4 font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {leaving ? '나가는 중...' : '모임 나가기'}
        </button>
      </div>
    </div>
  );
}

export default SessionDetailView;


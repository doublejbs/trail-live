import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NaverMapView from '@/components/NaverMapView';
import SessionHeaderView from '@/components/SessionHeaderView';
import SessionStatusView from '@/components/SessionStatusView';
import SessionControlsView from '@/components/SessionControlsView';
import useGeolocation from '@/hooks/useGeolocation';
import useRealtimeLocations from '@/hooks/useRealtimeLocations';
import useSessionInfo from '@/hooks/useSessionInfo';
import useSessionRoute from '@/hooks/useSessionRoute';
import usePageVisibility from '@/hooks/usePageVisibility';
import useLocationTracking from '@/hooks/useLocationTracking';
import useOffRouteDetection from '@/hooks/useOffRouteDetection';
import SessionService from '@/lib/sessionService';

function SessionDetailView() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const userId = user?.id || null;

  const { sessionInfo, loading } = useSessionInfo(sessionId);
  const { routeData } = useSessionRoute(sessionId);
  const { isPageVisible } = usePageVisibility();
  const { location: myLocation, error: geoError, loading: geoLoading } = useGeolocation();
  const { locations, updateLocation } = useRealtimeLocations({ sessionId: sessionId || null, userId });
  const { offRoute } = useOffRouteDetection({ myLocation, routeData });

  useLocationTracking({
    myLocation,
    sessionId,
    userId,
    isPageVisible,
    offRoute,
    updateLocation,
  });

  const handleCopyInviteCode = () => {
    if (!sessionInfo) return;
    const shareUrl = `${window.location.origin}/invite/${sessionInfo.invite_code}`;
    navigator.clipboard.writeText(shareUrl);
    alert('초대 링크가 복사되었습니다!');
  };

  const handleLeaveSession = async () => {
    if (!sessionId || !userId || leaving || !sessionInfo) return;

    const isHost = userId === sessionInfo.host_id;
    
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
      <SessionHeaderView sessionInfo={sessionInfo} isHost={isHost} />

      <SessionStatusView
        locationsCount={locations.length}
        myLocation={myLocation}
        isPageVisible={isPageVisible}
        geoLoading={geoLoading}
        geoError={geoError}
        offRoute={offRoute}
        routeData={routeData}
      />

      <div className="flex-1 relative">
        <NaverMapView
          center={myLocation}
          userLocations={locations}
          route={routeData}
          currentUserId={userId}
        />
      </div>

      <SessionControlsView
        sessionInfo={sessionInfo}
        isHost={isHost}
        leaving={leaving}
        onCopyInviteCode={handleCopyInviteCode}
        onLeaveSession={handleLeaveSession}
      />
    </div>
  );
}

export default SessionDetailView;


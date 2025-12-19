import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NaverMapView from '@/components/NaverMapView';
import useGeolocation from '@/hooks/useGeolocation';
import useRealtimeLocations from '@/hooks/useRealtimeLocations';

function HomeView() {
  const { user, signOut } = useAuth();
  const [sessionId] = useState<string | null>(null);
  const userId = user?.id || null;

  const { location: myLocation, error: geoError, loading: geoLoading } = useGeolocation();
  const { locations, updateLocation } = useRealtimeLocations({ sessionId, userId });

  useEffect(() => {
    if (myLocation && sessionId && userId) {
      updateLocation(myLocation.lat, myLocation.lon);
    }
  }, [myLocation, sessionId, userId]);

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
        {geoLoading && <div className="text-sm text-gray-700">📍 위치 정보를 가져오는 중...</div>}
        {geoError && <div className="text-sm text-red-600">⚠️ {geoError}</div>}
        {myLocation && (
          <div className="text-sm text-gray-900">
            ✅ 내 위치: {myLocation.lat.toFixed(6)}, {myLocation.lon.toFixed(6)}
          </div>
        )}
        {!sessionId && (
          <div className="text-sm text-gray-700 mt-1">
            ℹ️ 세션에 참가하려면 로그인 후 초대 코드를 입력하세요.
          </div>
        )}
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 relative">
        <NaverMapView
          center={myLocation}
          userLocations={locations}
          route={null}
          currentUserId={userId}
        />
      </div>

      {/* 하단 컨트롤 */}
      <div className="bg-white p-4 border-t border-black">
        <div className="flex gap-2">
          <button className="flex-1 bg-black text-white py-3 px-4 font-semibold hover:bg-gray-800 transition">
            세션 만들기
          </button>
          <button className="flex-1 border border-black text-black py-3 px-4 font-semibold hover:bg-gray-100 transition">
            세션 참가
          </button>
        </div>
        {sessionId && (
          <div className="mt-3 text-center">
            <span className="text-sm text-gray-700">참가자: </span>
            <span className="text-sm font-semibold">{locations.length}명</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeView;

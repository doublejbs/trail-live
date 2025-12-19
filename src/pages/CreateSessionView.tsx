import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import GpxUploaderView from '@/components/GpxUploaderView';
import GpxPreviewMapView from '@/components/GpxPreviewMapView';
import type { GpxData } from '@/types/gpx';

function CreateSessionView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || '';
  const userNickname = 
    user?.user_metadata?.nickname ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '사용자';

  const [sessionName, setSessionName] = useState('');
  const [gpxData, setGpxData] = useState<GpxData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGpxLoaded = (data: GpxData) => {
    setGpxData(data);
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const SessionService = (await import('@/lib/sessionService')).default;
      const sessionService = new SessionService();

      const result = await sessionService.createSession(
        sessionName.trim(),
        userId,
        userNickname,
        gpxData
      );

      setShareUrl(result.shareUrl);
      setInviteCode(result.inviteCode);
    } catch (err) {
      console.error('모임 생성 실패:', err);
      setError(err instanceof Error ? err.message : '모임 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('공유 링크가 복사되었습니다!');
    }
  };

  const handleComplete = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-black p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
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
          <h1 className="text-xl font-bold text-black">
            {shareUrl ? '모임이 생성되었습니다!' : '모임 만들기'}
          </h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {shareUrl ? (
            // 성공 화면
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-16 h-16 mx-auto text-black"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  아래 링크를 친구들에게 공유하세요
                </p>
              </div>

              {/* 초대 코드 */}
              <div className="bg-white border border-black p-6">
                <label className="block text-sm font-semibold text-black mb-3">
                  초대 코드
                </label>
                <div className="flex items-center justify-center p-6 border-2 border-black bg-gray-50">
                  <span className="text-4xl font-bold tracking-wider">{inviteCode}</span>
                </div>
              </div>

              {/* 공유 링크 */}
              <div className="bg-white border border-black p-6">
                <label className="block text-sm font-semibold text-black mb-3">
                  공유 링크
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-3 border border-black bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-semibold"
                  >
                    복사
                  </button>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-4 bg-black text-white hover:bg-gray-800 transition-colors font-semibold text-lg"
              >
                확인
              </button>
            </div>
          ) : (
            // 입력 화면
            <div className="space-y-6">
              {/* 모임 이름 입력 */}
              <div className="bg-white border border-black p-6">
                <label className="block text-sm font-semibold text-black mb-3">
                  모임 이름
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                  placeholder="등산 모임 이름을 입력하세요"
                  className="w-full px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={isCreating}
                />
                <p className="mt-2 text-xs text-gray-600">
                  함께 등산하는 사람들과 공유할 모임 이름을 입력하세요.
                </p>
              </div>

              {/* GPX 파일 업로드 */}
              <div className="bg-white border border-black p-6">
                <label className="block text-sm font-semibold text-black mb-3">
                  GPX 파일 업로드 (선택사항)
                </label>
                <GpxUploaderView onGpxLoaded={handleGpxLoaded} />
                <p className="mt-2 text-xs text-gray-600">
                  등산 경로가 담긴 GPX 파일을 업로드하면 지도에 경로가 표시됩니다.
                </p>
              </div>

              {/* GPX 경로 미리보기 */}
              {gpxData && (
                <div className="bg-white border border-black p-6">
                  <label className="block text-sm font-semibold text-black mb-3">
                    경로 미리보기
                  </label>
                  <GpxPreviewMapView gpxData={gpxData} />
                  <div className="mt-3 p-3 border border-black bg-gray-50">
                    <div className="text-xs text-gray-700 space-y-1">
                      {gpxData.metadata?.name && (
                        <div><strong>이름:</strong> {gpxData.metadata.name}</div>
                      )}
                      <div><strong>트랙:</strong> {gpxData.tracks.length}개</div>
                      <div><strong>경로:</strong> {gpxData.routes.length}개</div>
                      <div><strong>웨이포인트:</strong> {gpxData.waypoints.length}개</div>
                      <div>
                        <strong>총 포인트:</strong>{' '}
                        {gpxData.tracks.reduce((sum, track) => 
                          sum + track.segments.reduce((segSum, seg) => segSum + seg.points.length, 0), 0) +
                         gpxData.routes.reduce((sum, route) => sum + route.points.length, 0)}개
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="p-4 border border-black bg-white">
                  <p className="text-sm text-black">⚠️ {error}</p>
                </div>
              )}

              {/* 버튼 */}
              <button
                onClick={handleCreateSession}
                disabled={!sessionName.trim() || isCreating}
                className="w-full px-4 py-4 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>생성 중...</span>
                  </>
                ) : (
                  '모임 만들기'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateSessionView;


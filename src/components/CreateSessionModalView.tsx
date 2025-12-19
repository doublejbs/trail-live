import { useState } from 'react';
import GpxUploaderView from './GpxUploaderView';
import type { GpxData } from '@/types/gpx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (sessionId: string, inviteCode: string) => void;
  userId: string;
  userNickname: string;
}

function CreateSessionModalView({ isOpen, onClose, onSessionCreated, userId, userNickname }: Props) {
  const [sessionName, setSessionName] = useState('');
  const [gpxData, setGpxData] = useState<GpxData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      
      // 부모 컴포넌트에 알림
      onSessionCreated(result.sessionId, result.inviteCode);
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

  const handleClose = () => {
    setSessionName('');
    setGpxData(null);
    setShareUrl(null);
    setInviteCode(null);
    setError(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-black">
          <h2 className="text-xl font-bold text-black">
            {shareUrl ? '모임이 생성되었습니다!' : '모임 만들기'}
          </h2>
          <button
            onClick={handleClose}
            className="text-black hover:text-gray-600 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 space-y-6">
          {shareUrl ? (
            // 성공 화면
            <>
              <div className="text-center py-4">
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
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  초대 코드
                </label>
                <div className="flex items-center justify-center p-4 border-2 border-black bg-gray-50">
                  <span className="text-3xl font-bold tracking-wider">{inviteCode}</span>
                </div>
              </div>

              {/* 공유 링크 */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
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
                    className="px-4 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-semibold"
                  >
                    복사
                  </button>
                </div>
              </div>
            </>
          ) : (
            // 입력 화면
            <>
              {/* 모임 이름 입력 */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
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

              {/* 구분선 */}
              <div className="border-t border-black"></div>

              {/* GPX 파일 업로드 */}
              <div>
                <label className="block text-sm font-semibold text-black mb-3">
                  GPX 파일 업로드 (선택사항)
                </label>
                <GpxUploaderView onGpxLoaded={handleGpxLoaded} />
                <p className="mt-2 text-xs text-gray-600">
                  등산 경로가 담긴 GPX 파일을 업로드하면 지도에 경로가 표시됩니다.
                </p>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 border border-black bg-white">
                  <p className="text-sm text-black">⚠️ {error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-black">
          {shareUrl ? (
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-semibold"
            >
              확인
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1 px-4 py-3 border border-black text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!sessionName.trim() || isCreating}
                className="flex-1 px-4 py-3 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
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

export default CreateSessionModalView;


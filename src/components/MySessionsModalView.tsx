import { useState, useEffect, useCallback } from 'react';
import SessionService from '@/lib/sessionService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onJoinSession: (sessionId: string, sessionName: string) => void;
}

interface SessionData {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  is_active: boolean;
  joined_at?: string;
}

function MySessionsModalView({ isOpen, onClose, userId, onJoinSession }: Props) {
  const [hostedSessions, setHostedSessions] = useState<SessionData[]>([]);
  const [joinedSessions, setJoinedSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const sessionService = new SessionService();
      const [hosted, joined] = await Promise.all([
        sessionService.getMyHostedSessions(userId),
        sessionService.getMyJoinedSessions(userId),
      ]);
      setHostedSessions(hosted);
      setJoinedSessions(joined);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      loadSessions();
    }
  }, [isOpen, userId, loadSessions]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSessionClick = (session: SessionData) => {
    onJoinSession(session.id, session.name);
    onClose();
  };

  const handleCopyInviteCode = (inviteCode: string) => {
    const shareUrl = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(shareUrl);
    alert('초대 링크가 복사되었습니다!');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-black">
          <h2 className="text-xl font-bold text-black">내 모임</h2>
          <button
            onClick={onClose}
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
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 내가 만든 모임 */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4">내가 만든 모임</h3>
                {hostedSessions.length === 0 ? (
                  <div className="p-6 border border-black bg-gray-50 text-center">
                    <p className="text-sm text-gray-600">만든 모임이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hostedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-black p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleSessionClick(session)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-black mb-2">{session.name}</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>초대 코드: <span className="font-mono font-semibold">{session.invite_code}</span></div>
                              <div>생성: {new Date(session.created_at).toLocaleDateString('ko-KR')}</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyInviteCode(session.invite_code);
                            }}
                            className="ml-4 px-3 py-1 border border-black text-xs font-semibold hover:bg-gray-100 transition-colors"
                          >
                            공유
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 내가 참가한 모임 */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4">참가 중인 모임</h3>
                {joinedSessions.length === 0 ? (
                  <div className="p-6 border border-black bg-gray-50 text-center">
                    <p className="text-sm text-gray-600">참가한 모임이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {joinedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-black p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleSessionClick(session)}
                      >
                        <h4 className="font-bold text-black mb-2">{session.name}</h4>
                        <div className="text-xs text-gray-600">
                          참가: {new Date(session.joined_at || session.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-black">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-black text-black hover:bg-gray-100 transition-colors font-semibold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default MySessionsModalView;


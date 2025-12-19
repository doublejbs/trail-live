import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SessionService from '@/lib/sessionService';

type TabType = 'hosted' | 'joined' | 'explore';

interface SessionData {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  is_active: boolean;
  joined_at?: string;
  host_nickname?: string;
  member_count?: number;
}

function JoinSessionView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || '';

  const [activeTab, setActiveTab] = useState<TabType>('hosted');
  const [hostedSessions, setHostedSessions] = useState<SessionData[]>([]);
  const [joinedSessions, setJoinedSessions] = useState<SessionData[]>([]);
  const [publicSessions, setPublicSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const sessionService = new SessionService();
      const [hosted, joined, publicList] = await Promise.all([
        sessionService.getMyHostedSessions(userId),
        sessionService.getMyJoinedSessions(userId),
        sessionService.getPublicSessions(userId),
      ]);
      setHostedSessions(hosted);
      setJoinedSessions(joined);
      setPublicSessions(publicList);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionClick = (session: SessionData) => {
    navigate('/', { 
      state: { 
        joinedSessionId: session.id, 
        sessionName: session.name 
      } 
    });
  };

  const handleCopyInviteCode = (e: React.MouseEvent, inviteCode: string) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(shareUrl);
    alert('초대 링크가 복사되었습니다!');
  };

  const handleJoinPublicSession = async (e: React.MouseEvent, session: SessionData) => {
    e.stopPropagation();
    if (!userId) return;

    try {
      const sessionService = new SessionService();
      await sessionService.joinSession(session.invite_code, userId);
      
      navigate('/', { 
        state: { 
          joinedSessionId: session.id, 
          sessionName: session.name 
        } 
      });
    } catch (error) {
      console.error('모임 참가 실패:', error);
      alert(error instanceof Error ? error.message : '모임 참가에 실패했습니다.');
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'hosted', label: '내가 만든 모임' },
    { key: 'joined', label: '참가 중인 모임' },
    { key: 'explore', label: '모임 둘러보기' },
  ];

  const renderSessionList = () => {
    let sessions: SessionData[] = [];
    let emptyMessage = '';

    switch (activeTab) {
      case 'hosted':
        sessions = hostedSessions;
        emptyMessage = '만든 모임이 없습니다';
        break;
      case 'joined':
        sessions = joinedSessions;
        emptyMessage = '참가한 모임이 없습니다';
        break;
      case 'explore':
        sessions = publicSessions;
        emptyMessage = '둘러볼 모임이 없습니다';
        break;
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full"></div>
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="p-8 border border-black bg-gray-50 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-12 h-12 mx-auto text-gray-400 mb-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          <p className="text-sm text-gray-600">{emptyMessage}</p>
          {activeTab === 'hosted' && (
            <button
              onClick={() => navigate('/create-session')}
              className="mt-4 px-4 py-2 bg-black text-white text-sm font-semibold hover:bg-gray-800 transition"
            >
              모임 만들기
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="border border-black p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleSessionClick(session)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-black mb-2 truncate">{session.name}</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {activeTab === 'hosted' && (
                    <>
                      <div>초대 코드: <span className="font-mono font-semibold">{session.invite_code}</span></div>
                      <div>생성: {new Date(session.created_at).toLocaleDateString('ko-KR')}</div>
                    </>
                  )}
                  {activeTab === 'joined' && (
                    <div>참가: {new Date(session.joined_at || session.created_at).toLocaleDateString('ko-KR')}</div>
                  )}
                  {activeTab === 'explore' && (
                    <>
                      {session.host_nickname && <div>호스트: {session.host_nickname}</div>}
                      {session.member_count !== undefined && <div>참가자: {session.member_count}명</div>}
                      <div>생성: {new Date(session.created_at).toLocaleDateString('ko-KR')}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                {activeTab === 'hosted' && (
                  <button
                    onClick={(e) => handleCopyInviteCode(e, session.invite_code)}
                    className="px-3 py-1.5 border border-black text-xs font-semibold hover:bg-gray-100 transition-colors"
                  >
                    공유
                  </button>
                )}
                {activeTab === 'explore' && (
                  <button
                    onClick={(e) => handleJoinPublicSession(e, session)}
                    className="px-3 py-1.5 bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
                  >
                    참가
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
          <h1 className="text-xl font-bold text-black">모임 참가하기</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-black">
        <div className="max-w-2xl mx-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {renderSessionList()}
        </div>
      </div>
    </div>
  );
}

export default JoinSessionView;


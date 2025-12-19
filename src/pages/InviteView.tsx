import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SessionService from '@/lib/sessionService';

interface SessionInfo {
  id: string;
  name: string;
  hostNickname: string;
  memberCount: number;
  isActive: boolean;
}

function InviteView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;
  const userNickname = 
    user?.user_metadata?.nickname ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '사용자';

  useEffect(() => {
    const loadSessionInfo = async () => {
      if (!code) {
        setError('유효하지 않은 초대 링크입니다.');
        setLoading(false);
        return;
      }

      try {
        const sessionService = new SessionService();
        const info = await sessionService.getSessionByInviteCode(code);
        
        if (!info) {
          setError('존재하지 않는 모임입니다.');
        } else if (!info.isActive) {
          setError('종료된 모임입니다.');
        } else {
          setSessionInfo(info);
        }
      } catch (err) {
        console.error('세션 정보 조회 실패:', err);
        setError('모임 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadSessionInfo();
  }, [code]);

  const handleJoinSession = async () => {
    if (!code || !userId || !sessionInfo) return;

    setJoining(true);
    setError(null);

    try {
      const sessionService = new SessionService();
      
      // users 테이블에 사용자가 없으면 생성 필요 (sessionService.joinSession 내에서 처리 안됨)
      // 먼저 사용자 프로필 확인/생성
      const { supabase } = await import('@/lib/supabase');
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingUser) {
        await supabase
          .from('users')
          .insert({
            id: userId,
            nickname: userNickname,
            plan: 'free',
          });
      }

      await sessionService.joinSession(code, userId);
      
      // 참가 성공 후 홈으로 이동 (세션 ID와 이름을 state로 전달)
      navigate('/', { 
        state: { 
          joinedSessionId: sessionInfo.id, 
          sessionName: sessionInfo.name 
        } 
      });
    } catch (err) {
      console.error('모임 참가 실패:', err);
      setError(err instanceof Error ? err.message : '모임 참가에 실패했습니다.');
    } finally {
      setJoining(false);
    }
  };

  // 로그인 필요 - 현재 URL을 저장하고 로그인 페이지로
  const handleLoginRedirect = () => {
    // 로그인 후 돌아올 URL 저장
    sessionStorage.setItem('redirectAfterLogin', `/invite/${code}`);
    navigate('/login');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">모임 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white border border-black w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-16 h-16 mx-auto text-red-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">오류</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block bg-black text-white py-3 px-6 font-semibold hover:bg-gray-800 transition"
          >
            홈으로 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white border border-black w-full max-w-md">
        {/* 헤더 */}
        <div className="border-b border-black p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">🏔️ Trail Live</h1>
          <p className="text-gray-600 text-sm">모임 초대</p>
        </div>

        {/* 모임 정보 */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 border-2 border-black mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">{sessionInfo?.name}</h2>
            <p className="text-gray-600">
              <span className="font-medium">{sessionInfo?.hostNickname}</span>님이 초대했습니다
            </p>
          </div>

          {/* 모임 상세 정보 */}
          <div className="border border-black divide-y divide-black mb-6">
            <div className="flex justify-between items-center p-4">
              <span className="text-gray-600">초대 코드</span>
              <span className="font-bold tracking-wider">{code}</span>
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-gray-600">현재 참가자</span>
              <span className="font-bold">{sessionInfo?.memberCount}명</span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-white border border-red-600 text-red-600 px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {/* 액션 버튼 */}
          {user ? (
            <button
              onClick={handleJoinSession}
              disabled={joining}
              className="w-full bg-black text-white py-4 px-4 font-semibold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  참가하는 중...
                </span>
              ) : (
                '모임 참가하기'
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-black text-white py-4 px-4 font-semibold text-lg hover:bg-gray-800 transition"
              >
                로그인하고 참가하기
              </button>
              <p className="text-center text-sm text-gray-600">
                모임에 참가하려면 로그인이 필요합니다
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="border-t border-black p-4 text-center">
          <Link
            to="/"
            className="text-gray-600 text-sm hover:text-black transition"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default InviteView;


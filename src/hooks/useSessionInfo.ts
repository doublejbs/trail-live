import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionService from '@/lib/sessionService';

interface SessionInfo {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  is_active: boolean;
  host_id: string;
}

interface UseSessionInfoReturn {
  sessionInfo: SessionInfo | null;
  loading: boolean;
}

function useSessionInfo(sessionId: string | undefined): UseSessionInfoReturn {
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

  return { sessionInfo, loading };
}

export default useSessionInfo;
export type { SessionInfo };


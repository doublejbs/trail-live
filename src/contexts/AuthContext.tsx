import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 사용자 프로필 생성 (이메일 확인 또는 소셜 로그인 후)
    const createUserProfileIfNeeded = async (user: User) => {
      try {
        // 타임아웃 설정 (3초)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('프로필 조회 타임아웃')), 3000);
        });

        const queryPromise = supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        const result = await Promise.race([queryPromise, timeoutPromise]).catch(() => {
          return { data: null, error: new Error('타임아웃') };
        });

        const { data: existingUser, error: selectError } = result;

        if (selectError) {
          return;
        }

        if (!existingUser) {
          const nickname =
            user.user_metadata?.nickname ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            '사용자';

          // @ts-expect-error - Database 타입 추론 이슈로 인한 임시 처리
          await supabase.from('users').insert({
            id: user.id,
            nickname: nickname as string,
            plan: 'free' as const,
          });
        }
      } catch (error) {
        console.error('프로필 생성 오류:', error);
      }
    };

    // 현재 세션 가져오기
    const initializeAuth = async () => {
      try {
        // OAuth 콜백 처리를 위해 약간의 지연 추가
        // URL에 hash fragment가 있으면 Supabase가 처리할 시간을 줌
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('OAuth 콜백 감지, 세션 처리 중...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 가져오기 오류:', error);
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        const currentSession = data?.session || null;

        if (currentSession) {
          console.log('세션 로드 성공:', currentSession.user.email);
        } else {
          console.log('세션 없음');
        }

        // 프로필 생성은 백그라운드에서 처리 (초기화 블로킹 방지)
        if (currentSession?.user) {
          createUserProfileIfNeeded(currentSession.user).catch(() => {
            // 백그라운드 처리 실패는 무시
          });
        }

        // 즉시 세션 설정
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Auth 초기화 오류:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Auth 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth 상태 변경:', event, currentSession?.user?.email || '세션 없음');
      
      try {
        // 프로필 생성은 백그라운드에서 처리 (UI 블로킹 방지)
        if (currentSession?.user) {
          createUserProfileIfNeeded(currentSession.user).catch(() => {
            // 백그라운드 처리 실패는 무시
          });
        }

        // 즉시 상태 업데이트
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Auth 상태 변경 오류:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, nickname: string): Promise<void> => {
    // 회원가입 (닉네임은 user_metadata에 저장)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
        },
      },
    });

    if (error) {
      throw error;
    }

    // users 테이블 생성은 이메일 확인 후 로그인 시 자동으로 처리됨
  };

  const signInWithGoogle = async (): Promise<void> => {
    // 항상 현재 origin 사용 (로컬/프로덕션 자동 구분)
    const redirectUrl = window.location.origin;
    console.log('Google 로그인 리다이렉트 URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectUrl}/`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signInWithKakao = async (): Promise<void> => {
    // 항상 현재 origin 사용 (로컬/프로덕션 자동 구분)
    const redirectUrl = window.location.origin;
    console.log('Kakao 로그인 리다이렉트 URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `https://xmfyciykyunseywqeoiq.supabase.co/auth/v1/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // 로그아웃 성공 시 로컬 상태 클리어
    setSession(null);
    setUser(null);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithKakao,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  }

  return context;
}

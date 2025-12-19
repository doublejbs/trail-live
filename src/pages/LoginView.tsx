import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function LoginView() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { user, signIn, signInWithGoogle, signInWithKakao } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google 로그인에 실패했습니다.');
    }
  };

  const handleKakaoLogin = async () => {
    try {
      setError('');
      await signInWithKakao();
    } catch (err: any) {
      setError(err.message || 'Kakao 로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white border border-black w-full max-w-md p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏔️ Trail Live</h1>
          <p className="text-gray-600">실시간 등산 위치 공유</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-white border border-red-600 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* 이메일 입력 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-black focus:outline-none focus:border-gray-500 transition"
              placeholder="your@email.com"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-black focus:outline-none focus:border-gray-500 transition"
              placeholder="6자 이상"
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="mt-6 mb-6 flex items-center">
          <div className="flex-1 border-t border-black"></div>
          <span className="px-4 text-sm text-gray-700">또는</span>
          <div className="flex-1 border-t border-black"></div>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-3 mb-6">
          {/* Google 로그인 */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-black py-3 px-4 font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Google로 계속하기
          </button>

          {/* Kakao 로그인 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full border border-black py-3 px-4 font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FEE500' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 0C4.03 0 0 3.13 0 7c0 2.48 1.64 4.66 4.1 5.93l-1.05 3.86c-.08.3.23.54.48.38l4.54-3.05c.63.1 1.28.15 1.93.15 4.97 0 9-3.13 9-7S13.97 0 9 0z"
                fill="#000"
              />
            </svg>
            <span style={{ color: '#000000' }}>Kakao로 계속하기</span>
          </button>
        </div>

        {/* 회원가입 링크 */}
        <div className="text-center">
          <p className="text-gray-700">
            계정이 없으신가요?{' '}
            <Link
              to="/signup"
              className="text-black font-semibold underline hover:text-gray-600 transition"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginView;

-- 기존 auth.users의 사용자들을 public.users에 동기화

INSERT INTO public.users (id, nickname, plan)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'nickname',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    '사용자'
  ) as nickname,
  'free' as plan
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);


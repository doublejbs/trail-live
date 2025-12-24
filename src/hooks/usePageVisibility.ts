import { useState, useEffect } from 'react';

interface UsePageVisibilityReturn {
  isPageVisible: boolean;
}

function usePageVisibility(): UsePageVisibilityReturn {
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isPageVisible };
}

export default usePageVisibility;


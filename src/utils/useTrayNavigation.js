import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useTrayNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.api?.navigate) return;
    window.api.navigate((route) => {
      navigate(route);
    });
  }, [navigate]);
}

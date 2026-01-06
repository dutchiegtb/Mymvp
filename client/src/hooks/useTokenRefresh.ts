import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

function decodeJwtPayload(token: string): { exp: number; userId: number; email: string } | null {
  try {
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload;
  } catch {
    return null;
  }
}

function getTokenExpirationMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
}

function shouldRefreshToken(token: string): boolean {
  const expiresAt = getTokenExpirationMs(token);
  if (!expiresAt) return false;
  
  const timeUntilExpiry = expiresAt - Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  
  return timeUntilExpiry > 0 && timeUntilExpiry < twentyFourHoursMs;
}

function isTokenExpired(token: string): boolean {
  const expiresAt = getTokenExpirationMs(token);
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

export function useTokenRefresh() {
  const [, setLocation] = useLocation();

  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('mvp_token');
    if (!token) return;

    if (isTokenExpired(token)) {
      localStorage.removeItem('mvp_token');
      setLocation('/login');
      return;
    }

    if (!shouldRefreshToken(token)) return;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('mvp_token', data.token);
          console.log('Token refreshed successfully');
        }
      } else if (response.status === 401) {
        localStorage.removeItem('mvp_token');
        setLocation('/login');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }
  }, [setLocation]);

  useEffect(() => {
    refreshToken();
    
    const interval = setInterval(refreshToken, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refreshToken]);
}

export function getTokenInfo(): { expiresAt: Date | null; isExpired: boolean; hoursUntilExpiry: number } {
  const token = localStorage.getItem('mvp_token');
  if (!token) {
    return { expiresAt: null, isExpired: true, hoursUntilExpiry: 0 };
  }

  const expiresAtMs = getTokenExpirationMs(token);
  if (!expiresAtMs) {
    return { expiresAt: null, isExpired: true, hoursUntilExpiry: 0 };
  }

  const expiresAt = new Date(expiresAtMs);
  const isExpired = Date.now() >= expiresAtMs;
  const hoursUntilExpiry = Math.max(0, (expiresAtMs - Date.now()) / (1000 * 60 * 60));

  return { expiresAt, isExpired, hoursUntilExpiry };
}

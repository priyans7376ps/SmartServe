/**
 * Session ID utility for anonymous guest tracking and guest cart persistence.
 */

const SESSION_KEY = 'smartserve_guest_session_id';

export function getOrCreateSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function clearSessionId() {
  localStorage.removeItem(SESSION_KEY);
}

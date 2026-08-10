export const isStrictMode = (): boolean => {
  const stored = localStorage.getItem('STRICT_BACKEND_MODE');
  if (stored !== null) {
    return stored === 'true';
  }
  return import.meta.env.VITE_STRICT_MODE === 'true';
};

export const setStrictMode = (enabled: boolean): void => {
  localStorage.setItem('STRICT_BACKEND_MODE', enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('strict-mode-changed'));
};

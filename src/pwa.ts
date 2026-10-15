import { registerSW } from 'virtual:pwa-register';

export function registerPWA() {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] New content available, reloading...');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('[PWA] App is ready for offline usage.');
      },
      onRegisterError(error: any) {
        console.warn('[PWA] Service worker registration error:', error);
      },
    });
  }
}

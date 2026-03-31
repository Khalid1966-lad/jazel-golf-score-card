'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share, PlusSquare, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Current app version - should match package.json
const APP_VERSION = '1.2.93';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Detect iOS Safari
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
  
  return isIOS && isSafari;
}

// Check if running in standalone mode on iOS
function isIOSStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [wasInstalled, setWasInstalled] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const updateCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCheckedForUpdateRef = useRef(false);

  // Check if running as standalone PWA
  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || isIOSStandalone();
  }, []);

  // Check for iOS
  const isIOS = useMemo(() => isIOSSafari(), []);

  // Function to check for service worker updates
  const checkForUpdates = useCallback(async (reg: ServiceWorkerRegistration) => {
    // Prevent multiple simultaneous checks
    if (hasCheckedForUpdateRef.current) return;
    hasCheckedForUpdateRef.current = true;
    
    try {
      console.log('Jazel PWA: Checking for updates...');
      await reg.update();
      
      // Check if there's a waiting worker after update check
      if (reg.waiting) {
        console.log('Jazel PWA: Update found (waiting worker)');
        setShowUpdatePrompt(true);
        return;
      }
      
      // Check if there's an installing worker
      if (reg.installing) {
        console.log('Jazel PWA: Update installing...');
      }
    } catch (error) {
      console.error('Jazel PWA: Error checking for updates', error);
    } finally {
      // Reset after 2 seconds to allow future checks
      setTimeout(() => {
        hasCheckedForUpdateRef.current = false;
      }, 2000);
    }
  }, []);

  // Handle service worker update found
  const handleUpdateFound = useCallback((reg: ServiceWorkerRegistration) => {
    const newWorker = reg.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        console.log('Jazel PWA: Worker state:', newWorker.state);
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version is available!
          console.log('Jazel PWA: New version installed and ready!');
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Register service worker with no-cache options
    navigator.serviceWorker
      .register('/sw.js', { 
        scope: '/',
        updateViaCache: 'none' // Important: don't use cached sw.js
      })
      .then((reg) => {
        console.log('Jazel PWA: Service Worker registered', reg.scope);
        setRegistration(reg);
        
        // Check for updates on registration
        reg.addEventListener('updatefound', () => handleUpdateFound(reg));
        
        // Check if there's already a waiting worker (update already downloaded)
        if (reg.waiting) {
          console.log('Jazel PWA: Waiting worker found - update available!');
          setShowUpdatePrompt(true);
        }
        
        // Check if there's an installing worker
        if (reg.installing) {
          console.log('Jazel PWA: Installing worker found');
          handleUpdateFound(reg);
        }
        
        // Initial update check after a short delay
        setTimeout(() => checkForUpdates(reg), 1000);
      })
      .catch((error) => {
        console.error('Jazel PWA: Service Worker registration failed', error);
      });
      
    // Listen for controller change (after update)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Jazel PWA: Controller changed, reloading...');
      window.location.reload();
    });
    
    // Periodic update check every 2 minutes (more aggressive for desktop)
    updateCheckIntervalRef.current = setInterval(() => {
      if (registration && !hasCheckedForUpdateRef.current) {
        checkForUpdates(registration);
      }
    }, 2 * 60 * 1000);
    
    // Check for updates when page becomes visible (user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Jazel PWA: Page visible, checking for updates...');
        if (registration) {
          checkForUpdates(registration);
        } else if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            setRegistration(reg);
            checkForUpdates(reg);
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check for updates when window gets focus
    const handleFocus = () => {
      console.log('Jazel PWA: Window focused, checking for updates...');
      if (registration) {
        checkForUpdates(registration);
      } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          setRegistration(reg);
          checkForUpdates(reg);
        });
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Check for updates on page show (back/forward navigation)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('Jazel PWA: Page restored from bfcache, checking for updates...');
        if (registration) {
          checkForUpdates(registration);
        }
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show install prompt after a delay
      const timeoutId = setTimeout(() => {
        const dismissed = localStorage.getItem('jazel-install-dismissed');
        if (!dismissed) {
          setShowInstallPrompt(true);
        }
      }, 10000);

      (window as unknown as { __pwaTimeout?: ReturnType<typeof setTimeout> }).__pwaTimeout = timeoutId;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setWasInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show prompt after delay if not already installed
    let iosTimeoutId: ReturnType<typeof setTimeout> | undefined;
    if (isIOSSafari() && !isIOSStandalone()) {
      iosTimeoutId = setTimeout(() => {
        const dismissed = localStorage.getItem('jazel-install-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (!dismissed || Date.now() - dismissedTime > sevenDays) {
          setShowInstallPrompt(true);
        }
      }, 10000);
    }

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if (updateCheckIntervalRef.current) {
        clearInterval(updateCheckIntervalRef.current);
      }
      
      const timeoutId = (window as unknown as { __pwaTimeout?: ReturnType<typeof setTimeout> }).__pwaTimeout;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (iosTimeoutId) {
        clearTimeout(iosTimeoutId);
      }
    };
  }, [checkForUpdates, handleUpdateFound, isIOS, registration]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setWasInstalled(true);
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstallPrompt(false);
    localStorage.setItem('jazel-install-dismissed', Date.now().toString());
  }, []);
  
  const handleUpdate = useCallback(() => {
    console.log('Jazel PWA: User requested update...');
    
    // Tell the waiting service worker to activate
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
      // The controllerchange event will trigger a reload
      return;
    }
    
    // If no waiting worker, force a page reload to get the latest
    setShowUpdatePrompt(false);
    window.location.reload();
  }, [registration]);
  
  const handleDismissUpdate = useCallback(() => {
    setShowUpdatePrompt(false);
    sessionStorage.setItem('jazel-update-dismissed', 'true');
  }, []);

  // Check sessionStorage for dismissed state
  const shouldShowUpdate = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return showUpdatePrompt && !sessionStorage.getItem('jazel-update-dismissed');
  }, [showUpdatePrompt]);

  return (
    <>
      {children}

      {/* Update Available Banner */}
      <AnimatePresence>
        {shouldShowUpdate && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[100] p-4"
          >
            <div className="max-w-md mx-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Update Available!</h3>
                  <p className="text-xs text-white/80">
                    Version {APP_VERSION} is ready. Update for new features and fixes.
                  </p>
                </div>
                <button
                  onClick={handleDismissUpdate}
                  className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleUpdate}
                  className="flex-1 bg-white text-green-600 hover:bg-white/90 font-semibold"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Now
                </Button>
                <Button
                  onClick={handleDismissUpdate}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  Later
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Prompt Banner */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
          >
            <div className="bg-card border rounded-xl shadow-2xl p-4">
              {/* Android/Chrome Install Prompt */}
              {!isIOS && deferredPrompt && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                      <img
                        src="/icons/icon-96x96.png"
                        alt="Jazel"
                        className="w-10 h-10 rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">Install Jazel</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add Jazel to your home screen for quick access to your golf scorecard, even offline!
                      </p>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={handleInstall}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      variant="ghost"
                      size="sm"
                    >
                      Not now
                    </Button>
                  </div>
                </>
              )}

              {/* iOS Safari Install Instructions */}
              {(isIOS || !deferredPrompt) && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                      <img
                        src="/icons/icon-96x96.png"
                        alt="Jazel"
                        className="w-12 h-12 rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">Install Jazel</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add to your home screen for the best experience
                      </p>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* iOS Install Steps */}
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium mb-2">Follow these steps:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full bg-[#39638b] text-white flex items-center justify-center flex-shrink-0">
                          1
                        </div>
                        <span>Tap the</span>
                        <Share className="w-4 h-4 text-[#39638b]" />
                        <span>Share button at the bottom</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full bg-[#39638b] text-white flex items-center justify-center flex-shrink-0">
                          2
                        </div>
                        <span>Scroll down and tap</span>
                        <PlusSquare className="w-4 h-4 text-[#39638b]" />
                        <span>&quot;Add to Home Screen&quot;</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full bg-[#39638b] text-white flex items-center justify-center flex-shrink-0">
                          3
                        </div>
                        <span>Tap &quot;Add&quot; in the top right</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-3">
                    <Button
                      onClick={handleDismiss}
                      variant="ghost"
                      size="sm"
                    >
                      Got it
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook to manually trigger install
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  const isIOS = useMemo(() => isIOSSafari(), []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  return { canInstall, install, isIOS };
}

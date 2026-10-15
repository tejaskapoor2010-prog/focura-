/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { getStarryBackgroundEnabled, setStarryBackgroundEnabled } from '../utils/storage';

export function useStarryBackground() {
  const [starsEnabled, setStarsState] = useState<boolean>(() => getStarryBackgroundEnabled());

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
        setStarsState(customEvent.detail.enabled);
      } else {
        setStarsState(getStarryBackgroundEnabled());
      }
    };

    window.addEventListener('focura_starry_bg_changed', handleCustomChange);
    return () => {
      window.removeEventListener('focura_starry_bg_changed', handleCustomChange);
    };
  }, []);

  const toggleStars = useCallback(() => {
    setStarsState((prev) => {
      const next = !prev;
      setStarryBackgroundEnabled(next);
      return next;
    });
  }, []);

  const setStars = useCallback((val: boolean) => {
    setStarsState(val);
    setStarryBackgroundEnabled(val);
  }, []);

  return {
    starsEnabled,
    toggleStars,
    setStars,
  };
}

import { useState, useEffect } from 'react';

export interface VisualViewportState {
  viewportHeight: number;
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    if (typeof window === 'undefined') {
      return { viewportHeight: 0, keyboardHeight: 0, isKeyboardVisible: false };
    }
    const vv = window.visualViewport;
    const vHeight = vv ? vv.height : window.innerHeight;
    const kbHeight = vv ? Math.max(0, window.innerHeight - vv.height) : 0;
    return {
      viewportHeight: vHeight,
      keyboardHeight: kbHeight,
      isKeyboardVisible: kbHeight > 80
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const handleViewportChange = () => {
      const vHeight = vv ? vv.height : window.innerHeight;
      const kbHeight = vv ? Math.max(0, window.innerHeight - vv.height) : 0;
      const isKb = kbHeight > 80;

      setState({
        viewportHeight: vHeight,
        keyboardHeight: kbHeight,
        isKeyboardVisible: isKb
      });

      // When keyboard opens, ensure currently active input element stays visible
      if (isKb && document.activeElement && document.activeElement instanceof HTMLElement) {
        setTimeout(() => {
          document.activeElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 100);
      }
    };

    if (vv) {
      vv.addEventListener('resize', handleViewportChange);
      vv.addEventListener('scroll', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleViewportChange);
        vv.removeEventListener('scroll', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);

  return state;
}

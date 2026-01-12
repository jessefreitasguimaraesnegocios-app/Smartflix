import { useEffect, useRef, useState } from 'react';

export interface UseAutoplayTrailerOptions {
  isFocused: boolean;
  trailerKey: string | null;
  delay?: number; // Delay em ms antes de iniciar (padrão 800ms)
}

/**
 * Hook para autoplay inteligente de trailers
 * - Aguarda delay antes de iniciar
 * - Para automaticamente quando perde foco
 * - Remove iframe quando não está focado
 */
export const useAutoplayTrailer = (options: UseAutoplayTrailerOptions) => {
  const { isFocused, trailerKey, delay = 800 } = options;
  const [shouldPlay, setShouldPlay] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Se não está focado, parar imediatamente
    if (!isFocused) {
      setShouldPlay(false);
      isPlayingRef.current = false;
      return;
    }

    // Se não tem trailer, não fazer nada
    if (!trailerKey) {
      setShouldPlay(false);
      return;
    }

    // Se já está tocando, manter
    if (isPlayingRef.current) {
      return;
    }

    // Aguardar delay antes de iniciar
    timeoutRef.current = setTimeout(() => {
      if (isFocused && trailerKey) {
        setShouldPlay(true);
        isPlayingRef.current = true;
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isFocused, trailerKey, delay]);

  // Reset quando trailer muda
  useEffect(() => {
    if (!trailerKey) {
      setShouldPlay(false);
      isPlayingRef.current = false;
    }
  }, [trailerKey]);

  return {
    shouldPlay,
    isPlaying: isPlayingRef.current && shouldPlay,
  };
};

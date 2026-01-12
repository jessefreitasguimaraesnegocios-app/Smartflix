import { useEffect, useRef, useState, useCallback } from 'react';

export interface FocusPosition {
  row: number;
  col: number;
}

export interface UseTvFocusOptions {
  rows: number;
  colsPerRow: number[];
  onFocusChange?: (position: FocusPosition) => void;
  onEnter?: (position: FocusPosition) => void;
}

/**
 * Hook para gerenciar navegação por foco em TV (DPAD)
 * Gerencia foco por linha e coluna, com suporte a teclado e controle remoto
 */
export const useTvFocus = (options: UseTvFocusOptions) => {
  const { rows, colsPerRow, onFocusChange, onEnter } = options;
  const [focusedPosition, setFocusedPosition] = useState<FocusPosition>({ row: 0, col: 0 });
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Função para obter a chave única de um card
  const getCardKey = (row: number, col: number) => `${row}-${col}`;

  // Função para registrar referência de um card
  const registerCard = useCallback((row: number, col: number, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(getCardKey(row, col), element);
      // Se for o primeiro card, definir como focado
      if (row === 0 && col === 0 && !cardRefs.current.has(getCardKey(0, 0))) {
        element.focus();
      }
    } else {
      cardRefs.current.delete(getCardKey(row, col));
    }
  }, []);

  // Função para mover o foco
  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setFocusedPosition((current) => {
      let newRow = current.row;
      let newCol = current.col;

      switch (direction) {
        case 'up':
          if (newRow > 0) {
            newRow--;
            // Limitar coluna ao máximo da nova linha
            const maxColUp = colsPerRow[newRow] - 1;
            newCol = Math.min(newCol, maxColUp);
          }
          break;
        case 'down':
          if (newRow < rows - 1) {
            newRow++;
            // Limitar coluna ao máximo da nova linha
            const maxColDown = colsPerRow[newRow] - 1;
            newCol = Math.min(newCol, maxColDown);
          }
          break;
        case 'left':
          if (newCol > 0) {
            newCol--;
          } else if (newRow > 0) {
            // Ir para última coluna da linha anterior
            newRow--;
            newCol = colsPerRow[newRow] - 1;
          }
          break;
        case 'right':
          const maxCol = colsPerRow[newRow] - 1;
          if (newCol < maxCol) {
            newCol++;
          } else if (newRow < rows - 1) {
            // Ir para primeira coluna da próxima linha
            newRow++;
            newCol = 0;
          }
          break;
      }

      const newPosition = { row: newRow, col: newCol };
      
      // Focar no elemento
      const cardKey = getCardKey(newRow, newCol);
      const cardElement = cardRefs.current.get(cardKey);
      if (cardElement) {
        cardElement.focus();
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }

      // Notificar mudança
      if (onFocusChange) {
        onFocusChange(newPosition);
      }

      return newPosition;
    });
  }, [rows, colsPerRow, onFocusChange]);

  // Handler de teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorar se estiver digitando em um input
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveFocus('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveFocus('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveFocus('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveFocus('right');
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onEnter) {
          onEnter(focusedPosition);
        }
        break;
    }
  }, [moveFocus, onEnter, focusedPosition]);

  // Adicionar listener de teclado
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Função para definir foco programaticamente
  const setFocus = useCallback((row: number, col: number) => {
    const maxCol = colsPerRow[row] - 1;
    const validCol = Math.min(Math.max(0, col), maxCol);
    const validRow = Math.min(Math.max(0, row), rows - 1);

    setFocusedPosition({ row: validRow, col: validCol });
    
    const cardKey = getCardKey(validRow, validCol);
    const cardElement = cardRefs.current.get(cardKey);
    if (cardElement) {
      cardElement.focus();
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    if (onFocusChange) {
      onFocusChange({ row: validRow, col: validCol });
    }
  }, [rows, colsPerRow, onFocusChange]);

  return {
    focusedPosition,
    registerCard,
    moveFocus,
    setFocus,
  };
};

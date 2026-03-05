import React, { createContext, useContext, useState, useEffect } from 'react';
import { FretValue } from '../lib/chordLibrary';

export interface SavedVoicing {
  id: string;
  chordName: string;
  frets: FretValue[];
  startFret: number;
  label: string;
}

interface FavoritesContextType {
  favorites: SavedVoicing[];
  toggleFavorite: (voicing: SavedVoicing) => void;
  isFavorite: (id: string) => boolean;
}

export const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<SavedVoicing[]>(() => {
    const saved = localStorage.getItem('neo-soul-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('neo-soul-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (voicing: SavedVoicing) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === voicing.id);
      if (exists) {
        return prev.filter(f => f.id !== voicing.id);
      }
      return [...prev, voicing];
    });
  };

  const isFavorite = (id: string) => favorites.some(f => f.id === id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
}

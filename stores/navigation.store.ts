import { create } from 'zustand';

type NavigationState = {
  currentPath: string | null;
  previousPath: string | null;
  setPath: (path: string) => void;
};

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentPath: null,
  previousPath: null,
  setPath: (path: string) => {
    const currentPath = get().currentPath;

    if (currentPath === path) {
      return;
    }

    set({
      previousPath: currentPath,
      currentPath: path,
    });
  },
}));
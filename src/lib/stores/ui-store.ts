"use client";

import { create } from "zustand";

type State = {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  pdfPage: number;
  setPdfPage: (page: number) => void;

  pulsePage: number | null;
  pulse: (page: number) => void;

  chatPrefill: string | null;
  setChatPrefill: (text: string | null) => void;
};

export const useUiStore = create<State>((set) => ({
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  pdfPage: 1,
  setPdfPage: (page) => set({ pdfPage: page }),
  pulsePage: null,
  pulse: (page) => {
    set({ pulsePage: page });
    setTimeout(() => set({ pulsePage: null }), 1500);
  },
  chatPrefill: null,
  setChatPrefill: (text) => set({ chatPrefill: text }),
}));

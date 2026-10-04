import { create } from "zustand";

export const usePricingStore = create((set) => ({
  selectedOption: "bloc",
  setSelectedOption: (id) => set({ selectedOption: id }),
}));

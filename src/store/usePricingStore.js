import { create } from "zustand";

// Gère le choix de l'option de paiement (échelonné / bloc), partagé entre
// la section Tarifs et la bannière CTA finale.
export const usePricingStore = create((set) => ({
  selectedOption: "bloc",
  setSelectedOption: (id) => set({ selectedOption: id }),
}));

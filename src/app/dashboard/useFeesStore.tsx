import { create } from 'zustand';
import { useEffect } from 'react';

// Create store without immediately reading local storage
const useFeesStore = create((set) => ({
  paidFees: 70,
  unpaidFees: 30,

  updateFees: (paid, unpaid) => {
    const newData = { paidFees: paid, unpaidFees: unpaid };
    localStorage.setItem("feesData", JSON.stringify(newData)); // ✅ Store locally
    set(newData); // ✅ Update Zustand state
  },

  loadFeesFromStorage: () => {
    const savedFees = JSON.parse(localStorage.getItem("feesData"));
    if (savedFees) {
      set({ paidFees: savedFees.paidFees, unpaidFees: savedFees.unpaidFees });
    }
  },
}));

// ✅ Load fees from storage once when the app starts
export const useLoadFees = () => {
  const { loadFeesFromStorage } = useFeesStore();
  useEffect(() => {
    loadFeesFromStorage();
  }, []);
};

export default useFeesStore;

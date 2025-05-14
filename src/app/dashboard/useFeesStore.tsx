// app/dashboard/useFeesStore.ts
"use client"; // Add "use client" if this store is used in Client Components

import { create } from 'zustand';
import { useEffect } from 'react';

// 1. Define the interface for your store's state and actions
interface FeesState {
  paidFees: number;
  unpaidFees: number;
  setFees: (paid: number, unpaid: number) => void;
  // You can add other fee-related state or actions here if needed
  // For example:
  // totalFeesReceivable: number;
  // setTotalFeesReceivable: (total: number) => void;
}

// 2. Create the store with the defined type
const useFeesStore = create<FeesState>((set) => ({
  // Initial state
  paidFees: 0,
  unpaidFees: 0,
  // totalFeesReceivable: 0, // Example initial state

  // Actions to update the state
  setFees: (paid, unpaid) => set({ paidFees: paid, unpaidFees: unpaid }),
  // setTotalFeesReceivable: (total) => set({ totalFeesReceivable: total }), // Example action
}));

// 3. useLoadFees hook to load and set fee data into the store
export const useLoadFees = () => {
  // Get the action from the store to update fees
  const setFees = useFeesStore((state) => state.setFees);
  // const setTotalFeesReceivable = useFeesStore((state) => state.setTotalFeesReceivable); // Example

  useEffect(() => {
    // Simulate loading fees data.
    // In a real application, you would fetch this from an API or localStorage.
    const fetchFeesData = async () => {
      try {
        // Example: Fetching from localStorage
        const storedPaidFees = localStorage.getItem('totalPaidFees');
        const storedUnpaidFees = localStorage.getItem('totalUnpaidFees');
        // const storedTotalReceivable = localStorage.getItem('totalReceivableFees');

        const loadedPaidFees = storedPaidFees ? Number(JSON.parse(storedPaidFees)) : 50000; // Default if not found
        const loadedUnpaidFees = storedUnpaidFees ? Number(JSON.parse(storedUnpaidFees)) : 15000; // Default if not found
        // const loadedTotalReceivable = storedTotalReceivable ? Number(JSON.parse(storedTotalReceivable)) : 65000;

        // Update the store with the loaded data
        setFees(loadedPaidFees, loadedUnpaidFees);
        // setTotalFeesReceivable(loadedTotalReceivable); // Example

        // console.log("Fees loaded into store:", { loadedPaidFees, loadedUnpaidFees });
      } catch (error) {
        console.error("Failed to load fees data:", error);
        // Set default or error state if loading fails
        setFees(0, 0);
        // setTotalFeesReceivable(0);
      }
    };

    fetchFeesData();
  }, [setFees]); // Dependency array ensures this runs once on mount or when setFees changes (though setFees itself shouldn't change)
};

export default useFeesStore;

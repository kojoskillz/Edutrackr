// Example: ../dashboard/useFeesStore.ts
import { create } from 'zustand';
import { supabase } from '../Authentication-supabase/lib/supabase/supabaseClient'

interface FeesState {
  paidFees: number;
  unpaidFees: number;
  setPaidFees: (percentage: number) => void;
  setUnpaidFees: (percentage: number) => void;
  fetchFees: () => Promise<void>; // Add a fetch method
}

const useFeesStore = create<FeesState>((set) => ({
  paidFees: 0,
  unpaidFees: 0,

  // Fetch fees from Supabase
  fetchFees: async () => {
    try {
      const { data, error } = await supabase
        .from('school_statistics')
        .select('paid_fees_percentage, unpaid_fees_percentage')
        .limit(1)
        .single(); // Use single() if you expect only one row

      if (error) throw error;

      if (data) {
        set({
          paidFees: data.paid_fees_percentage,
          unpaidFees: data.unpaid_fees_percentage,
        });
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
      // Handle error, e.g., toast.error
    }
  },

  setPaidFees: async (percentage: number) => {
    set({ paidFees: percentage });
    // Update Supabase immediately
    try {
    } catch (error) {
      console.error("Error updating paid fees in DB:", error);
    }
  },

  setUnpaidFees: async (percentage: number) => {
    set({ unpaidFees: percentage });
    // Same as setPaidFees, relying on Page component to sync
  },
}));

export default useFeesStore;

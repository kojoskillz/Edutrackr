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
      // Assuming there's a single row for school_statistics,
      // you'd need its ID. A simpler approach if only one row: always update.
      // Or, better, fetch the ID first if it's the first update.
      // For now, let's assume `Page` component triggers the actual save to DB for `school_statistics`.
      // If you want direct update from here, you'd need the school_statistics ID.
      // For this example, I'll rely on the `Page` component's `handleSubmitSchoolStats`.
      // If you *only* change fees here, you'd need an ID to update.
      // For now, just set local state. The `Page` component's submit button for school stats will sync.
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

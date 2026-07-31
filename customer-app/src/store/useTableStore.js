import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTableStore = create(
  persist(
    (set) => ({
      tableNumber: 12, // Default table number for table-top device
      restaurantId: null,
      restaurantName: 'Gourmet Bistro',
      restaurantSlug: 'gourmet-bistro',
      restaurantLogo: null,
      restaurantBanner: null,

      setTableContext: (tableNum, restId, restName, restSlug) =>
        set({
          tableNumber: tableNum || 12,
          restaurantId: restId || null,
          restaurantName: restName || 'Gourmet Bistro',
          restaurantSlug: restSlug || 'gourmet-bistro',
        }),

      setRestaurantDetails: (restObj) =>
        set({
          restaurantId: restObj.id,
          restaurantName: restObj.name,
          restaurantSlug: restObj.slug,
          restaurantLogo: restObj.logo_url,
          restaurantBanner: restObj.banner_url,
        }),
    }),
    {
      name: 'smartserve_table',
    }
  )
);

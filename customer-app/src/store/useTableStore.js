import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTableStore = create(
  persist(
    (set) => ({
      tableNumber: 12, // Default table number for table-top device
      restaurantId: null,
      restaurantName: '',
      restaurantSlug: 'smartserve',
      restaurantLogo: null,
      restaurantBanner: null,
      restaurantAddress: null,
      restaurantPhone: null,
      restaurantEmail: null,
      restaurantCurrency: 'INR',
      restaurantOpeningTime: '10:00',
      restaurantClosingTime: '23:00',

      setTableContext: (tableNum, restId, restName, restSlug) =>
        set((state) => ({
          tableNumber: tableNum || state.tableNumber || 12,
          restaurantId: restId || state.restaurantId || null,
          restaurantName: restName || state.restaurantName || '',
          restaurantSlug: restSlug || state.restaurantSlug || 'smartserve',
        })),

      setRestaurantDetails: (restObj) =>
        set((state) => ({
          restaurantId: restObj?.id || state.restaurantId,
          restaurantName: restObj?.name || state.restaurantName,
          restaurantSlug: restObj?.slug || state.restaurantSlug,
          restaurantLogo: restObj?.logo_url !== undefined ? restObj.logo_url : state.restaurantLogo,
          restaurantBanner: restObj?.banner_url !== undefined ? restObj.banner_url : state.restaurantBanner,
          restaurantAddress: restObj?.address || restObj?.address_line1 || state.restaurantAddress,
          restaurantPhone: restObj?.phone || state.restaurantPhone,
          restaurantEmail: restObj?.email || state.restaurantEmail,
          restaurantCurrency: restObj?.currency || state.restaurantCurrency || 'INR',
          restaurantOpeningTime: restObj?.opening_time || state.restaurantOpeningTime,
          restaurantClosingTime: restObj?.closing_time || state.restaurantClosingTime,
        })),
    }),
    {
      name: 'smartserve_table',
    }
  )
);

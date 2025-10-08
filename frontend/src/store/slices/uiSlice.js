import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: 'light',
  sidebarOpen: true,
  notifications: [],
  isScanning: false,
  selectedProducts: [],
  filters: {
    products: {
      category: '',
      vendor: '',
      priceRange: [0, 10000],
      inStock: false
    },
    bills: {
      dateRange: [null, null],
      staff: '',
      status: 'all'
    }
  }
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload
      })
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setScanning: (state, action) => {
      state.isScanning = action.payload
    },
    selectProduct: (state, action) => {
      if (!state.selectedProducts.includes(action.payload)) {
        state.selectedProducts.push(action.payload)
      }
    },
    deselectProduct: (state, action) => {
      state.selectedProducts = state.selectedProducts.filter(
        id => id !== action.payload
      )
    },
    clearSelectedProducts: (state) => {
      state.selectedProducts = []
    },
    setProductFilters: (state, action) => {
      state.filters.products = {
        ...state.filters.products,
        ...action.payload
      }
    },
    setBillFilters: (state, action) => {
      state.filters.bills = {
        ...state.filters.bills,
        ...action.payload
      }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    }
  }
})

export const {
  toggleTheme,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setScanning,
  selectProduct,
  deselectProduct,
  clearSelectedProducts,
  setProductFilters,
  setBillFilters,
  resetFilters
} = uiSlice.actions

export default uiSlice.reducer
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import productReducer from './slices/productSlice'
import vendorReducer from './slices/vendorSlice'
import categoryReducer from './slices/categorySlice'
import comboReducer from './slices/comboSlice'
import billingReducer from './slices/billingSlice'
import inventoryReducer from './slices/inventorySlice'
import walletReducer from './slices/walletSlice'
import reportReducer from './slices/reportSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    vendors: vendorReducer,
    categories: categoryReducer,
    combos: comboReducer,
    billing: billingReducer,
    inventory: inventoryReducer,
    wallets: walletReducer,
    reports: reportReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})
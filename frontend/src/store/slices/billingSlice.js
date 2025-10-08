import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import billingService from '../../services/billingService'

const initialState = {
  bills: [],
  currentBill: null,
  cart: [],
  billingMode: 'normal', // 'normal' or 'combo'
  comboSlots: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
}

// Create bill
export const createBill = createAsyncThunk(
  'billing/createBill',
  async (billData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await billingService.createBill(billData, token)
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString()
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get bills
export const getBills = createAsyncThunk(
  'billing/getBills',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await billingService.getBills(params, token)
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString()
      return thunkAPI.rejectWithValue(message)
    }
  }
)

export const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.isSuccess = false
      state.isError = false
      state.message = ''
    },
    addToCart: (state, action) => {
      const existingItem = state.cart.find(item => item.product._id === action.payload.product._id)
      if (existingItem) {
        existingItem.quantity += action.payload.quantity
      } else {
        state.cart.push(action.payload)
      }
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter(item => item.product._id !== action.payload)
    },
    updateCartQuantity: (state, action) => {
      const { productId, quantity } = action.payload
      const item = state.cart.find(item => item.product._id === productId)
      if (item) {
        item.quantity = quantity
      }
    },
    clearCart: (state) => {
      state.cart = []
      state.comboSlots = []
    },
    setBillingMode: (state, action) => {
      state.billingMode = action.payload
    },
    addToComboSlot: (state, action) => {
      const { slotIndex, product } = action.payload
      if (!state.comboSlots[slotIndex]) {
        state.comboSlots[slotIndex] = []
      }
      state.comboSlots[slotIndex].push(product)
    },
    removeFromComboSlot: (state, action) => {
      const { slotIndex, productId } = action.payload
      if (state.comboSlots[slotIndex]) {
        state.comboSlots[slotIndex] = state.comboSlots[slotIndex].filter(
          product => product._id !== productId
        )
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBill.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.currentBill = action.payload
        state.cart = []
        state.comboSlots = []
      })
      .addCase(createBill.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getBills.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getBills.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.bills = action.payload
      })
      .addCase(getBills.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
  }
})

export const {
  reset,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  setBillingMode,
  addToComboSlot,
  removeFromComboSlot
} = billingSlice.actions

export default billingSlice.reducer
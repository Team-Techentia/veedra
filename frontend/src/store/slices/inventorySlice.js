import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import inventoryService from '../../services/inventoryService'

const initialState = {
  inventoryItems: [],
  lowStockItems: [],
  stockMovements: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
}

// Get inventory
export const getInventory = createAsyncThunk(
  'inventory/getInventory',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await inventoryService.getInventory(params, token)
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

// Get low stock items
export const getLowStockItems = createAsyncThunk(
  'inventory/getLowStockItems',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await inventoryService.getLowStockItems(token)
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

// Adjust stock
export const adjustStock = createAsyncThunk(
  'inventory/adjustStock',
  async (adjustmentData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await inventoryService.adjustStock(adjustmentData, token)
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

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.isSuccess = false
      state.isError = false
      state.message = ''
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getInventory.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getInventory.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.inventoryItems = action.payload
      })
      .addCase(getInventory.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getLowStockItems.fulfilled, (state, action) => {
        state.lowStockItems = action.payload
      })
      .addCase(adjustStock.pending, (state) => {
        state.isLoading = true
      })
      .addCase(adjustStock.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        // Update the specific inventory item
        const index = state.inventoryItems.findIndex(
          item => item._id === action.payload._id
        )
        if (index !== -1) {
          state.inventoryItems[index] = action.payload
        }
      })
      .addCase(adjustStock.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
  }
})

export const { reset } = inventorySlice.actions
export default inventorySlice.reducer
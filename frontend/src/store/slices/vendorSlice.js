import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import vendorService from '../../services/vendorService'

const initialState = {
  vendors: [],
  currentVendor: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
}

// Get all vendors
export const getVendors = createAsyncThunk(
  'vendors/getVendors',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await vendorService.getVendors(token)
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

// Create vendor
export const createVendor = createAsyncThunk(
  'vendors/createVendor',
  async (vendorData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await vendorService.createVendor(vendorData, token)
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

// Update vendor
export const updateVendor = createAsyncThunk(
  'vendors/updateVendor',
  async ({ id, vendorData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await vendorService.updateVendor(id, vendorData, token)
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

export const vendorSlice = createSlice({
  name: 'vendors',
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
      .addCase(getVendors.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getVendors.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.vendors = action.payload
      })
      .addCase(getVendors.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(createVendor.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.vendors.push(action.payload)
      })
      .addCase(createVendor.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(updateVendor.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        const index = state.vendors.findIndex(
          (vendor) => vendor._id === action.payload._id
        )
        if (index !== -1) {
          state.vendors[index] = action.payload
        }
      })
      .addCase(updateVendor.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
  }
})

export const { reset } = vendorSlice.actions
export default vendorSlice.reducer
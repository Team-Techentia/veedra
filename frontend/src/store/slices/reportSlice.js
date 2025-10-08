import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import reportService from '../../services/reportService'

const initialState = {
  dashboardData: null,
  salesReport: null,
  inventoryReport: null,
  commissionReport: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
}

// Get dashboard data
export const getDashboardData = createAsyncThunk(
  'reports/getDashboardData',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await reportService.getDashboardData(token)
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

// Get sales report
export const getSalesReport = createAsyncThunk(
  'reports/getSalesReport',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await reportService.getSalesReport(params, token)
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

export const reportSlice = createSlice({
  name: 'reports',
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
      .addCase(getDashboardData.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getDashboardData.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.dashboardData = action.payload
      })
      .addCase(getDashboardData.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getSalesReport.fulfilled, (state, action) => {
        state.salesReport = action.payload
      })
  }
})

export const { reset } = reportSlice.actions
export default reportSlice.reducer
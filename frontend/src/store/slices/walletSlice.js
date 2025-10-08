import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import walletService from '../../services/walletService'

const initialState = {
  wallets: [],
  transactions: [],
  currentWallet: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
}

// Get wallets
export const getWallets = createAsyncThunk(
  'wallets/getWallets',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await walletService.getWallets(token)
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

// Get wallet transactions
export const getWalletTransactions = createAsyncThunk(
  'wallets/getWalletTransactions',
  async (walletId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await walletService.getWalletTransactions(walletId, token)
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

export const walletSlice = createSlice({
  name: 'wallets',
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
      .addCase(getWallets.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getWallets.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.wallets = action.payload
      })
      .addCase(getWallets.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getWalletTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload
      })
  }
})

export const { reset } = walletSlice.actions
export default walletSlice.reducer
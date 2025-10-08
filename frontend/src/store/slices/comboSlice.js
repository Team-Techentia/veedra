import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import comboService from '../../services/comboService'

const initialState = {
  combos: [],
  currentCombo: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
}

// Get all combos
export const getCombos = createAsyncThunk(
  'combos/getCombos',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await comboService.getCombos(token)
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

// Create combo
export const createCombo = createAsyncThunk(
  'combos/createCombo',
  async (comboData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await comboService.createCombo(comboData, token)
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

// Toggle combo status
export const toggleComboStatus = createAsyncThunk(
  'combos/toggleComboStatus',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      return await comboService.toggleComboStatus(id, token)
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

export const comboSlice = createSlice({
  name: 'combos',
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
      .addCase(getCombos.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCombos.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.combos = action.payload
      })
      .addCase(getCombos.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(createCombo.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createCombo.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.combos.push(action.payload)
      })
      .addCase(createCombo.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(toggleComboStatus.fulfilled, (state, action) => {
        const index = state.combos.findIndex(
          (combo) => combo._id === action.payload._id
        )
        if (index !== -1) {
          state.combos[index] = action.payload
        }
      })
  }
})

export const { reset } = comboSlice.actions
export default comboSlice.reducer
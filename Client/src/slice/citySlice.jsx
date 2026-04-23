// src/slice/areaSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCitiesService } from "../service/cityService";

export const fetchCities = createAsyncThunk("city/fetchCities", async (data, thunkAPI) => {
  try {
    return await fetchCitiesService(data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch cities");
  }
});

const citySlice = createSlice({
  name: "city",
  initialState: {
    cities: [],
    loading: null,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload;
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default citySlice.reducer;

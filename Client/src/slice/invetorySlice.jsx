// src/slice/areaSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getInventoryService, updateStatusService } from "../service/inventoryService";

export const fetchInventory = createAsyncThunk("inventory/fetchInventory", async (thunkAPI) => {
  try {
    return await getInventoryService();
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch inventory");
  }
});

export const updateInventory = createAsyncThunk("inventory/updateInventory", async ({status, size, remarks, id}, thunkAPI) => {
  try {
    const formData = { status, size, remarks };
    console.log(id, formData);
    
    return await updateStatusService({id, formData});
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to update inventory");
  }
});

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    inventory: [],
    message: "",
    loading: null,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventory = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default inventorySlice.reducer;

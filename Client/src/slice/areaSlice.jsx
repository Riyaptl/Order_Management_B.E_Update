// src/slice/areaSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAreasService, fetchAllAreasService, deleteAreaService, updateAreaService, createAreaService, exportAreaService } from "../service/areaService";

export const fetchAreas = createAsyncThunk("area/fetchAreas", async (data, thunkAPI) => {
  try {
    return await fetchAreasService(data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch routes");
  }
});

export const fetchAllAreas = createAsyncThunk("area/fetchAllAreas", async ({page=1,dist_username}, thunkAPI) => {
  try {
    return await fetchAllAreasService({page, dist_username});
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch routes");
  }
});

export const deleteArea = createAsyncThunk("area/deleteArea", async (id, thunkAPI) => {
  try {
    return await deleteAreaService(id);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to delete route");
  }
});

export const updateArea = createAsyncThunk("area/updateArea", async ({id, name, areas, distributor, city}, thunkAPI) => {
  try {
    return await updateAreaService({id, name, areas, distributor, city});
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to update route");
  }
});

export const createArea = createAsyncThunk("area/createArea", async (area, thunkAPI) => {
  try {
    return await createAreaService(area);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to create route");
  }
});

export const exportCSVArea = createAsyncThunk("area/exportArea", async (_, thunkAPI) => {
  try {
    return await exportAreaService();
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to create route");
  }
});

const areaSlice = createSlice({
  name: "area",
  initialState: {
    areas: [],
    allAreas: [],
    loading: false,
    error: null,
    choseArea: localStorage.getItem('chosenArea') || null,
    choseAreaName: localStorage.getItem('choseAreaName') || null,
  },
  reducers: {
    setChoseArea: (state, action) => {
      state.choseArea = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAreas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAreas.fulfilled, (state, action) => {
        state.loading = false;
        state.areas = action.payload;
      })
      .addCase(fetchAreas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllAreas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAreas.fulfilled, (state, action) => {
        state.loading = false;
        state.allAreas = action.payload.areas;
      })
      .addCase(fetchAllAreas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteArea.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteArea.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null
      })
      .addCase(deleteArea.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateArea.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateArea.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null
      })
      .addCase(updateArea.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createArea.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createArea.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null
      })
      .addCase(createArea.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(exportCSVArea.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportCSVArea.fulfilled, (state) => {
        state.loading = false;
        state.error = null
      })
      .addCase(exportCSVArea.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setChoseArea } = areaSlice.actions;
export default areaSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchShopsByArea, fetchShopDetails, deleteShopService, updateShopService, createShopService, exportShopService, shiftShopService, importCSV, fetchShopOrders, blacklistShopService, surveyShopService } from "../service/shopService";


export const fetchShops = createAsyncThunk(
  "shop/fetchShops",
  async (data, thunkAPI) => {
    try {
      const shops = await fetchShopsByArea(data);
      return shops;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);


export const getShopDetails = createAsyncThunk(
  "shop/getDetails",
  async (id, thunkAPI) => {
    try {
      return await fetchShopDetails(id);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getShopOrders = createAsyncThunk(
  "shop/getOrders",
  async (id, thunkAPI) => {
    try {
      return await fetchShopOrders(id);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const blacklistShop = createAsyncThunk(
  "shop/blacklistShop",
  async (ids, thunkAPI) => {
    try {
      return await blacklistShopService(ids);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const deleteShop = createAsyncThunk(
  "shop/deleteShop",
  async (ids, thunkAPI) => {
    try {
      return await deleteShopService(ids);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const updateShop = createAsyncThunk(
  "shop/updateShop",
  async ({id, updates}, thunkAPI) => {
    try {
      return await updateShopService(id, updates);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const createShop = createAsyncThunk(
  "shop/createShop",
  async (updates, thunkAPI) => {
    try {
      return await createShopService(updates);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const shiftShop = createAsyncThunk(
  "shop/shiftShop",
  async (data, thunkAPI) => {
    try {
      return await shiftShopService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const surveyShop = createAsyncThunk(
  "shop/surveyShop",
  async (data, thunkAPI) => {
    try {
      return await surveyShopService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const exportCSVShop = createAsyncThunk(
  "shop/exportShop",
  async (data, thunkAPI) => {
    try {
      return await exportShopService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const importCSVShop = createAsyncThunk(
  "shop/importShop",
  async (data, thunkAPI) => {
    try {
      return await importCSV(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);


const shopSlice = createSlice({
  name: "shop",
  initialState: {
    shops: [],
    shopOrders: [],
    loading: false,
    error: null,
    shopDetails: null,
    shopDetailsLoading: false,
    shopDetailsError: null,
  },
  reducers: {
    clearShops: (state) => {
      state.shops = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShops.fulfilled, (state, action) => {
        state.loading = false;
        state.shops = action.payload.shops;
        
      })
      .addCase(fetchShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getShopDetails.pending, (state) => {
        state.shopDetailsLoading = true;
        state.shopDetailsError = null;
      })
      .addCase(getShopDetails.fulfilled, (state, action) => {
        state.shopDetails = action.payload;
        state.shopDetailsLoading = false;
      })
      .addCase(getShopDetails.rejected, (state, action) => {
        state.shopDetailsLoading = false;
        state.shopDetailsError = action.payload;
      }) 
      .addCase(getShopOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShopOrders.fulfilled, (state, action) => {
        state.shopOrders = action.payload;
        state.loading = false;
      })
      .addCase(getShopOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }) 
      .addCase(deleteShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteShop.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(blacklistShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(blacklistShop.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(blacklistShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(surveyShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(surveyShop.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(surveyShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateShop.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createShop.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }) 
      .addCase(shiftShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shiftShop.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(shiftShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(exportCSVShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportCSVShop.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(exportCSVShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }) 
      .addCase(importCSVShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importCSVShop.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(importCSVShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }); 
  },
});

export const { clearShops } = shopSlice.actions;
export default shopSlice.reducer;

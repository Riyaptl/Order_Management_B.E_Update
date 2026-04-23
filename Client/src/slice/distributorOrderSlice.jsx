import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteOrderService, getOrdersService, statusOrderService, placeOrder, paymentStatusService, updateOrderService, exportPDFService } from "../service/distributorOrderService";

// Async thunk
export const createOrder = createAsyncThunk(
  "distributorOrder/create",
  async (orderData, thunkAPI) => {
    try {
      return await placeOrder(orderData);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getOrders = createAsyncThunk(
  "distributorOrder/getOrders",
  async (data, thunkAPI) => {
    try {
      return await getOrdersService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const deleteOrder = createAsyncThunk(
  "distributorOrder/deleteOrder",
  async (id, thunkAPI) => {
    try {
            
      return await deleteOrderService(id);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const statusOrder = createAsyncThunk(
  "distributorOrder/statusOrder",
  async (data, thunkAPI) => {
    try {     
      return await statusOrderService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const updateOrder = createAsyncThunk(
  "distributorOrder/updateOrder",
  async (data, thunkAPI) => {
    try {      
      return await updateOrderService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const paymentStatusOrder = createAsyncThunk(
  "distributorOrder/paymentStatusOrder",
  async (data, thunkAPI) => {
    try {      
      return await paymentStatusService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const exportPDF = createAsyncThunk(
  "distributorOrder/exportPDF",
  async (id, thunkAPI) => {
    try {      

      return await exportPDFService(id);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);


const distributorOrderSlice = createSlice({
  name: "distributorOrder",
  initialState: {
    distributorOrders: [],
    loading: false,
    success: false,
    error: null,
    message: "",
  },
  reducers: {
    resetOrderState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.distributorOrders = action.payload.orders;       
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       .addCase(statusOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(statusOrder.fulfilled, (state) => {
        state.loading = false;
        state.error = null     
      })
      .addCase(statusOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       .addCase(exportPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportPDF.fulfilled, (state) => {
        state.loading = false;
        state.error = null     
      })
      .addCase(exportPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state) => {
        state.loading = false;
        state.error = null     
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       .addCase(paymentStatusOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(paymentStatusOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message
        state.error = null     
      })
      .addCase(paymentStatusOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state) => {
        state.loading = false;
        state.error = null     
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
     
      
  },
});

export const { resetOrderState } = distributorOrderSlice.actions;

export default distributorOrderSlice.reducer;

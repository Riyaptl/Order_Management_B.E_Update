import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteOrderService, exportOrdersCsvService, getOrdersService, statusOrderService, placeOrder, SrPerformance, salesReportService, getOrdersSRService, getOrdersDateService, getRevokedOrdersService, exportRevokedOrdersCsvService, cancelledReportService, SrCallsReport } from "../service/orderService";

// Async thunk
export const SrReport = createAsyncThunk(
  "order/report",
  async (data, thunkAPI) => {
    try {
      return await SrPerformance(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// Async thunk
export const callsReport = createAsyncThunk(
  "order/calls_report",
  async (data, thunkAPI) => {
    try {
      return await SrCallsReport(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  "order/create",
  async (orderData, thunkAPI) => {
    try {
      return await placeOrder(orderData);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getOrders = createAsyncThunk(
  "order/getOrders",
  async (data, thunkAPI) => {
    try {
      return await getOrdersService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getOrdersSR = createAsyncThunk(
  "order/getOrdersSR",
  async (data, thunkAPI) => {
    try {
      return await getOrdersSRService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getOrdersDate = createAsyncThunk(
  "order/getOrdersDate",
  async (data, thunkAPI) => {
    try {
      return await getOrdersDateService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getRevokedOrders = createAsyncThunk(
  "order/getRevokedOrders",
  async (data, thunkAPI) => {
    try {
      return await getRevokedOrdersService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);


export const salesReport = createAsyncThunk(
  "order/salesReport",
  async (data, thunkAPI) => {
    try {
      console.log(data);
      
      return await salesReportService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const cancelReport = createAsyncThunk(
  "order/cancelledReport",
  async (data, thunkAPI) => {
    try {
      return await cancelledReportService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const deleteOrder = createAsyncThunk(
  "order/deleteOrder",
  async (id, thunkAPI) => {
    try {
      return await deleteOrderService(id);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const statusOrder = createAsyncThunk(
  "order/statusOrder",
  async (data, thunkAPI) => {
    try {

      return await statusOrderService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const exportOrdersCsv = createAsyncThunk(
  "orders/exportCsv",
  async (exportParams, thunkAPI) => {
    try {
      const data = await exportOrdersCsvService(exportParams);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const exportRevokedOrdersCsv = createAsyncThunk(
  "orders/exportRevokedCsv",
  async (exportParams, thunkAPI) => {
    try {
      const data = await exportRevokedOrdersCsvService(exportParams);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState: {
    orders: [],
    summary: [],
    calls: [],
    loading: false,
    success: false,
    error: null,
    exportLoading: false,
    exportError: null,
    saleReport: {
      productTotals: {},
      overallTotals: {},
      amount: 0
    },
    saleReplaceReport: {
      productTotals: {},
      overallTotals: {},
      amount: 0
    },
    saleReturnReport: {
      productTotals: {},
      overallTotals: {},
      amount: 0
    },
    cancelledReport: {
      productTotals: {},
      overallTotals: {},
      amount: 0
    },
    cancelledReplaceReport: {
      productTotals: {},
      overallTotals: {},
      amount: 0
    },
    cancelledReturnReport: {
      productTotals: {},
      overallTotals: {},
      amount: 0
    }
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
    .addCase(SrReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(SrReport.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.totalSummary;    
      })
      .addCase(SrReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(callsReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(callsReport.fulfilled, (state, action) => {
        state.loading = false;
        state.calls = action.payload.totalCalls;    
      })
      .addCase(callsReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
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
        state.orders = action.payload.orders;       
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getOrdersSR.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersSR.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;       
      })
      .addCase(getOrdersSR.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getOrdersDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersDate.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;       
      })
      .addCase(getOrdersDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getRevokedOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRevokedOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;       
      })
      .addCase(getRevokedOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(salesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(salesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.saleReport = action.payload.saleReport       
        state.saleReplaceReport = action.payload.saleReplaceReport   
        state.saleReturnReport = action.payload.saleReturnReport   
      })
      .addCase(salesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelReport.fulfilled, (state, action) => {
        state.loading = false;
        state.cancelledReport = action.payload.cancelledReport       
        state.cancelledReplaceReport = action.payload.cancelledReplaceReport   
        state.cancelledReturnReport = action.payload.cancelledReturnReport   
      })
      .addCase(cancelReport.rejected, (state, action) => {
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
      .addCase(exportOrdersCsv.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportOrdersCsv.fulfilled, (state) => {
        state.exportLoading = false;
        state.exportError = null;
      })
      .addCase(exportOrdersCsv.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload ;
      })
      .addCase(exportRevokedOrdersCsv.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportRevokedOrdersCsv.fulfilled, (state) => {
        state.exportLoading = false;
        state.exportError = null;
      })
      .addCase(exportRevokedOrdersCsv.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload ;
      });
  },
});

export const { resetOrderState } = orderSlice.actions;

export default orderSlice.reducer;

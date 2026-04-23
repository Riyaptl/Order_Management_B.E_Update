import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchDistDetails, fetchSRDetails, singleSRService, statusDistsService, editDistsService, getDistsService, createPartnerService } from "../service/userService";

export const singleSRDetails = createAsyncThunk(
  "user/singleSRDetails",
  async (data, thunkAPI) => {
    try {
      return await singleSRService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getSRDetails = createAsyncThunk(
  "user/getDetails",
  async (thunkAPI) => {
    try {
      return await fetchSRDetails();
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getDistDetails = createAsyncThunk(
  "user/getDistDetails",
  async (thunkAPI) => {
    try {
      return await fetchDistDetails();
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const createPartner = createAsyncThunk(
  "user/createPartner",
  async (data, thunkAPI) => {
    try {
      
      return await createPartnerService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const getDists = createAsyncThunk(
  "user/getDists",
  async (data, thunkAPI) => {
    try {
      
      return await getDistsService(data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const editDist = createAsyncThunk(
  "user/editDist",
  async ({data, id}, thunkAPI) => {
    try {
      
      return await editDistsService({data, id});
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const statusDists = createAsyncThunk(
  "user/ststusDist",
  async ({data, id}, thunkAPI) => {
    try {
      
      return await statusDistsService({data, id});
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);



const userSlice = createSlice({
  name: "user",
  initialState: {
    srs: [],
    dists: [],
    allDists: [],
    loading: false,
    error: null,
    message: ""
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSRDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSRDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.srs = action.payload;
      })
      .addCase(getSRDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getDistDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDistDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.dists = action.payload;
      })
      .addCase(getDistDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }) 
      .addCase(getDists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDists.fulfilled, (state, action) => {
        state.loading = false;
        state.allDists = action.payload;
        console.log(action.payload, state.allDists );
      })
      .addCase(getDists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPartner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPartner.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(createPartner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }) 
      .addCase(editDist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editDist.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(editDist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }) 
      .addCase(statusDists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(statusDists.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(statusDists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;

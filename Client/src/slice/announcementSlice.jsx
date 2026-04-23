// src/slice/areaSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createAnnouncementService, deleteAnnouncementService, getAnnouncementService, replaceAnnouncementService } from "../service/announcementService";

export const fetchAnnouncement = createAsyncThunk("announcement/fetchAnnouncement", async (thunkAPI) => {
  try {
    return await getAnnouncementService();
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch announcement");
  }
});

export const replaceAnnouncement = createAsyncThunk("announcement/replaceAnnouncement", async ({remarks, id}, thunkAPI) => {
  try {
    const formData = { remarks };
    return await replaceAnnouncementService({id, formData});
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to replace announcement");
  }
});

export const createAnnouncement = createAsyncThunk("announcement/createAnnouncement", async (data, thunkAPI) => {
  try {
    return await createAnnouncementService(data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to create announcement");
  }
});

export const deleteAnnouncement = createAsyncThunk("announcement/deleteAnnouncement", async (id, thunkAPI) => {
  try {
    return await deleteAnnouncementService(id);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to delete announcement");
  }
});

const announcementSlice = createSlice({
  name: "announcement",
  initialState: {
    announcement: [],
    message: "",
    loading: null,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.announcement = action.payload;
      })
      .addCase(fetchAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(replaceAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(replaceAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(replaceAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default announcementSlice.reducer;

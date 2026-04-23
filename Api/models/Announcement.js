const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
    remarks: {
        type: String,
    },
    updatedBy: {
        type: String
    },
    updatedAt: {
        type: Date
    },
    createdBy: {
        type: String
    },
    createdAt: {
        type: String
    }
});

module.exports = mongoose.model("Announcement", announcementSchema);

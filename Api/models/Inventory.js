const mongoose = require("mongoose");


const inventrorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    size: {
        type: String
    },
    status: {
        type: String,
        enum: ["In Stock", "Running Low", "Out of Stock"],
        default: "In Stock"
    },
    remarks: {
        type: String
    },
    updatedBy: {
        type: String
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model("Inventory", inventrorySchema);

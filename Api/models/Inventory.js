const mongoose = require("mongoose");


const productList = [
  "Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g", "Blueberry 50g", "Hazelnut 50g", "Orange 50g", "Berries Burst 50g",
  "Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g",
  "Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Blueberry 25g", "Hazelnut 25g", "Berries Burst 25g",
  "Orange 25g", "Mint 25g", "Classic Coffee 25g", "Dark Coffee 25g",
  "Intense Coffee 25g", "Toxic Coffee 25g", "Gift box", 
  "Hazelnut & Blueberries 55g", "Roasted Almonds & Pink Salt 55g", "Kiwi & Pineapple 55g", "Ginger & Cinnamon 55g", "Pistachio & Black Raisin 55g", "Dates & Raisin 55g"
];

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

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require("validator");
const bcrypt = require("bcrypt")

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
    },
    dept_name: {
        type: String,
    },
    role_name: {
        type: String,
    },
    // role: { 
    //     type: String, 
    //     enum: ['sr', 'admin', "distributor", "me", "tl"], 
    //     default: 'sr' 
    // },
    address: {
        type: String
    },
    name: {
        type: String
    },
    city: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "City"
    }],
    city_name: [{
        type: String
    }],
    gst: {
        type: String
    },
    contact: {
        type: String
    },
    otp: {
        type: String
    },
    otpGeneratedAt: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String
    },
    updatedBy: {
        type: String
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    assigned: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    subordinates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    assignedBy: {
        type: String
    },
    assignedAt: {
        type: Date
    },
    partners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    companyPersonal: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

UserSchema.statics.login = async function ({ username, password }) {
    if (!username || !password) {
        throw Error("All fileds must be filled")
    }
    const user = await this.findOne({ username })
    if (!user) {
        throw Error("Invalid credentials")
    }
    const validated = await bcrypt.compare(password, user.password)
    if (!validated) {
        throw Error("Invalid credentials")
    }
    return user
}

module.exports = mongoose.model('User', UserSchema);
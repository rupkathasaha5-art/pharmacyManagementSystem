import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    org: {
      // Uncommented the ObjectId reference to properly link to your Org schema
      type: Schema.Types.ObjectId,
      ref: 'Org',
      // Conditionally required - only ORG_ADMIN accounts need to be linked to an Org.
      // Super Admins and Drivers don't belong to a retail Org!
      required: function () {
        return this.role === 'ORG_ADMIN';
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    //mobile Number for automated comms and driver logistics
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      enum: ["ORG_ADMIN", "SUPER_ADMIN", "DRIVER"],
      default: "ORG_ADMIN",
    },
    //account toggle for offboarding staff without deleting history
    isActive: {
      type: Boolean,
      default: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    refreshToken: {
      type: String
    }
  }, 
  { timestamps: true }
);

// NOTE: this hook is async, so Mongoose treats it as promise-style middleware
// and does NOT supply a real `next` callback. Don't declare or call `next` here -
// just await your logic and throw on error; Mongoose handles both automatically.
userSchema.pre("save", async function() {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});


userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password); 
};

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  );
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
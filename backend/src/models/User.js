import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Cost 12 is the project standard: slow enough to make offline cracking
// expensive, fast enough that a login stays well under a second.
export const BCRYPT_COST = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // Excluded from every query by default, so no handler can leak it by
      // accident. Login opts back in with .select("+password").
      select: false,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
  },
  { timestamps: true },
);

// Mongoose validates before running save hooks, so minlength above is checked
// against the plaintext and this hook only ever sees a password worth hashing.
userSchema.pre("save", async function hashPassword(next) {
  // Without this guard a profile update re-hashes the stored hash and the
  // user can never log in again.
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, BCRYPT_COST);
  next();
});

// Requires the document to have been loaded with .select("+password").
userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);

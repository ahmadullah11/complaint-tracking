import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  cnic: string;
  mobile: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    cnic: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      length: 13,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  (mongoose.models && mongoose.models.User) ||
  mongoose.model<IUser>("User", UserSchema);

export interface IComplaint extends Document {
  trackingNumber: string;
  userId: Types.ObjectId;
  category?: string;
  subject: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: false,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      default: "Pending",
      enum: ["Pending", "Under Review", "In Progress", "Resolved", "Closed"],
    },
  },
  {
    timestamps: true,
  }
);

export const Complaint: Model<IComplaint> =
  (mongoose.models && mongoose.models.Complaint) ||
  mongoose.model<IComplaint>("Complaint", ComplaintSchema);

// Backward-compatible aliases
export const users = User;
export const complaints = Complaint;

import { Schema, model, models, Document, Types } from "mongoose";
import { IUserDocument, IUserModel } from "../../types";
import { UserRole } from "@/lib/types";
import { string } from "zod";

const UserSchema = new Schema<IUserDocument, IUserModel>(
    {
        firstName: { type: String, required: [true, 'First name is required'], trim: true, minlength: [2, 'First name must be at least 2 characters'], maxlength: [50, 'First name cannot exceed 50 characters'], match: [/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'] },
        lastName: { type: String, required: [true, 'Last name is required'], trim: true, minlength: [2, 'Last name must be at least 2 characters'], maxlength: [50, 'Last name cannot exceed 50 characters'], match: [/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'] },
        email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'], maxlength: [255, 'Email cannot exceed 255 characters'] },
        phone: { type: String, unique: true, sparse: true, trim: true, index: true, match: [/^\+\d{10,15}$/, 'Please enter a valid phone number'] },
        password: { type: String, required: [true, 'Password hash is required'], select: false },
        role: { type: String, enum: { values: Object.values(UserRole), message: 'Invalid user role' }, default: UserRole.USER, index: true },
        walletAddress: { type: String, trim: true, sparse: true, index: true, },
        balance: { type: Number, default: 0, min: [0, 'Balance cannot be negative'] },
        points: { type: Number, default: 0, min: [0, 'Points cannot be negative'] },
        // status: { type: String, enum: { values: Object.values(AccountStatus), message: 'Invalid account status' }, default: AccountStatus.PENDING_VERIFICATION, index: true },
        isActive: { type: Boolean, default: true, index: true },
        isDeleted: { type: Boolean, default: false, index: true },
        isEmailVerified: { type: Boolean, default: false, index: true },
        isPhoneVerified: { type: Boolean, default: false, index: true },
        lastLogin: { type: Date },
        deletedAt: { type: Date, default: null },
        isAdmin: { type: Boolean, default: false },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                const r = ret as any;
                delete r.password;
                delete r.__v;
                return r;
            }
        },
        toObject: { virtuals: true }
    }
);

UserSchema.index({ email: 1, phone: 1 }, { sparse: true });
UserSchema.index({ email: 1, isDeleted: 1 }, { sparse: true });
UserSchema.index({ phone: 1, isDeleted: 1 }, { sparse: true });
UserSchema.index({ isDeleted: 1, isActive: 1 });
UserSchema.index({ status: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLogin: -1 });

UserSchema.pre('validate', function () {
    if (!this.email && !this.phone) {
        throw new Error('Either email or phone must be provided')
    }
});

UserSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.virtual('isAdminUser').get(function () {
    return this.role === UserRole.ADMIN;
});

UserSchema.virtual('isLocked').get(function () {
    return !!(this.metadata?.lockUntil && this.metadata.lockUntil > new Date());
});

UserSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase(), isDeleted: false });
};

UserSchema.statics.findByPhone = function (phone: string) {
    return this.findOne({ phone: phone.trim(), isDeleted: false });
};

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, this.password);
};

UserSchema.methods.generatePasswordResetToken = function (): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
};

UserSchema.methods.softDelete = async function (): Promise<void> {
    return this.updateOne({
        $set: {
            isDeleted: true, deletedAt: new Date(), isActive: false,
            // status: AccountStatus.INACTIVE
        }
    });
};

export const User = (models?.User as IUserModel) || model<IUserDocument, IUserModel>("User", UserSchema);
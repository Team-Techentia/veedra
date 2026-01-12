import { Document, Model, Query, Schema, Types } from 'mongoose';
import { UserRole } from '@/lib/types';

export interface IUser {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    password: string;
    role: UserRole;
    isAdmin: boolean;
    walletAddress?: string;
    balance: number; // Store in smallest unit (e.g., cents for USD, wei for ETH)
    points: number;

    // Account Status and Security
    // status: AccountStatus;
    isActive: boolean;
    isDeleted: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;

    // Security Metadata
    metadata?: {
        referredBy?: Schema.Types.ObjectId | null,
        referrals?: Schema.Types.ObjectId[],
        referredPaid?: boolean,
        twoFactorEnabled?: boolean;
        emailVerified?: boolean;
        phoneVerified?: boolean;
        lockUntil?: Date;
        passwordChangedAt: Date;
        passwordResetToken: String;
        passwordResetExpiry: Date;
        passwordChangeToken: String;
        passwordChangeExpiry: Date;
        preferences?: {
            notifications?: {
                email?: boolean;
                sms?: boolean;
                push?: boolean;
            };
        };
        securityQuestions?: Array<{
            question: string;
            answerHash: string;
        }>;
        [key: string]: any;
    };

    // Timestamps
    lastLogin?: Date;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    // Virtual fields
    fullName: string;
    isLocked: boolean;
}

// Document interface (combines IUser with Document and instance methods)
export interface IUserDocument extends IUser, Document {
    comparePassword(password: string): Promise<boolean>;
    generatePasswordResetToken(): string;
    softDelete(): Promise<void>;
    // Virtual properties
    fullName: string;
    isAdminUser: boolean;
    isLocked: boolean;
}

// Model interface (combines static methods with the Model)
export interface IUserModel extends Model<IUserDocument> {
    findByEmail(email: string): Query<IUserDocument | null, IUserDocument>;
    findByPhone(phone: string): Query<IUserDocument | null, IUserDocument>;
}
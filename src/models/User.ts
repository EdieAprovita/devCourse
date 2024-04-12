import mongoose, { Document, Model, Schema, UpdateQuery } from "mongoose";
import { Response, NextFunction } from "express";
import { userService } from "../services/UserService";

export interface IUser extends Document {
	name: string;
	email: string;
	role: string;
	password: string;
	resetPasswordToken?: string;
	resetPasswordExpire?: Date;
	confirmEmailToken?: string;
	isEmailConfirmed: boolean;
	twoFactorCode?: string;
	twoFactorCodeExpire?: Date;
	twoFactorEnable: boolean;
	createdAt: Date;

	getSignedJwtToken: () => string;
	matchPassword: (enteredPassword: string) => Promise<boolean>;
	getResetPasswordToken: () => string;
	generateEmailConfirmToken: () => string;
}

interface IUserModel extends Model<IUser> {
	generateTokenAndSetCookie: (res: Response, userId: string) => void;
}

const userSchema = new Schema<IUser>({
	name: {
		type: String,
		required: [true, "Please add a name"],
	},
	email: {
		type: String,
		required: [true, "Please add an email"],
		unique: true,
		match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please add a valid email"],
	},
	role: {
		type: String,
		enum: ["user", "publisher"],
		default: "user",
	},
	password: {
		type: String,
		required: [true, "Please add a password"],
		minlength: 6,
		select: false,
	},
	resetPasswordToken: String,
	resetPasswordExpire: Date,
	confirmEmailToken: String,
	isEmailConfirmed: {
		type: Boolean,
		default: false,
	},
	twoFactorCode: String,
	twoFactorCodeExpire: Date,
	twoFactorEnable: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

userSchema.pre<IUser>("save", async function (next: NextFunction) {
	if (!this.isModified("password")) {
		next();
	}

	const hashedPassword = await userService.hashPassword(this.password);
	this.password = hashedPassword;
	next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
	const updateQuery: UpdateQuery<IUser> | null = this.getUpdate();

	if (updateQuery && updateQuery.password) {
		updateQuery.password = await userService.hashPassword(updateQuery.password);
	}

	next();
});

userSchema.methods.getSignedJwtToken = function (): Promise<string> {
	return userService.generateJwtToken(this._id);
};

userSchema.methods.matchPassword = async function (
	enteredPassword: string
): Promise<boolean> {
	return userService.comparePassword(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function (): Promise<string> {
	return userService.generateResetPasswordToken();
};

userSchema.methods.generateEmailConfirmToken = function (): Promise<string> {
	return userService.generateEmailConfirmToken();
};

userSchema.statics.generateTokenAndSetCookie = function (
	res: Response,
	userId: string
): void {
	userService.generateTokenAndSetCookie(res, userId);
};

export const User: IUserModel = mongoose.model<IUser, IUserModel>("User", userSchema);

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";
import { IUser } from "../models/User";
import generateTokenAndSetCookie from "../utils/generateToken";

export class UserService {
	async hashPassword(password: string): Promise<string> {
		const salt = await bcrypt.genSalt(10);
		return bcrypt.hash(password, salt);
	}

	async comparePassword(
		enteredPassword: string,
		hashedPassword: string
	): Promise<boolean> {
		return bcrypt.compare(enteredPassword, hashedPassword);
	}

	async generateJwtToken(id: string): Promise<string> {
		return jwt.sign({ id }, process.env.JWT_SECRET as string, {
			expiresIn: process.env.JWT_EXPIRE,
		});
	}
	async matchPassword(enteredPassword: string, userPassword: string): Promise<boolean> {
		return bcrypt.compare(enteredPassword, userPassword);
	}

	async generateResetPasswordToken(): Promise<string> {
		const resetToken = crypto.randomBytes(20).toString("hex");
		return crypto.createHash("sha256").update(resetToken).digest("hex");
	}

	async generateEmailConfirmToken(): Promise<string> {
		const confirmationToken = crypto.randomBytes(20).toString("hex");
		const confirmTokenExtend = crypto.randomBytes(100).toString("hex");
		return `${confirmationToken}.${confirmTokenExtend}`;
	}

	async generateTokenAndSetCookie(res: Response, userId: string): Promise<void> {
		generateTokenAndSetCookie(res, userId);
	}

	async updateUserPassword(user: IUser, newPassword: string): Promise<void> {
		const hashedPassword = await this.hashPassword(newPassword);
		user.password = hashedPassword;
		await user.save();
	}
}

export const userService = new UserService();

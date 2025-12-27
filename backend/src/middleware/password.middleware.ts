import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';

/**
 * Middleware to check if user must change password
 * Allows access only to password change endpoints if flag is true
 */
export const checkPasswordChangeRequired = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    // Skip check for password change endpoints
    if (req.path.includes('/change-password') || req.path.includes('/auth/')) {
        next();
        return;
    }

    // Check if user object exists (from auth middleware)
    if (!req.user) {
        next();
        return;
    }

    // This will be populated by the auth middleware after verifying the user exists
    // We'll need to add must_change_password to the user object in auth middleware
    const mustChangePassword = (req.user as any).must_change_password;

    if (mustChangePassword === true) {
        res.status(403).json({
            error: 'Password change required',
            message: 'You must change your password before accessing other resources',
            must_change_password: true
        });
        return;
    }

    next();
};

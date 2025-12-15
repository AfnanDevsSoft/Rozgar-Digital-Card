import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        lab_id?: string;
    };
}

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
    lab_id?: string;
    type: 'admin' | 'user' | 'staff';
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Verify user still exists and is active
        if (decoded.type === 'admin') {
            const admin = await prisma.admin.findUnique({
                where: { id: decoded.id }
            });
            if (!admin || !admin.is_active) {
                res.status(401).json({ error: 'Account not found or inactive' });
                return;
            }
        } else if (decoded.type === 'user') {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });
            if (!user || !user.is_active) {
                res.status(401).json({ error: 'Account not found or inactive' });
                return;
            }
        } else if (decoded.type === 'staff') {
            const staff = await prisma.labStaff.findUnique({
                where: { id: decoded.id }
            });
            if (!staff || !staff.is_active) {
                res.status(401).json({ error: 'Account not found or inactive' });
                return;
            }
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            lab_id: decoded.lab_id
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Generate JWT token
export const generateToken = (payload: JwtPayload, expiresIn: string = '24h'): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

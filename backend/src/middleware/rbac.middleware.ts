import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';

type Role = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'RECEPTIONIST' | 'USER';

export const requireRoles = (...allowedRoles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role as Role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};

// Specific role middlewares for convenience
export const requireSuperAdmin = requireRoles('SUPER_ADMIN');
export const requireAdmin = requireRoles('SUPER_ADMIN', 'BRANCH_ADMIN');
export const requireLabAccess = requireRoles('SUPER_ADMIN', 'BRANCH_ADMIN', 'RECEPTIONIST');
export const requireUser = requireRoles('USER');

// Check if user has access to a specific lab
export const requireLabOwnership = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    // Super admins can access all labs
    if (req.user.role === 'SUPER_ADMIN') {
        next();
        return;
    }

    // Get lab_id from params or body
    const labId = req.params.labId || req.body.lab_id;

    // Branch admins and receptionists can only access their assigned lab
    if (req.user.lab_id && req.user.lab_id !== labId) {
        res.status(403).json({ error: 'Access denied to this lab' });
        return;
    }

    next();
};

/**
 * Swagger Configuration
 * API Documentation for Digital Health Card System
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Digital Health Card API',
            version: '1.0.0',
            description: `
## Digital Health Card & Lab Management System API

This API powers a comprehensive health card management system with automatic discount calculation for partner laboratories.

### Key Features:
- 🎫 **Health Card Management** - Issue, verify, and renew digital health cards
- 🏥 **Lab Partner Network** - Manage partner laboratories
- 💳 **Automatic Discounts** - 30% discount auto-applied at billing
- 📄 **Report Management** - Upload and deliver lab reports
- 📧 **Email Notifications** - Automated notifications to users

### Authentication:
All protected endpoints require a JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

### Default Admin Credentials:
- **Email:** admin@system.com
- **Password:** Admin@123
            `,
            contact: {
                name: 'API Support',
                email: 'support@healthcard.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Authentication', description: 'Login and authentication endpoints' },
            { name: 'Users', description: 'User management (Admin only)' },
            { name: 'Health Cards', description: 'Card verification and management' },
            { name: 'Labs', description: 'Laboratory partner management' },
            { name: 'Lab Staff', description: 'Lab receptionist management' },
            { name: 'Test Catalog', description: 'Lab test catalog management' },
            { name: 'Transactions', description: 'Billing with auto-discount' },
            { name: 'Reports', description: 'Lab report upload and delivery' },
            { name: 'Discount', description: 'Discount configuration' },
            { name: 'Admins', description: 'Admin user management' }
        ],
        paths: {
            // ============ AUTHENTICATION ============
            '/api/auth/admin/login': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Admin Login',
                    description: 'Login for Super Admin and Branch Admin',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'admin@system.com' },
                                        password: { type: 'string', example: 'Admin@123' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Login successful, returns JWT token' },
                        '401': { description: 'Invalid credentials' }
                    }
                }
            },
            '/api/auth/user/login': {
                post: {
                    tags: ['Authentication'],
                    summary: 'User Login',
                    description: 'Login for card holders using serial number and password',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['serial_number', 'password'],
                                    properties: {
                                        serial_number: { type: 'string', example: 'SSC-2512-0001-0001' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Login successful' },
                        '401': { description: 'Invalid credentials' }
                    }
                }
            },
            '/api/auth/staff/login': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Lab Staff Login',
                    description: 'Login for lab receptionists',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Login successful' },
                        '401': { description: 'Invalid credentials' }
                    }
                }
            },
            '/api/auth/me': {
                get: {
                    tags: ['Authentication'],
                    summary: 'Get Current User Profile',
                    description: 'Returns the profile of the currently authenticated user',
                    responses: {
                        '200': { description: 'User profile' },
                        '401': { description: 'Unauthorized' }
                    }
                }
            },
            '/api/auth/change-password': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Change Password',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        current_password: { type: 'string' },
                                        new_password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Password changed' },
                        '401': { description: 'Current password incorrect' }
                    }
                }
            },

            // ============ USERS ============
            '/api/users': {
                get: {
                    tags: ['Users'],
                    summary: 'Get All Users',
                    description: 'List all users with pagination (Admin only)',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer' } },
                        { name: 'search', in: 'query', schema: { type: 'string' } }
                    ],
                    responses: {
                        '200': { description: 'List of users with pagination' }
                    }
                },
                post: {
                    tags: ['Users'],
                    summary: 'Create User',
                    description: 'Create new user with auto-generated health card',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email', 'phone'],
                                    properties: {
                                        name: { type: 'string', example: 'John Doe' },
                                        email: { type: 'string', example: 'john@example.com' },
                                        phone: { type: 'string', example: '+92-300-1234567' },
                                        address: { type: 'string' },
                                        card_validity_years: { type: 'integer', default: 1 }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'User created with health card' }
                    }
                }
            },
            '/api/users/{id}': {
                get: {
                    tags: ['Users'],
                    summary: 'Get User by ID',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { '200': { description: 'User details' } }
                },
                put: {
                    tags: ['Users'],
                    summary: 'Update User',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { '200': { description: 'User updated' } }
                },
                delete: {
                    tags: ['Users'],
                    summary: 'Delete User',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { '200': { description: 'User deleted' } }
                }
            },
            '/api/users/{id}/toggle-status': {
                patch: {
                    tags: ['Users'],
                    summary: 'Toggle User Status',
                    description: 'Activate or deactivate user account',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { '200': { description: 'Status toggled' } }
                }
            },
            '/api/users/{id}/reset-password': {
                post: {
                    tags: ['Users'],
                    summary: 'Reset User Password',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { '200': { description: 'Password reset and sent via email' } }
                }
            },

            // ============ HEALTH CARDS ============
            '/api/cards': {
                get: {
                    tags: ['Health Cards'],
                    summary: 'Get All Health Cards',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer' } },
                        { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'LOST'] } }
                    ],
                    responses: { '200': { description: 'List of health cards' } }
                }
            },
            '/api/cards/verify/{serial}': {
                get: {
                    tags: ['Health Cards'],
                    summary: 'Verify Card by Serial',
                    description: 'Verify a health card and check discount eligibility',
                    parameters: [{ name: 'serial', in: 'path', required: true, schema: { type: 'string' }, example: 'SSC-2512-0001-0001' }],
                    responses: {
                        '200': { description: 'Card details with discount eligibility' },
                        '404': { description: 'Card not found' }
                    }
                }
            },
            '/api/cards/{id}/renew': {
                patch: {
                    tags: ['Health Cards'],
                    summary: 'Renew Card',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        expiry_date: { type: 'string', format: 'date' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '200': { description: 'Card renewed' } }
                }
            },
            '/api/cards/{id}/status': {
                patch: {
                    tags: ['Health Cards'],
                    summary: 'Update Card Status',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'LOST'] }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '200': { description: 'Status updated' } }
                }
            },

            // ============ LABS ============
            '/api/labs': {
                get: {
                    tags: ['Labs'],
                    summary: 'Get All Labs',
                    responses: { '200': { description: 'List of labs' } }
                },
                post: {
                    tags: ['Labs'],
                    summary: 'Create Lab',
                    description: 'Create new partner laboratory (Super Admin only)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'address', 'phone', 'email'],
                                    properties: {
                                        name: { type: 'string', example: 'City Diagnostics' },
                                        address: { type: 'string' },
                                        phone: { type: 'string' },
                                        email: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '201': { description: 'Lab created with auto-generated code' } }
                }
            },
            '/api/labs/{id}': {
                get: {
                    tags: ['Labs'],
                    summary: 'Get Lab by ID',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { '200': { description: 'Lab details' } }
                },
                put: {
                    tags: ['Labs'],
                    summary: 'Update Lab',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { '200': { description: 'Lab updated' } }
                }
            },

            // ============ LAB STAFF ============
            '/api/lab-staff': {
                get: {
                    tags: ['Lab Staff'],
                    summary: 'Get Lab Staff',
                    description: 'List receptionists for the lab',
                    responses: { '200': { description: 'List of staff' } }
                },
                post: {
                    tags: ['Lab Staff'],
                    summary: 'Create Lab Staff',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        email: { type: 'string' },
                                        phone: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '201': { description: 'Staff created' } }
                }
            },

            // ============ TEST CATALOG ============
            '/api/test-catalog': {
                get: {
                    tags: ['Test Catalog'],
                    summary: 'Get Test Catalog',
                    description: 'List all tests for the lab',
                    responses: { '200': { description: 'List of tests' } }
                },
                post: {
                    tags: ['Test Catalog'],
                    summary: 'Add Test to Catalog',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string', example: 'Complete Blood Count' },
                                        category: { type: 'string', example: 'Hematology' },
                                        price: { type: 'number', example: 2000 }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '201': { description: 'Test added' } }
                }
            },

            // ============ TRANSACTIONS ============
            '/api/transactions': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Get All Transactions',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer' } },
                        { name: 'search', in: 'query', schema: { type: 'string' } }
                    ],
                    responses: { '200': { description: 'List of transactions' } }
                },
                post: {
                    tags: ['Transactions'],
                    summary: 'Create Transaction',
                    description: 'Create billing with AUTO 30% discount applied',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['serial_number', 'test_name', 'original_amount'],
                                    properties: {
                                        serial_number: { type: 'string', example: 'SSC-2512-0001-0001' },
                                        test_name: { type: 'string', example: 'Complete Blood Count' },
                                        original_amount: { type: 'number', example: 2000 }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Transaction created with discount',
                            content: {
                                'application/json': {
                                    example: {
                                        receipt_number: 'INV-2024-00001',
                                        original_amount: 2000,
                                        discount_percentage: 30,
                                        discount_amount: 600,
                                        final_amount: 1400
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/transactions/my': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Get My Transactions',
                    description: 'Get transactions for the logged-in user (User Portal)',
                    responses: { '200': { description: 'User transactions' } }
                }
            },
            '/api/transactions/calculate': {
                post: {
                    tags: ['Transactions'],
                    summary: 'Calculate Discount Preview',
                    description: 'Preview discount without creating transaction',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        original_amount: { type: 'number', example: 2000 }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '200': { description: 'Discount calculation' } }
                }
            },

            // ============ REPORTS ============
            '/api/reports': {
                get: {
                    tags: ['Reports'],
                    summary: 'Get All Reports',
                    description: 'List reports (Lab/Admin)',
                    responses: { '200': { description: 'List of reports' } }
                },
                post: {
                    tags: ['Reports'],
                    summary: 'Upload Report',
                    description: 'Upload report file and notify patient via email',
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        transaction_id: { type: 'string' },
                                        file: { type: 'string', format: 'binary' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '201': { description: 'Report uploaded, email sent' } }
                }
            },
            '/api/reports/my': {
                get: {
                    tags: ['Reports'],
                    summary: 'Get My Reports',
                    description: 'Get reports for the logged-in user (User Portal)',
                    responses: { '200': { description: 'User reports' } }
                }
            },

            // ============ DISCOUNT ============
            '/api/discount': {
                get: {
                    tags: ['Discount'],
                    summary: 'Get Discount Settings',
                    responses: { '200': { description: 'Current discount settings' } }
                },
                put: {
                    tags: ['Discount'],
                    summary: 'Update Discount Settings',
                    description: 'Update global discount rate (Super Admin only)',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        default_discount: { type: 'number', example: 30 },
                                        apply_to_expired: { type: 'boolean', default: false }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '200': { description: 'Settings updated' } }
                }
            },

            // ============ ADMINS ============
            '/api/admins': {
                get: {
                    tags: ['Admins'],
                    summary: 'Get All Admins',
                    description: 'List all admin users (Super Admin only)',
                    responses: { '200': { description: 'List of admins' } }
                },
                post: {
                    tags: ['Admins'],
                    summary: 'Create Admin',
                    description: 'Create Branch Admin (Super Admin only)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        email: { type: 'string' },
                                        lab_id: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '201': { description: 'Admin created' } }
                }
            }
        }
    },
    apis: []
};

export const swaggerSpec = swaggerJsdoc(options);

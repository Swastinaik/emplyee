# Employee Management System - Backend API Documentation

Welcome to the backend service of the **Employee Management System (EMS)**. This project is a robust, production-ready RESTful API built with Node.js, Express, TypeScript, and MongoDB. It implements secure JWT authentication via HTTP-only cookies, granular Role-Based Access Control (RBAC), automatic database seeding, CSV bulk imports, and a hierarchical organization tree structure with circular reporting detection.

---

## Technical Stack
* **Runtime**: Node.js
* **Framework**: Express.js with TypeScript (`ts-node`/`ts-node-dev`)
* **Database**: MongoDB (Object modeling via Mongoose)
* **Authentication**: JSON Web Tokens (JWT) secured via HTTP-only Cookies
* **Validation**: Schema-level validation using Zod
* **File Uploads**: Multipart uploads using Multer
* **Testing**: Jest with `supertest` for integration tests

---

## Directory Structure
```text
server/
├── src/
│   ├── config/          # Environment variables & database connection configuration
│   ├── controllers/     # Express route handlers
│   ├── middleware/      # Custom middlewares (auth, RBAC, validator, error handlers)
│   ├── models/          # Mongoose database models (Employee, etc.)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic & complex service helper files
│   ├── types/           # Custom TypeScript declarations and interfaces
│   ├── utils/           # Utility helpers and seed scripts
│   └── validators/      # Zod validation schemas
├── tests/               # Integration & unit tests
├── uploads/             # Directory where employee profile pictures are stored
├── .env.example         # Example template for environment configuration
├── tsconfig.json        # TypeScript configuration settings
└── package.json         # Scripts and project dependency specifications
```

---

## Installation & Setup

### 1. Prerequisites
* **Node.js**: `v18+` recommended
* **MongoDB**: A running instance locally (e.g., `mongodb://localhost:27017`) or a MongoDB Atlas URI.

### 2. Configure Environment Variables
Create a `.env` file in the root of the `server/` directory and populate it:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/employee-management
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=1d
JWT_COOKIE_NAME=ems_auth_token
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Seeding
To seed the database with a default **Super Admin** account:
```bash
npm run seed
```
* **Default Credentials**:
  * **Email**: `admin@ems.com`
  * **Password**: `adminpassword123`

### 5. Running the Application
* **Development Server** (with live reload):
  ```bash
  npm run dev
  ```
* **Production Build & Run**:
  ```bash
  npm run build
  npm start
  ```
* **Run Tests**:
  ```bash
  npm test
  ```

---

## Authentication & Authorization Model

### Roles & Access Levels
* **Super Admin**: Full permissions, including soft deleting employees and managing any reporting structure.
* **HR Manager**: Access to manage employee records, create employees, update managers, and import CSV files. Cannot manage/edit a Super Admin.
* **Employee**: Standard read-only access to their own profile and direct reports, with permissions to update self-fields: `phone`, `profileImage`, and `password`.

### Security Mechanism
JWT tokens are generated upon successful login and stored in the client browser using secure, **HTTP-only, SameSite** cookies. The token is also sent in the JSON body payload for alternative frontend storage if needed.

---

## API Endpoints Reference

### 1. Authentication Endpoints

#### `POST /api/auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "admin@ems.com",
    "password": "adminpassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOi...",
    "data": {
      "user": {
        "_id": "60d0fe...",
        "employeeId": "EMP000",
        "name": "Super Admin",
        "email": "admin@ems.com",
        "role": "Super Admin",
        "status": "Active"
        // ...other non-sensitive fields
      }
    }
  }
  ```

#### `POST /api/auth/logout`
* **Access**: Protected (Authenticated)
* **Request Body**: None (Clears HTTP-only cookie)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### `GET /api/auth/me`
* **Access**: Protected (Authenticated)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "60d0fe...",
        "employeeId": "EMP000",
        "name": "Super Admin",
        "email": "admin@ems.com",
        "role": "Super Admin",
        "status": "Active"
      }
    }
  }
  ```

---

### 2. Employee Management Endpoints

#### `GET /api/employees`
* **Access**: Protected (Super Admin & HR Manager only)
* **Query Parameters**:
  * `search` (string): Match name or email (regex, case-insensitive)
  * `department` (string): Exact match on department name
  * `role` (string): Filter by user role (`Super Admin`, `HR Manager`, `Employee`)
  * `status` (string): Filter by status (`Active`, `Inactive`)
  * `sortBy` (string): Fields to sort by (`name`, `joiningDate`). Default: `name`
  * `sortOrder` (string): `asc` or `desc`. Default: `asc`
  * `page` (number): Current page. Default: `1`
  * `limit` (number): Page size. Default: `10`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 1,
    "pagination": {
      "total": 1,
      "page": 1,
      "pages": 1,
      "limit": 10
    },
    "data": {
      "employees": [
        {
          "_id": "60d0fe...",
          "employeeId": "EMP001",
          "name": "Jane Doe",
          "email": "jane@ems.com",
          "department": "Engineering",
          "designation": "Software Architect",
          "role": "Employee",
          "status": "Active",
          "reportingManager": {
            "_id": "60d0fe...",
            "employeeId": "EMP000",
            "name": "Super Admin",
            "email": "admin@ems.com"
          }
        }
      ]
    }
  }
  ```

#### `POST /api/employees`
* **Access**: Protected (Super Admin & HR Manager only)
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `employeeId` (string, required)
  * `name` (string, required)
  * `email` (string, required)
  * `phone` (string, required)
  * `department` (string, required)
  * `designation` (string, required)
  * `salary` (number, required)
  * `joiningDate` (ISO Date string, required)
  * `status` (string, optional: `Active` | `Inactive`)
  * `role` (string, optional: `HR Manager` | `Employee`)
  * `reportingManager` (string ID, optional/null)
  * `profileImage` (file: PNG/JPG/JPEG, optional)
* **Success Response (210 Created)**:
  ```json
  {
    "success": true,
    "message": "Employee created successfully",
    "data": {
      "employee": {
        "_id": "60d1ff...",
        "employeeId": "EMP001",
        "name": "Jane Doe",
        "email": "jane@ems.com",
        "profileImage": "uploads/1723456789-profile.png",
        "role": "Employee"
      }
    }
  }
  ```

#### `GET /api/employees/:id`
* **Access**: Protected (All authenticated roles)
* **Security**: Employees can only view their own profile. Super Admins and HR Managers can view any profile.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "employee": {
        "_id": "60d1ff...",
        "employeeId": "EMP001",
        "name": "Jane Doe",
        "email": "jane@ems.com"
        // ...full profile data
      }
    }
  }
  ```

#### `PUT /api/employees/:id`
* **Access**: Protected (All authenticated roles with restrictions)
* **Security & Constraints**:
  * **Standard Employees**: Can only modify their own `phone`, `profileImage`, and `password`. Other fields are silently stripped/ignored.
  * **HR Managers**: Can modify any employee details except for **Super Admin** records.
  * **Super Admins**: Full permission to modify any employee record.
* **Content-Type**: `multipart/form-data`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Employee updated successfully",
    "data": {
      "employee": {
        "_id": "60d1ff...",
        "name": "Jane Doe",
        "phone": "9876543210"
        // ...updated details
      }
    }
  }
  ```

#### `DELETE /api/employees/:id`
* **Access**: Protected (Super Admin only)
* **Behavior**: Performs a **soft delete** by setting the employee's `isDeleted` flag to `true` to preserve organizational reporting integrity.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Employee deleted successfully (soft delete)"
  }
  ```

#### `POST /api/employees/import`
* **Access**: Protected (Super Admin & HR Manager only)
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `file` (CSV file, required)
* **CSV Format Requirements**:
  The CSV must contain the headers: `employeeId`, `name`, `email`, `phone`, `department`, `designation`, `salary`, `joiningDate`, `role`, `status`. Passwords will be auto-generated and hashed.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "CSV import completed successfully",
    "summary": {
      "totalRecords": 10,
      "successCount": 8,
      "failedCount": 2,
      "errors": [
        "Row 3: Email already exists",
        "Row 5: Invalid Employee ID format"
      ]
    }
  }
  ```

---

### 3. Hierarchy & Organization Endpoints

#### `GET /api/organization/tree`
* **Access**: Protected (All authenticated roles)
* **Behavior**: Recursively builds and returns a complete nested JSON tree representation of the organization structure, starting from top-level employees (those with `reportingManager: null`).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "tree": [
        {
          "_id": "60d0fe...",
          "employeeId": "EMP000",
          "name": "Super Admin",
          "role": "Super Admin",
          "designation": "Super Administrator",
          "subordinates": [
            {
              "_id": "60d1ff...",
              "employeeId": "EMP001",
              "name": "Jane Doe",
              "role": "Employee",
              "designation": "Software Architect",
              "subordinates": []
            }
          ]
        }
      ]
    }
  }
  ```

#### `GET /api/employees/:id/reportees`
* **Access**: Protected (All authenticated roles)
* **Behavior**: Returns a flat array of direct subordinates reporting to the specified employee.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": {
      "reportees": [
        {
          "_id": "60d1ff...",
          "employeeId": "EMP001",
          "name": "Jane Doe",
          "email": "jane@ems.com",
          "department": "Engineering",
          "designation": "Software Architect"
        }
      ]
    }
  }
  ```

#### `PATCH /api/employees/:id/manager`
* **Access**: Protected (Super Admin & HR Manager only)
* **Security & Constraints**:
  * **Circular Reporting Protection**: Programmatically ensures that the prospective manager does not already report (directly or indirectly) to the target employee, which would create an infinite loop.
  * **Access Boundaries**: HR Managers cannot modify the reporting manager of a Super Admin.
* **Request Body**:
  ```json
  {
    "managerId": "60d0fe..." // MongoDB ObjectId string of new manager, or null to remove manager
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Reporting manager updated successfully",
    "data": {
      "employee": {
        "_id": "60d1ff...",
        "name": "Jane Doe",
        "reportingManager": {
          "_id": "60d0fe...",
          "employeeId": "EMP000",
          "name": "Super Admin",
          "email": "admin@ems.com"
        }
      }
    }
  }
  ```

---

## Standard Error Response Format
All errors (validation, authentication, database, etc.) are standardized and returned via custom error handling middleware:
```json
{
  "success": false,
  "message": "Error description message here",
  "stack": "..." // Only present in development environment
}
```
* **400 Bad Request**: Validation failure, circular reporting, or invalid formats.
* **401 Unauthorized**: Missing or expired auth token / cookie.
* **403 Forbidden**: Role-based access control constraint violation.
* **404 Not Found**: Target resource (employee, file, etc.) does not exist or has been deleted.
* **500 Internal Server Error**: Unexpected runtime server errors.

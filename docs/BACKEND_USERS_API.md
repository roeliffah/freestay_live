# Backend Users API Requirements

This document outlines the required API endpoints for the Users Management page in the admin panel.

## Current Implementation Status

✅ **Available Endpoints:**
- `GET /api/v1/admin/users` - List users with pagination
- `GET /api/v1/admin/users/{id}` - Get user details
- `PATCH /api/v1/admin/users/{id}/status` - Update user status
- `POST /api/v1/Auth/forgot-password` - Send password reset email

❌ **Missing Endpoints:**
- `POST /api/v1/admin/users` - Create new user
- `PUT /api/v1/admin/users/{id}` - Update user details
- `DELETE /api/v1/admin/users/{id}` - Delete user

## API Endpoints

### 1. List Users (✅ Available)
```http
GET /api/v1/admin/users?page={page}&pageSize={pageSize}&search={search}
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `pageSize` (integer, optional): Items per page (default: 20)
- `search` (string, optional): Search by name or email

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "string (UUID)",
      "name": "string",
      "email": "string",
      "phone": "string",
      "role": "admin" | "staff",
      "status": "active" | "inactive",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLogin": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

---

### 2. Get User Details (✅ Available)
```http
GET /api/v1/admin/users/{id}
```

**Path Parameters:**
- `id` (string, UUID): User ID

**Response (200 OK):**
```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string",
  "phone": "string",
  "role": "admin" | "staff",
  "status": "active" | "inactive",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-01T00:00:00Z",
  "passwordChangedAt": "2024-01-01T00:00:00Z",
  "loginAttempts": 0
}
```

---

### 3. Update User Status (✅ Available)
```http
PATCH /api/v1/admin/users/{id}/status
```

**Path Parameters:**
- `id` (string, UUID): User ID

**Request Body:**
```json
{
  "isActive": true,
  "reason": "Manual status change" // optional, required when setting to inactive
}
```

**Response (200 OK):**
```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string",
  "status": "active" | "inactive",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 4. Send Password Reset (✅ Available - Auth Endpoint)
```http
POST /api/v1/Auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset link sent to email"
}
```

---

### 5. Create User (❌ Not Implemented)
```http
POST /api/v1/admin/users
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 234 567 8900",
  "password": "SecurePassword123!",
  "role": "staff",
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "id": "string (UUID)",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 234 567 8900",
  "role": "staff",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": null
}
```

**C# Implementation Example:**
```csharp
[HttpPost]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
{
    // Validate email uniqueness
    if (await _userRepository.ExistsAsync(u => u.Email == request.Email))
    {
        return BadRequest("User with this email already exists");
    }

    // Hash password
    var hashedPassword = _passwordHasher.HashPassword(null, request.Password);

    var user = new User
    {
        Id = Guid.NewGuid(),
        Name = request.Name,
        Email = request.Email,
        Phone = request.Phone,
        PasswordHash = hashedPassword,
        Role = request.Role,
        Status = request.Status,
        CreatedAt = DateTime.UtcNow,
        LastLogin = null
    };

    await _userRepository.AddAsync(user);
    await _unitOfWork.SaveChangesAsync();

    return CreatedAtAction(nameof(GetUser), new { id = user.Id }, _mapper.Map<UserDto>(user));
}
```

---

### 6. Update User (❌ Not Implemented)
```http
PUT /api/v1/admin/users/{id}
```

**Path Parameters:**
- `id` (string, UUID): User ID

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 234 567 8900",
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "id": "string (UUID)",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 234 567 8900",
  "role": "admin",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**C# Implementation Example:**
```csharp
[HttpPut("{id}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
{
    var user = await _userRepository.GetByIdAsync(id);
    if (user == null)
    {
        return NotFound($"User with ID {id} not found");
    }

    // Check email uniqueness if changed
    if (request.Email != user.Email && 
        await _userRepository.ExistsAsync(u => u.Email == request.Email && u.Id != id))
    {
        return BadRequest("Another user with this email already exists");
    }

    user.Name = request.Name;
    user.Email = request.Email;
    user.Phone = request.Phone;
    user.Role = request.Role;
    user.UpdatedAt = DateTime.UtcNow;

    await _userRepository.UpdateAsync(user);
    await _unitOfWork.SaveChangesAsync();

    return Ok(_mapper.Map<UserDto>(user));
}
```

---

### 7. Delete User (❌ Not Implemented)
```http
DELETE /api/v1/admin/users/{id}
```

**Path Parameters:**
- `id` (string, UUID): User ID

**Response (204 No Content)**

**C# Implementation Example:**
```csharp
[HttpDelete("{id}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> DeleteUser(Guid id)
{
    var user = await _userRepository.GetByIdAsync(id);
    if (user == null)
    {
        return NotFound($"User with ID {id} not found");
    }

    // Prevent deleting yourself
    var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (currentUserId == id.ToString())
    {
        return BadRequest("You cannot delete your own account");
    }

    await _userRepository.DeleteAsync(user);
    await _unitOfWork.SaveChangesAsync();

    return NoContent();
}
```

---

## Frontend Implementation

### Current Features (Working)

1. **User List with Pagination**
   - Server-side pagination with page/pageSize controls
   - Search by name or email
   - Column sorting and filtering
   - Status indicators (active/inactive)
   - Role badges (admin/staff)

2. **Status Toggle**
   - Click on status tag to toggle active/inactive
   - Uses `PATCH /admin/users/{id}/status` endpoint
   - Provides instant visual feedback

3. **Password Reset**
   - Send password reset link via email
   - Uses `POST /Auth/forgot-password` endpoint
   - Shows success message after sending

4. **User Details Modal**
   - View-only mode showing user information
   - Displays created date and last login
   - Shows account metadata

### Future Features (When Backend Endpoints Available)

5. **Create New User**
   - Form with name, email, phone, password, role, status
   - Validation for required fields and email format
   - Password strength requirements (min 8 characters)
   - Currently disabled with tooltip: "User creation not yet available"

6. **Edit User**
   - Update name, email, phone, role
   - Cannot change password (use password reset instead)
   - Currently disabled: "User editing is not yet implemented in backend"

7. **Delete User**
   - Confirmation modal before deletion
   - Prevent self-deletion
   - Currently not implemented: "User deletion is not yet implemented in backend"

---

## Security Considerations

1. **Authorization:**
   - All endpoints require `[Authorize(Roles = "Admin")]`
   - Only admin users can manage other users

2. **Password Handling:**
   - Never return passwords in responses
   - Use BCrypt/PBKDF2 for password hashing
   - Enforce password complexity requirements
   - Password reset via email only (no temp passwords)

3. **Validation:**
   - Email format and uniqueness
   - Phone number format
   - Password strength (min 8 chars, mix of upper/lower/numbers/symbols)
   - Prevent self-deletion or self-demotion

4. **Audit Trail:**
   - Log all user management actions
   - Track who created/updated/deleted users
   - Store reason for status changes

---

## Testing the API

### Using Swagger UI
Visit: `https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/swagger/index.html`

### Example cURL Commands

**List Users:**
```bash
curl -X GET "https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1/admin/users?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update Status:**
```bash
curl -X PATCH "https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1/admin/users/{id}/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false, "reason": "Account suspended"}'
```

**Send Password Reset:**
```bash
curl -X POST "https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1/Auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

## Data Model

### User Entity (C# Example)
```csharp
public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string PasswordHash { get; set; }
    public UserRole Role { get; set; } // Enum: Admin, Staff
    public UserStatus Status { get; set; } // Enum: Active, Inactive
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLogin { get; set; }
    public DateTime? PasswordChangedAt { get; set; }
    public int LoginAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
}

public enum UserRole
{
    Admin = 1,
    Staff = 2
}

public enum UserStatus
{
    Active = 1,
    Inactive = 2
}
```

---

## Next Steps

1. **Implement Missing Endpoints:**
   - POST /admin/users (Create)
   - PUT /admin/users/{id} (Update)
   - DELETE /admin/users/{id} (Delete)

2. **Add Validation:**
   - Email uniqueness check
   - Password complexity validation
   - Phone number format validation

3. **Implement Audit Logging:**
   - Log all user management actions
   - Track changes with timestamps and actor

4. **Add Email Service:**
   - Send welcome email on user creation
   - Send password reset emails
   - Notify on status changes

5. **Testing:**
   - Unit tests for each endpoint
   - Integration tests for workflows
   - Test edge cases (duplicates, invalid data, etc.)

# Auth Testing Playbook — Multi Services Marketplace

## Endpoints
- POST `/api/auth/register` { email, password, name, role, phone }
- POST `/api/auth/login` { email, password } → sets httpOnly cookies
- GET  `/api/auth/me` → requires cookie
- POST `/api/auth/logout` → clears cookies
- POST `/api/auth/refresh` → uses refresh cookie
- POST `/api/auth/forgot-password` { email }
- POST `/api/auth/reset-password` { token, new_password }

## Seeded users
- Admin: `admin@marketplace.id` / `Admin@12345`
- Store owner: `owner@marketplace.id` / `Owner@12345`
- Customer: `customer@marketplace.id` / `Customer@12345`

## Verification
```
mongosh
use test_database
db.users.find({role: "admin"}, {password_hash: 1}).pretty()
```
Hash must start with `$2b$`.

```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marketplace.id","password":"Admin@12345"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```

## Frontend
- axios default `withCredentials: true`
- AuthContext calls `/api/auth/me` on mount
- ProtectedRoute redirects to `/login` on 401
- Role-based routes: `/dashboard/customer`, `/dashboard/store`, `/dashboard/admin`

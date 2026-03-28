# Organ Donation & Transplant Coordination System Backend

This backend is a robust securely-designed system intended for exclusive hospital-to-hospital usage to coordinate organ donations. 

## 🚀 Setup Instructions

1. **Clone/Download** this project scaffold.
2. Ensure you have **Node.js 18+** and **PostgreSQL** installed.
3. Access the `backend` folder containing the code:
   ```bash
   cd backend
   ```
4. Install all dependencies:
   ```bash
   npm install
   ```
5. Set up your Environment Variables by creating a `.env` file in the `backend` folder:
   ```env
   # .env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/otc_db?schema=public"
   JWT_SECRET="YOUR_SUPER_SECRET_JWT_KEY_HERE"
   JWT_EXPIRES_IN="1d"
   ```
6. Setup your Prisma Database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
7. Start the server:
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema & Architecture
We use PostgreSQL mapped with Prisma ORM.

**Core Entities**:
- `Hospital`: Managed by admin, authorized via JWT.
- `Admin`: Global super-user.
- `Organ`: Details regarding extracted organs, expiration times, status.
- `OrganRequest`: Workflow records linking a hospital offering an organ with a requesting hospital.
- `TransportRecord`, `Alert`, `Notification`, `DonorCertificate`, `AuditLog`.

See `prisma/schema.prisma` for exact entities.

## 📝 Status Enums / Constants

* **Hospital `accountStatus`:** `active`, `suspended`
* **Hospital `verificationStatus`:** `pending`, `active`, `suspended`
* **Organ `status`:** `available`, `reserved`, `allocated`, `expired`, `transported`, `completed`
* **OrganRequest `status`:** `sent`, `received`, `under_review`, `approved`, `rejected`, `transport_started`, `delivered`, `completed`, `cancelled`
* **OrganRequest `urgencyLevel`:** `low`, `medium`, `high`, `critical`
* **Alert `status`:** `active`, `resolved`, `expired`
* **TransportRecord `status`:** `pending`, `picked_up`, `in_transit`, `near_destination`, `delivered`

## 🛡️ Middleware List

1. **`protect`**: Verifies JWT from Header, authenticates the active User.
2. **`restrictTo(...roles)`**: Implements Role-Based Access Control (`admin`, `hospital`).
3. **`errorHandler`**: Catches centralized errors globally mapping to status codes.
4. **`validate`**: Plugs with `express-validator` to reject malformed payload requests dynamically.

## 🔌 API List

### Authentication Module
- `POST /api/auth/hospital/signup` (Signup hospital)
- `POST /api/auth/hospital/login` (Login hospital)
- `POST /api/auth/admin/login` (Login admin)
- `GET /api/auth/me` (Get active logged user)

### Organ Inventory Module
- `POST /api/organs` (Add organ)
- `GET /api/organs` (List all matchable organs)
- `GET /api/organs/:id` (Get specific organ data)
- `PATCH /api/organs/:id/status` (Update status)

### Organ Request Module
- `POST /api/requests` (Create an organ request)
- `GET /api/requests/incoming` (List requests aimed at my hospital)
- `GET /api/requests/outgoing` (List requests I've sent)
- `PATCH /api/requests/:id/status` (Approve/Reject requests) - **Critical Transaction Point**

### Other Planned Modules (Extensible Scaffold)
- **Hospitals**: `GET /api/hospitals/me`, `PATCH /api/hospitals/me`
- **Matching/Search**: `GET /api/matching/search?organType=Kidney&bloodGroup=O+`
- **Alerts**: `POST /api/alerts`, `GET /api/alerts/active`
- **Transport**: `POST /api/transport`, `PATCH /api/transport/:id/location`
- **Chat**: `GET /api/chat/:threadId/messages`, `POST /api/chat/:threadId/messages`
- **Analytics**: `GET /api/analytics/dashboard`
- **Admin**: `GET /api/admin/hospitals`, `PATCH /api/admin/hospitals/:id/status`

## 📡 Real-time Event Definitions (Socket.IO)
- `chat:join(roomId)` -> Join Hospital to Hospital Thread
- `chat:send(message)` -> Send plaintext msg
- `chat:receive(message)` -> Invoked on counterpart side
- `notification:new(payload)` -> Push alerts and updates immediately.

## 📄 Example Requests & Responses

### 1. `POST /api/requests` - Send Organ Request

**Request Body:**
```json
{
  "organId": "uuid-here",
  "urgencyLevel": "high",
  "patientBloodGroup": "A+",
  "patientHlaType": "A:02:01,B:07:02",
  "patientAge": 45,
  "compatibilitySummary": "Matched 5 antigens",
  "doctorNotes": "Patient critical, fast response mandatory"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "request": {
      "id": "uuid",
      "organId": "uuid-here",
      "urgencyLevel": "high",
      "status": "sent",
      "requestedAt": "2026-03-20T10:00:00.000Z"
    }
  }
}
```

### 2. `PATCH /api/requests/:id/status` - Request Approval

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "request": {
      "id": "uuid",
      "status": "approved",
      "approvedAt": "2026-03-20T10:30:00.000Z"
    }
  }
}
```
*Note: This specific call invokes a database transaction that dynamically prevents multi-allocation of identical organs and immediately voids alternative submittals.*

## 📜 Seed Script

To seed the initial admin database create a file `prisma/seed.ts` containing:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.admin.create({
    data: {
      email: 'superadmin@system.local',
      password: adminPassword,
    },
  });
  console.log('Seed created Admin: superadmin@system.local / Admin@123');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

Run via: `npx ts-node prisma/seed.ts`

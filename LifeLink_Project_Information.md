# LifeLink Organ Coordination - Complete Application Guide

### **1. Overview**
LifeLink is a mission-critical platform designed to coordinate organ donations between hospitals. It optimizes the process of finding organ matches, tracking time-sensitive transports, and completing the legal documentation securely.

### **2. Frontend**
- **Framework**: Built with **React 18** for a fast and dynamic user interface.
- **Desktop Environment**: Packaged as a **Windows Desktop App** using **Electron**.
- **Icons**: Professional healthcare iconography provided by **Lucide React**.
- **Experience**: The app features a clinical dark-mode aesthetic with real-time screen updates every **15 seconds**.

### **3. Backend**
- **Runtime**: Built using **Node.js** and **TypeScript** for long-term reliability and type safety.
- **API Framework**: Uses **Express 5** to handle all server requests and medical business logic.
- **Security**: Implements **JWT (JSON Web Tokens)** for session security and **Bcrypt** for strong password protection.
- **Access Control**: Role-based access ensures only verified Hospital and Admin accounts can enter.

### **4. Database**
- **Engine**: Powered by **PostgreSQL**, a robust relational database focused on data integrity.
- **ORM**: Uses **Prisma** for efficient data modeling and schema management.
- **Storage**: Maintains complete records of **Hospitals**, **Organ Inventory**, **Patient Requests**, and **Transports**.

### **5. Workflow**
1.  **Upload Organ**: Source hospitals list available organs with blood group and HLA types.
2.  **Search Match**: Hospitals search for compatible organs based on patient need and urgency.
3.  **Send Request**: A formal request is sent, calculating compatibility scores automatically.
4.  **Approve**: Source hospitals review and approve the request, initiating the logistics.
5.  **Track Delivery**: The system monitors the live movement of the organ via checkpoints.
6.  **Generate Certificate**: Once delivered, the app auto-generates a legal **PDF Donor Certificate**.

### **6. Real-time Features**
- **Multi-Hospital Chat**: Secure messaging between medical teams for direct coordination.
- **Smart Notifications**: Instant alerts for new requests, approvals, and critical expiry warnings.
- **Live Logistics**: A visual progress bar and checkpoint tracker for organs currently in transit.

### **7. Deployment**
- **Backend Infrastructure**: Hosted on the **Render** cloud platform for 24/7 global availability.
- **Distribution**: Packaged as a portable **Windows .exe** using **Electron Builder**.
- **Data Sync**: Uses a **15-second heartbeat poll** system to keep all hospital screens perfectly synchronized with the cloud.

---
*Created for LifeLink Project Reference - April 2, 2026*

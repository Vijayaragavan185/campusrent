# CampusRent: Full-Stack Campus Rental Platform with AWS Integration

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database](#database)
  - [DevOps & Deployment](#devops--deployment)
- [Key Features](#key-features)
  - [User Authentication & Roles](#user-authentication--roles)
  - [Listings & Bookings](#listings--bookings)
  - [Payments & Payouts](#payments--payouts)
  - [Messaging & Notifications](#messaging--notifications)
  - [Admin Dashboard](#admin-dashboard)
  - [Content Moderation](#content-moderation)
  - [AWS Integration](#aws-integration)
- [Project Structure](#project-structure)
- [AWS Integration Details](#aws-integration-details)
- [Development & Deployment](#development--deployment)
- [Documentation & Guides](#documentation--guides)
- [Extensibility](#extensibility)

---

## Project Overview
CampusRent is a comprehensive web platform designed to streamline property rentals within college campuses. It connects students, landlords, and administrators, providing a seamless experience for listing, booking, and managing rental properties. The project leverages modern web technologies and integrates with AWS for scalable, secure, and reliable infrastructure.

---

## Architecture

### Frontend
- **Framework:** React (Vite, TypeScript)
- **Features:**
  - Responsive UI for students, landlords, and admins
  - Property browsing, booking, chat, payments, admin dashboards
  - Modular component structure
  - State management via custom stores
  - API integration for all backend services

### Backend
- **Framework:** Node.js with Express.js
- **Features:**
  - RESTful API design
  - Modular codebase (controllers, services, middleware, routes)
  - Prisma ORM for database management
  - Real-time features via Socket.io
  - Secure authentication and authorization

### Database
- **Managed via:** Prisma ORM
- **Likely DBMS:** PostgreSQL or MySQL (configurable)
- **Schema Includes:**
  - Users (students, landlords, admins)
  - Listings
  - Bookings
  - Payments
  - Reviews
  - Messages
  - Admin roles

### DevOps & Deployment
- **Containerization:** Docker for frontend and backend
- **Orchestration:** Docker Compose for local development
- **Production:** AWS EC2, S3, Nginx for reverse proxy and SSL
- **Process Management:** PM2 for backend

---

## Key Features

### User Authentication & Roles
- Secure login/signup for students, landlords, and admins
- JWT-based authentication
- Role-based access control (admin, user, landlord)

### Listings & Bookings
- Landlords can create, edit, and manage property listings
- Students can browse, filter, and book properties
- Booking lifecycle management (initiation, extension, tracking, cancellation)

### Payments & Payouts
- Integration with payment gateways (e.g., Razorpay)
- Secure payment processing for bookings
- Automated payouts to landlords
- Payment tracking and history

### Messaging & Notifications
- Real-time chat between students and landlords
- Notification system for booking updates, payment status, and admin alerts

### Admin Dashboard
- Content moderation (listings, reviews, messages)
- User management (ban, promote, support)
- Analytics and reporting

### Content Moderation
- Admin tools for reviewing and moderating listings, reviews, and messages

### AWS Integration
- S3 for file and image storage (listing photos, documents)
- EC2 for scalable backend hosting
- IAM roles and security best practices
- (Optional) CloudWatch for logging and monitoring

---

## Project Structure

```
root/
├── backend/
│   ├── Dockerfile
│   ├── ecosystem.config.cjs
│   ├── package.json
│   ├── prisma.config.ts
│   ├── server.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── app.js
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── services/
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── app/
│       ├── imports/
│       ├── services/
│       ├── store/
│       └── styles/
├── deploy/
│   └── aws/
│       └── nginx-campusrent.conf
├── aws-integration-guide.md
├── docker-compose.yml
├── guide.md
├── razorpayguide.txt
├── README.md
└── start-dev.ps1
```

---

## AWS Integration Details

### S3
- Used for storing images and files uploaded by users (e.g., property photos)
- Integrated via backend service (`s3.service.js`)
- Secure upload and retrieval with signed URLs

### EC2
- Backend and frontend containers deployed on EC2 instances
- Nginx used as a reverse proxy
- Auto-scaling and load balancing (optional, for future scalability)

### IAM & Security
- IAM roles for secure access to AWS resources
- Environment variables for secrets and keys
- Principle of least privilege for all AWS resources

### (Optional/Planned) CloudWatch
- For centralized logging and monitoring
- Alerts for system health and anomalies

---

## Development & Deployment

### Local Development
- Use Docker Compose to spin up frontend, backend, and database locally
- Hot-reloading for rapid development
- Environment variables managed via `.env` files

### Production Deployment
- Build Docker images and deploy to AWS EC2
- Use Nginx for SSL and routing
- Store static assets in S3
- Automated deployment scripts (planned)

---

## Documentation & Guides
- **aws-integration-guide.md:** Step-by-step AWS setup and integration
- **guide.md:** General project setup and usage
- **razorpayguide.txt:** Payment gateway integration instructions
- **README.md:** Project overview and quickstart

---

## Extensibility
- Easily extendable for new features (e.g., reviews, advanced analytics, more payment gateways)
- Scalable architecture for handling increased user load
- Modular codebase for maintainability and onboarding

---

## Summary
CampusRent is a robust, scalable, and extensible platform for campus property rentals, leveraging modern web technologies and AWS cloud services. Its modular architecture, comprehensive feature set, and detailed documentation make it suitable for real-world deployment and future growth.

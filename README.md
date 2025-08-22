# Recruitment Management System

A full-stack recruitment management system built with modern web technologies. This application allows applicants to submit job applications and enables administrators to manage the recruitment process efficiently.

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT
- **File Uploads**: Multer
- **Security**: Helmet, CORS
- **Validation**: Express Validator

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Mantine UI
- **State Management**: React Query
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Tabler Icons

## ✨ Features

### Applicant Portal
- Submit job applications with personal details
- Upload resume, cover letter, and profile photo
- View application status

### Admin Dashboard
- Secure JWT authentication
- Manage applications (view, filter, sort)
- Update application status (PENDING, IN_REVIEW, INTERVIEW, etc.)
- Add internal notes to applications
- User session management
- Responsive design for all devices

### System Features
- File upload handling with proper validation
- Real-time status updates
- Clean and intuitive user interface
- Secure file downloads

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- SQLite (included in most systems)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/recruitment-system.git
   cd recruitment-system
   ```

2. **Set up the backend**
   ```bash
   cd server
   cp .env.example .env  # Update environment variables as needed
   npm install
   
   # Set up database
   npm run db:setup
   
   # Start development server
   npm run dev
   ```
   Server will be running at http://localhost:4000

3. **Set up the frontend**
   ```bash
   cd ../web
   npm install
   
   # Start development server
   npm run dev
   ```
   Web app will be available at http://localhost:5173

### Environment Variables

#### Server (`.env`)
```
PORT=4000
JWT_SECRET=your_jwt_secret
DATABASE_URL="file:./dev.db"
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (`.env`)
```
VITE_API_BASE=http://localhost:4000
```

## 📚 API Documentation

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - Invalidate session
- `GET /auth/me` - Get current user session

### Applications
- `GET /api/applications` - List all applications (admin)
- `POST /api/applications` - Submit new application (public)
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id/status` - Update application status
- `DELETE /api/applications/:id` - Delete application (admin)

### Files
- `POST /api/upload` - Upload files (supports multiple)
- `GET /api/files/:filename` - Download file

### Admin
- `GET /admin/users` - List all users (admin)
- `POST /admin/users` - Create new user (admin)
- `PUT /admin/users/:id` - Update user (admin)

## 🛠 Development

### Database Management

1. **Prisma Commands**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Apply migrations
   npx prisma db push
   
   # Open Prisma Studio (GUI for DB)
   npx prisma studio
   ```

2. **Database Schema**
   - Located at `server/prisma/schema.prisma`
   - After schema changes, run:
     ```bash
     npx prisma generate
     npx prisma db push
     ```

### Project Structure

```
.
├── server/                 # Backend server
│   ├── src/                # Source code
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── uploads/            # Uploaded files
│
└── web/                    # Frontend application
    ├── public/             # Static assets
    └── src/
        ├── components/     # Reusable UI components
        ├── pages/          # Page components
        ├── services/       # API services
        ├── store/          # State management
        └── styles/         # Global styles
```

## 📝 Notes

- **File Storage**: Uploaded files are stored in `server/uploads/`
- **Database**: SQLite database at `server/prisma/dev.db`
- **Environment Variables**: Always copy `.env.example` to `.env` and update values
- **Security**:
  - JWT for authentication
  - File upload validation
  - Input sanitization
  - CORS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

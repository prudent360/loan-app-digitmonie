# DigitMonie - Loan Management System

A modern full-stack loan management application built with Laravel 11 and React (Vite). Features a clean, minimalist UI design with customer and admin portals.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

### Customer Portal
- **Dashboard** - Overview of loan statistics, repayment progress, and recent activity
- **Loan Application** - Multi-step wizard with EMI calculator
- **Loan Management** - View all loans, track status, and make payments
- **KYC Upload** - Document verification with drag-and-drop upload
- **Profile Settings** - Manage personal information and password

### Admin Portal
- **Dashboard** - System-wide statistics and recent applications
- **User Management** - View, activate, and suspend users
- **Loan Review** - Approve or reject loan applications
- **KYC Review** - Verify customer identity documents
- **Settings** - Configure currency, loan limits, and notifications

## Tech Stack

### Backend
- **Laravel 11** - PHP framework
- **Laravel Sanctum** - API authentication
- **MySQL** - Database
- **Eloquent ORM** - Database abstraction

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS 4** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Charts and graphs
- **Lucide React** - Icons

## Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- npm
- MySQL

### Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Configure database in .env
# DB_DATABASE=digitmonie
# DB_USERNAME=root
# DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Start development server
php artisan serve
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api

## Project Structure

```
digitmonie-loan/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── Auth/          # Authentication
│   │   │   ├── Customer/      # Customer endpoints
│   │   │   └── Admin/         # Admin endpoints
│   │   └── Models/            # Eloquent models
│   ├── database/migrations/   # Database migrations
│   └── routes/api.php         # API routes
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/
│   │   │   └── layouts/       # Layout components
│   │   ├── context/           # React contexts
│   │   ├── pages/
│   │   │   ├── auth/          # Auth pages
│   │   │   ├── customer/      # Customer pages
│   │   │   └── admin/         # Admin pages
│   │   ├── services/          # API service
│   │   └── index.css          # TailwindCSS styles
│   └── vite.config.js         # Vite configuration
│
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | User registration |
| POST | `/api/login` | User login |
| POST | `/api/logout` | User logout |

### Customer (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/profile` | Get profile |
| PUT | `/api/profile` | Update profile |
| GET | `/api/loans` | List loans |
| POST | `/api/loans` | Apply for loan |
| GET | `/api/loans/{id}` | Loan details |
| POST | `/api/loans/{id}/pay` | Make payment |
| GET | `/api/kyc` | List KYC documents |
| POST | `/api/kyc` | Upload document |

### Admin (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Admin stats |
| GET | `/api/admin/users` | List users |
| PUT | `/api/admin/users/{id}/status` | Update user status |
| GET | `/api/admin/loans` | List all loans |
| PUT | `/api/admin/loans/{id}/status` | Approve/reject loan |
| GET | `/api/admin/kyc` | List KYC documents |
| PUT | `/api/admin/kyc/{id}/verify` | Verify document |
| GET | `/api/admin/settings` | Get settings |
| PUT | `/api/admin/settings` | Update settings |

## Design

The application features a clean, minimalist design with:
- Light background with white cards
- Green primary color (`#22c55e`) for accents
- Responsive layout with mobile support
- Clean tables with proper spacing
- Green summary cards for key metrics

## License

This project is licensed under the MIT License.

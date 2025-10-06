# 🏠 House Rental Finder

A modern web application for finding and managing rental properties with role-based access control.

## ✨ Features

### 🔐 Authentication & Roles
- **User Registration**: Create accounts with different roles
- **Three User Types**:
  - **User**: Browse listings, contact owners, rate properties
  - **Owner**: Upload house photos, manage listings, set prices
  - **Admin**: Verify listings, monitor users, manage platform
- **Secure Login**: JWT-based authentication

### 🏘️ Property Management
- **Advanced Search**: Filter by location, price, bedrooms, bathrooms
- **Nearby Listings**: GPS-based location filtering (5km radius)
- **Image Upload**: Owners can upload house photos
- **Detailed Information**: Price, description, amenities, contact details
- **Verification System**: Admin-verified properties

### 🗺️ Navigation & Contact
- **Instant Navigation**: Get directions to properties via Google Maps
- **Direct Contact**: Call owners directly from the app
- **Favorites System**: Save and manage favorite properties
- **Rating System**: Rate and review visited properties

### 📱 Modern UI/UX
- **Responsive Design**: Works on all devices
- **Beautiful Interface**: Modern gradient design with smooth animations
- **Intuitive Navigation**: Easy-to-use interface for all user types

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Oracle Database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd theater-booking-app
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Database Setup**
   ```bash
   # Run the schema file in your Oracle database
   # File: database/schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # In server directory, create .env file
   cd ../server
   
   # Add your configuration
   ORACLE_USER=your_username
   ORACLE_PASSWORD=your_password
   ORACLE_CONNECT_STRING=your_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

5. **Start the application**
   ```bash
   # Start the server (from server directory)
   npm start
   
   # Start the client (from client directory)
   npm start
   ```

## 🏗️ Architecture

### Frontend (React)
- **Components**: Modular React components with Bootstrap styling
- **State Management**: React Context for authentication
- **Routing**: React Router for navigation
- **API Integration**: Axios for backend communication

### Backend (Node.js + Express)
- **Database**: Oracle Database with oracledb driver
- **Authentication**: JWT tokens with bcrypt password hashing
- **API**: RESTful endpoints with role-based access control
- **Middleware**: CORS, JSON parsing, authentication verification

### Database Schema
- **USERS**: User accounts with roles and authentication
- **LISTINGS**: Property information with owner details
- **RATINGS**: User reviews and ratings for properties

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Listings
- `GET /api/listings` - Get all listings with filters
- `GET /api/listings/:id` - Get specific listing
- `POST /api/listings` - Create new listing (owners only)
- `PUT /api/listings/:id` - Update listing (owners only)
- `DELETE /api/listings/:id` - Delete listing (owners only)

### Ratings
- `POST /api/ratings` - Submit property rating
- `GET /api/ratings/:listingId` - Get ratings for a listing

## 🔧 Configuration

### Environment Variables
```env
# Database
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECT_STRING=localhost:1521/XE

# Security
JWT_SECRET=your_secret_key_here

# Server
PORT=5000
NODE_ENV=development
```

### Database Connection
The application uses Oracle Database with the following configuration:
- **Driver**: oracledb
- **Connection Pool**: Automatic connection management
- **Transactions**: Automatic commit/rollback handling

## 🎨 Customization

### Styling
- **Theme Colors**: Purple gradient theme (easily customizable in `styles.css`)
- **Components**: Bootstrap-based components with custom CSS
- **Responsive**: Mobile-first design approach

### Features
- **Role Permissions**: Easily modify role-based access in middleware
- **Filters**: Add new search filters in the listings controller
- **Validation**: Custom validation rules in controllers

## 🚀 Deployment

### Production Build
```bash
# Build the client
cd client
npm run build

# The build folder contains production-ready files
```

### Deployment Options
1. **Vercel/Netlify**: Deploy frontend
2. **Heroku/DigitalOcean**: Deploy backend
3. **Oracle Cloud**: Host database
4. **VM Deployment**: Full-stack deployment on a virtual machine

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue in the repository

---

**Built with ❤️ using React, Node.js, and Oracle Database**
   sanjayk12345@gmail.com  ---- admin
   sanjayk123456@gmail.com ---- user
  sanjayk1234567@gmail.com ---- owner
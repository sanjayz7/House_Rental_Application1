# House Owner Module

This module provides a dedicated interface for property owners to manage their rental listings. It includes separate login, registration, dashboard, and property management components.

## Components

### 1. HouseOwnerLogin.jsx
- Dedicated login page for property owners
- Role-based access control (only allows 'owner' role)
- Redirects to owner dashboard on successful login
- Professional design with property owner branding

### 2. HouseOwnerRegister.jsx
- Registration form specifically for property owners
- Includes additional fields like company/organization
- Automatically sets role to 'owner'
- Form validation and error handling

### 3. HouseOwnerDashboard.jsx
- Main dashboard for property owners
- Displays statistics (total properties, bookings, revenue)
- Lists owner's properties with management actions
- Shows recent bookings for owner's properties
- Quick actions for adding new properties

### 4. HouseOwnerAddListing.jsx
- Comprehensive form for adding new property listings
- Image upload functionality
- Property details (bedrooms, bathrooms, area, etc.)
- Location and availability settings
- Pricing and category selection
- Form validation and error handling

## Features

### Authentication
- Separate login/registration flow for owners
- Role-based access control
- Session management with JWT tokens

### Property Management
- Add new property listings
- View all owned properties
- Edit existing properties
- Delete properties with confirmation
- Image upload with multiple photos

### Dashboard Analytics
- Total properties count
- Active/verified properties
- Total bookings
- Revenue tracking
- Verification rate

### User Experience
- Responsive design
- Professional styling
- Loading states
- Error handling
- Success notifications
- Form validation

## Routes

- `/owner-login` - Owner login page
- `/owner-register` - Owner registration page
- `/owner-dashboard` - Owner dashboard (protected)
- `/owner-add-listing` - Add new property (protected)

## Styling

The module uses `HouseOwner.css` for dedicated styling that includes:
- Professional color scheme
- Card-based layouts
- Hover effects and animations
- Responsive design
- Form styling
- Button styles

## Integration

The module integrates with:
- Existing authentication context
- API endpoints for listings and bookings
- Image upload component
- Navigation bar (with owner-specific links)
- Main app routing

## Usage

1. Property owners can access the owner login page via `/owner-login`
2. New owners can register via `/owner-register`
3. After login, owners are redirected to `/owner-dashboard`
4. From the dashboard, owners can add new properties via `/owner-add-listing`
5. All owner-specific routes are protected and require owner role

## Security

- Role-based access control
- Protected routes
- Form validation
- Input sanitization
- Secure API communication

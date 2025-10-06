import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ShowList from './components/ShowList';
import ShowForm from './components/ShowForm';
import ShowDetails from './components/ShowDetails';
import { Container } from 'react-bootstrap';
import Favorites from './components/Favorites';
import Login from './components/Login';
import Register from './components/Register';
import OwnerListings from './components/OwnerListings';
import AdminDashboard from './components/AdminDashboard';
import HouseOwnerLogin from './components/HouseOwnerLogin';
import HouseOwnerRegister from './components/HouseOwnerRegister';
import HouseOwnerDashboard from './components/HouseOwnerDashboard';
import HouseOwnerAddListing from './components/HouseOwnerAddListing';
import UserLogin from './components/UserLogin';
import UserRegister from './components/UserRegister';
import UserDashboard from './components/UserDashboard';
import AdminLogin from './components/AdminLogin';
import AdminRegister from './components/AdminRegister';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/listings" element={<ShowList />} />
        <Route path="/show/new" element={<ShowForm />} />
        <Route path="/show/edit/:id" element={<ShowForm />} />
        <Route path="/show/:id" element={<ShowDetails />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/owner/listings" element={user?.role === 'owner' ? <OwnerListings /> : <Login />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Login />} />
        
        {/* House Owner Routes */}
        <Route path="/owner-login" element={<HouseOwnerLogin />} />
        <Route path="/owner-register" element={<HouseOwnerRegister />} />
        <Route path="/owner-dashboard" element={user?.role === 'owner' ? <HouseOwnerDashboard /> : <HouseOwnerLogin />} />
        <Route path="/owner-add-listing" element={user?.role === 'owner' ? <HouseOwnerAddListing /> : <HouseOwnerLogin />} />
        
        {/* User Routes */}
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/user-register" element={<UserRegister />} />
        <Route path="/user-dashboard" element={user?.role === 'user' ? <UserDashboard /> : <UserLogin />} />
        
        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/admin-dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <AdminLogin />} />
      </Routes>
      <footer className="text-center py-4 mt-5 bg-light">
        <p>&copy; {new Date().getFullYear()} House Rental Finder</p>
      </footer>
    </div>
  );
}

export default App;
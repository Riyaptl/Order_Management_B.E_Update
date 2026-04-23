import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import { Toaster } from "react-hot-toast";
import './index.css';
import Navbar from './components/NavbarComponents';
import RoutesListPage from './pages/RoutesListPage';
import ShopsListPage from './pages/ShopsListPage';
import OrdersListPage from './pages/OrdersListPage';
import CSVImportPage from './pages/CsvImportPage';
import SrPerformancePage from './pages/SrPerformamcePage';
import SalesReportPage from './pages/SalesReportPage';
import DistributorOrderPage from './pages/DistributorOrderPage';
import DistributorsPage from './pages/DistributorsPage';

export default function App() {
  const { user, role } = useSelector((state) => state.auth);

  const isDistributor = role === 'distributor';
  const isAdmin = role === 'admin';
  const isSR = role === 'sr';
  const isTL = role === 'tl';
  const isME = role === 'me';

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/" element={
          !user ? (
            <Navigate to="/login" />
          ) : (
            <HomePage />
          )
        } />

        <Route path="/dist_orders" element={
          !user ? (
            <Navigate to="/login" />
          ) : (
            <DistributorOrderPage />
          )
        } />

        <Route path="/SR-report" element={
          !user ? <Navigate to="/login" /> :
          isDistributor ? <Navigate to="/orders_list" /> :
          isME ? <Navigate to="/"/> :
          <SrPerformancePage />
        } />

        <Route path="/routes_list" element={
          !user ? <Navigate to="/login" /> :
          (isAdmin || isTL) ? <RoutesListPage /> :
          isDistributor ? <Navigate to="/orders_list" /> :
          <Navigate to="/" />
        } />

        <Route path="/shops_list" element={
          !user ? <Navigate to="/login" /> :
          isDistributor ? <Navigate to="/orders_list" /> :
          <ShopsListPage />
        } />


        <Route path="/csv-import" element={
          isAdmin ? <CSVImportPage /> :
          isDistributor ? <Navigate to="/orders_list" /> :
          <Navigate to="/" />
        } />

        <Route path="/orders_list" element={
          !user ? <Navigate to="/login" /> : 
          isME ? <Navigate to="/"/> :
          <OrdersListPage /> 
        } />
        
        <Route path="/sales_report" element={
          !user ? <Navigate to="/login" /> :  
          isME ? <Navigate to="/"/> :
          <SalesReportPage />
        } />
        
    
        <Route path="/distributors" element={
          !user ? <Navigate to="/login" /> :  
          !isAdmin ? <Navigate to="/"/> :
          <DistributorsPage />
        } />
        
        <Route path="*" element={<Navigate to={user ? "/orders_list" : "/login"} />} />
      </Routes>
    </Router>
  );
}

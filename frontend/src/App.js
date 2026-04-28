// src/App.js

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ManagementDashboard from "./pages/ManagementDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import LegalDashboard from "./pages/LegalDashboard";
import LeasingDashboard from "./pages/LeasingDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import CustomerServiceDashboard from "./pages/CustomerServiceDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Pages */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboards */}
        <Route
          path="/management-dashboard"
          element={<ManagementDashboard />}
        />

        <Route
          path="/operations-dashboard"
          element={<OperationsDashboard />}
        />

        <Route
          path="/legal-dashboard"
          element={<LegalDashboard />}
        />

        <Route
          path="/leasing-dashboard"
          element={<LeasingDashboard />}
        />

        <Route
          path="/finance-dashboard"
          element={<FinanceDashboard />}
        />

        <Route
          path="/customerService-dashboard"
          element={<CustomerServiceDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
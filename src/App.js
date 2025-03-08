import "./App.css";
import { Web3Provider } from './contexts/Web3Context.js';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer';
import Landing from './components/Landing';
import FarmerDashboard from './components/farmers/Dashboard';
import Marketplace from './components/buyer/Marketplace';
import FarmerRegistration from './components/farmers/Registration';
import BuyerRegistration from './components/buyer/Registration.js';
import AboutUs from './components/AboutUs';
import ErrorBoundary from './components/ErrorBoundary.js';
import ConnectionChecker from './ConnectionChecker';
import BuyerDashboard from './components/buyer/Dashboard';
import { useWeb3 } from './contexts/Web3Context.js';

// Role-based route protection
const ProtectedRoute = ({ role, children }) => {
  const { userRole } = useWeb3();
  if (userRole !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Main app content for displaying wallet status
function AppContent() {
  return (
    <div className="App">
      <header className="App-header">
        <ConnectionChecker />
      </header>
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Header />
        <main className="min-h-screen">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/marketplace" element={
              <ErrorBoundary>
                <Marketplace />
              </ErrorBoundary>
            } />
            
            {/* Farmer routes */}
            <Route path="/register-farmer" element={<FarmerRegistration />} />
            <Route path="/farmer" element={
              <ErrorBoundary>
                <ProtectedRoute role="farmer">
                  <FarmerDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            
            {/* Buyer routes */}
            <Route path="/register-buyer" element={<BuyerRegistration />} />
            <Route path="/buyer" element={
              <ErrorBoundary>
                <ProtectedRoute role="buyer">
                  <BuyerDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
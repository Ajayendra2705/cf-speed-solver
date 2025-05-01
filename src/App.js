import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import SolvePage from './components/SolvePage/SolvePage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import RatingResultPage from './components/RatingResultPage/RatingResultPage';
import { HandleProvider } from './context/HandleContext';
import './App.css';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={isActive ? "active" : ""}>
      {children}
    </Link>
  );
}

function App() {
  return (
    <HandleProvider>
      <Router>
        <div>
          <nav className="navbar">
            <div className="navbar-brand">Codeforces Analyzer</div>
            <div className="navbar-links">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/solve">Solve</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <NavLink to="/result">Analyzer</NavLink>
            </div>
          </nav>

          <div className="page-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/solve" element={<SolvePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/result" element={<RatingResultPage />} />
            </Routes>
          </div>

          <footer className="footer">
            &copy; 2025 Codeforces Solver. All rights reserved.
          </footer>
        </div>
      </Router>
    </HandleProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import SolvePage from './components/SolvePage/SolvePage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import { HandleProvider } from './context/HandleContext'; // Import HandleProvider
import './App.css';

function App() {
  return (
    <HandleProvider>
      <Router>
        <div>
          <nav className="navbar">
            <div className="navbar-brand">Codeforces Solver</div>
            <div className="navbar-links">
              <Link to="/">Home</Link>
              <Link to="/solve">Solve</Link>
              <Link to="/profile">Profile</Link>
            </div>
          </nav>

          <div className="page-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/solve" element={<SolvePage />} />
              <Route path="/profile" element={<ProfilePage />} />
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
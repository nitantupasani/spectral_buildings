import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import BuildingList from './components/BuildingList';
import BuildingDetail from './components/BuildingDetail';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <BuildingList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/building/:id"
                element={
                  <PrivateRoute>
                    <BuildingDetail />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

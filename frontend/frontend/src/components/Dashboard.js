import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';


const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // o auth.signOut() si usás Firebase
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <h1>Bienvenido a tu Panel</h1>
        <p>Has iniciado sesión correctamente.</p>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
};

export default Dashboard;

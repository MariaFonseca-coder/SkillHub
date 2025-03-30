// src/components/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí puedes llamar a auth.signOut() o limpiar tokens según implementes la lógica de autenticación.
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <h1>Panel de Administración</h1>
        <p>Esta es la vista exclusiva para administradores.</p>
        <p>Aquí puedes gestionar usuarios, publicaciones y otros recursos administrativos.</p>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
};

export default Dashboard;

// src/components/Feed.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/feed.css'; // Crea este archivo de estilos o reutiliza alguno similar

const Feed = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Implementa la lógica de logout, por ejemplo auth.signOut() o limpiar localStorage
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="feed-container">
      <div className="feed-box">
        <h1>Bienvenido a tu Feed</h1>
        <p>Aquí verás las últimas publicaciones y actualizaciones de tus amigos y grupos.</p>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
};

export default Feed;

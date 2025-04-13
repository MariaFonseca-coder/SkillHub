import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

import Login from './views/Login';
import Signup from './views/Signup';
import Politicas from './views/Politicas';
import Dashboard from './views/Dashboard';
import Feed from './views/Feed';  
import RecuperarContrasenna from './views/RecuperarContrasenna';
import GestionContactos from './views/GestionContactos';
import Chat from './views/Chat'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/politicas" element={<Politicas />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/RecuperarContrasenna" element={<RecuperarContrasenna />} />
        <Route path="/GestionContactos" element={<GestionContactos />} />
        <Route path="/Chat/:friendId" element={<Chat />} />

      </Routes>
    </Router>
  );
}

export default App;

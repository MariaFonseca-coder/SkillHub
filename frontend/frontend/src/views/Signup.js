// src/components/Signup.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('user'); // "user" por defecto, o "admin"
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      return alert("Las contraseñas no coinciden");
    }
    try {
      // 1. Registrar al usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // 2. Obtener el token de Firebase
      const token = await userCredential.user.getIdToken();

      // 2.1. Guarda el token en localStorage para usarlo más tarde
       localStorage.setItem('firebaseToken', token);

       
      // 3. Llamar al endpoint de Django para crear/actualizar el perfil en Firestore
      await axios.post('http://localhost:8000/api/firebase-signup/', { 
        token,
        role
      });
      // 4. Redirigir según el rol: admin a "/dashboard", usuario normal a "/feed"
      if (role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/feed');
      }
    } catch (error) {
      console.error("Error al registrar:", error);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-wrapper">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirm} 
            onChange={e => setConfirm(e.target.value)} 
            required 
          />
          {/* Campo para seleccionar el rol */}
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">Usuario Normal</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" className="login-btn">SIGN UP</button>
        </form>
        <p>Already have an account? <a href="/">Login</a></p>
        <p><a href="/politicas">Ver Políticas</a></p>
      </div>
    </div>
  );
};

export default Signup;

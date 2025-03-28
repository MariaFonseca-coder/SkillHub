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
  // Si deseas recopilar más datos (nombre, biografía, etc.), agrégalos aquí
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
      // 3. Llamar al endpoint de Django para crear/actualizar el perfil en Firestore
      await axios.post('http://localhost:8000/api/firebase-signup/', { token });
      // 4. Redirigir al dashboard u otra página de la aplicación
      navigate('/dashboard');
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
          <button type="submit" className="login-btn">SIGN UP</button>
        </form>
        <p>Or Sign Up Using</p>
        <button className="google-btn">Sign in with Google</button>
        <p>Already have an account? <a href="/">Login</a></p>
        <p><a href="/politicas">Ver Políticas</a></p>
      </div>
    </div>
  );
};

export default Signup;

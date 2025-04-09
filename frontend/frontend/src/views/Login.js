// src/components/Login.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Función para redirigir según el rol obtenido del backend
  const redirectByRole = (role) => {
    if (role === 'admin') {
      navigate('/dashboard');
    } else if (role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/feed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Inicia sesión en Firebase con email y contraseña
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // 2. Obtén el token de Firebase
      const token = await userCredential.user.getIdToken();
      // 3. Envía el token al backend y recibe la respuesta (incluyendo el rol)
      const { data } = await axios.post('http://localhost:8000/api/firebase-login/', { token });

      // 3.1. Guarda el token en localStorage para usarlo más tarde
      localStorage.setItem('firebaseToken', token);

      // 4. Redirige según el rol devuelto por el backend
      if (data.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/feed');
      }

      // 4. Redirige según el rol devuelto
      redirectByRole(data.role);
      
    } catch (error) {
      console.error("Error al autenticar:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Inicia sesión con popup de Google
      const userCredential = await signInWithPopup(auth, provider);
      // Obtén el token de Firebase
      const token = await userCredential.user.getIdToken();
      // Envía el token al backend
      const { data } = await axios.post('http://localhost:8000/api/firebase-login/', { token });
      // Redirige según el rol obtenido
      redirectByRole(data.role);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-wrapper">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Username or Email"
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
          <div className="forgot-link">
            <a href="/password-reset">Forgot password?</a>
          </div>
          <button type="submit" className="login-btn">LOGIN</button>
        </form>
        <p>Or Sign In Using</p>
        <button className="google-btn" onClick={handleGoogleLogin}>Sign in with Google</button>
        <p>
          Sign Up Using Your Email <a href="/signup">Sign Up</a>
        </p>
        <p><a href="/politicas">Ver Políticas</a></p>
      </div>
    </div>
  );
};

export default Login;

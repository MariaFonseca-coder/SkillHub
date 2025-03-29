// src/components/Login.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Inicia sesión en Firebase con email y contraseña
      const userCredential = await auth.signInWithEmailAndPassword(email, password);

      // 2. Obtén el token de Firebase
      const token = await userCredential.user.getIdToken();

      // 3. Envía el token al backend y recibe la respuesta (incluyendo el rol)
      const { data } = await axios.post('http://localhost:8000/api/firebase-login/', { token });

      // 4. Redirige según el rol devuelto por el backend
      if (data.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/feed');
      }
    } catch (error) {
      console.error("Error al autenticar:", error);
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
        <p>Or Sign Up Using</p>
        <button className="google-btn">Sign in with Google</button>
        <p>
          Sign Up Using Your Email <a href="/signup">Sign Up</a>
        </p>
        <p><a href="/politicas">Ver Políticas</a></p>
      </div>
    </div>
  );
};

export default Login;

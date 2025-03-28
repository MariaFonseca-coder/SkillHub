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
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const token = await userCredential.user.getIdToken();
      await axios.post('http://localhost:8000/api/firebase-login/', { token });
      navigate('/dashboard');
    } catch (error) {
      console.error("Error al autenticar:", error);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-wrapper">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Username or Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <div className="forgot-link"><a href="#">Forgot password?</a></div>
          <button type="submit" className="login-btn">LOGIN</button>
        </form>
        <p>Or Sign Up Using</p>
        <button className="google-btn">Sign in with Google</button>
        <p>Sign Up Using Your Email <a href="/signup">Sign Up</a></p>
        <p><a href="/politicas">Ver Políticas</a></p>
      </div>
    </div>
  );
};

export default Login;

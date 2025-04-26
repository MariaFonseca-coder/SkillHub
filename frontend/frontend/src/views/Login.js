import React, { useState } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import '../styles/login.css';

import { FaGoogle } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/dashboard');
    else if (role === 'teacher') navigate('/teacher');
    else navigate('/feed');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const { data } = await axios.post('http://localhost:8000/api/firebase-login/', { token });
      localStorage.setItem('firebaseToken', token);
      redirectByRole(data.role);
    } catch (error) {
      console.error("Error al autenticar:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      const { data } = await axios.post('http://localhost:8000/api/firebase-login/', {
        token,
        provider: "google",
        userType
      });
      redirectByRole(data.role);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  return (
    <div className="login__auth-container">
      <div className="login__form-wrapper">
        <h2 className="login__title">Login</h2>

        {/* INPUTS */}
        <form onSubmit={handleLogin} className="login__form">
          <div className="login__input-group">
            <input
              type="email"
              placeholder="Username or Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login__input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="login__forgot-link">
            <a href="/recuperarContrasenna">Forgot password?</a>
          </div>

          <button type="submit" className="login__btn login__btn--primary">
            LOGIN
          </button>
        </form>

        <div className="login__bottom-text">
          <span>Or Sign In Using</span>
        </div>

        <br></br>

        <button
          className="login__btn login__btn--google"
          onClick={handleGoogleLogin}
        >
          <FaGoogle className="login__icon" />
          Sign in with Google

          
        </button>

        <div className="login__user-type">
          <label htmlFor="userType">Registrarse como:</label>
          <select
            id="userType"
            value={userType}
            onChange={e => setUserType(e.target.value)}
          >
            <option value="student">Estudiante</option>
            <option value="teacher">Docente</option>
          </select>
        </div>

        <p className="login__bottom-text">
          Sign Up Using Your Email <a href="/signup">Sign Up</a>
        </p>
        <p className="login__bottom-text">
          <a href="/politicas">Ver Políticas</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

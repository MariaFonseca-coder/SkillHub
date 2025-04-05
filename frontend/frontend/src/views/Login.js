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
  // Opcional: para que el usuario elija si es docente o estudiante
  const [userType, setUserType] = useState('student'); 
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
      // Inicia sesión en Firebase con email y contraseña
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      // Enviamos el token (y opcionalmente el userType) al backend
      const { data } = await axios.post('http://localhost:8000/api/firebase-login/', { token, userType });
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
      const token = await userCredential.user.getIdToken();
      // Aquí, opcionalmente, se puede preguntar al usuario su rol (docente/estudiante)
      // Por ejemplo, podrías usar un prompt o un select en la interfaz. En este ejemplo se usa el estado userType.
      const { data } = await axios.post('http://localhost:8000/api/firebase-login/', { 
        token,
        provider: "google",
        userType  // si no se envía, en el backend se usará "student" por defecto
      });
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
        {/* Opcional: si deseas que el usuario elija su rol */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <label htmlFor="userType">Registrarse como: </label>
          <select id="userType" value={userType} onChange={e => setUserType(e.target.value)}>
            <option value="student">Estudiante</option>
            <option value="teacher">Docente</option>
          </select>
        </div>
        <p>
          Sign Up Using Your Email <a href="/signup">Sign Up</a>
        </p>
        <p><a href="/politicas">Ver Políticas</a></p>
      </div>
    </div>
  );
};

export default Login;

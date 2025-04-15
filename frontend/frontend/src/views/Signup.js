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

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [userType, setUserType] = useState('student'); // 'student' o 'teacher'

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

        role: userType, // Se envía "teacher" o "student"
        username,
        full_name: fullName,
        location
      });
      // 4. Redirigir según el tipo de usuario: docente a "/teacher", estudiante a "/feed"
      if (userType === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/feed');
      }
    } catch (error) {
      console.error("Error al registrar:", error);
    }
  };

  // Función para obtener la ubicación usando geolocalización y reverse geocoding (por ejemplo, Nominatim)
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setLocation(data.display_name);
          } else {
            alert("No se pudo obtener la dirección");
          }
        } catch (err) {
          console.error("Error al obtener la ubicación", err);
          alert("Error al obtener la ubicación");
        }
      }, (error) => {
        console.error("Error al obtener la geolocalización:", error);
        alert("Error al obtener la geolocalización");
      });
    } else {
      alert("Geolocalización no soportada en este navegador");
    }
  };

  return (
    <div className="auth-container">
      <div className="form-wrapper">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
            required 
          />
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
          <div className="location-field">
            <input 
              type="text" 
              placeholder="Ubicación" 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              required 
            />
            <button type="button" onClick={getLocation}>Obtener Ubicación</button>
          </div>
          {/* Seleccionar si es docente o estudiante */}
          <select value={userType} onChange={e => setUserType(e.target.value)}>
            <option value="student">Estudiante</option>
            <option value="teacher">Docente</option>
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

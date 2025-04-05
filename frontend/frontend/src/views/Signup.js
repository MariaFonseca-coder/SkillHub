// src/components/Signup.js
import React, { useState } from 'react';
import validator from 'validator';
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

  // Estado para errores individuales por campo y un error global
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirm: '',
    username: '',
    fullName: '',
    location: '',
    global: ''
  });

  const navigate = useNavigate();

  // Validación en tiempo real para cada campo
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (!validator.isEmail(value)) {
      setErrors(prev => ({ ...prev, email: "Correo inválido" }));
    } else {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (!validator.isLength(value, { min: 6 })) {
      setErrors(prev => ({ ...prev, password: "La contraseña debe tener al menos 6 caracteres" }));
    } else {
      setErrors(prev => ({ ...prev, password: "" }));
    }
    // Si ya hay un valor en confirm, validamos que coincidan
    if (confirm && value !== confirm) {
      setErrors(prev => ({ ...prev, confirm: "Las contraseñas no coinciden" }));
    } else if (confirm) {
      setErrors(prev => ({ ...prev, confirm: "" }));
    }
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirm(value);
    if (password !== value) {
      setErrors(prev => ({ ...prev, confirm: "Las contraseñas no coinciden" }));
    } else {
      setErrors(prev => ({ ...prev, confirm: "" }));
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    if (validator.isEmpty(value.trim())) {
      setErrors(prev => ({ ...prev, username: "El nombre de usuario no puede estar vacío" }));
    } else {
      setErrors(prev => ({ ...prev, username: "" }));
    }
  };

  const handleFullNameChange = (e) => {
    const value = e.target.value;
    setFullName(value);
    if (validator.isEmpty(value.trim())) {
      setErrors(prev => ({ ...prev, fullName: "El nombre completo no puede estar vacío" }));
    } else {
      setErrors(prev => ({ ...prev, fullName: "" }));
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);
    if (validator.isEmpty(value.trim())) {
      setErrors(prev => ({ ...prev, location: "La ubicación no puede estar vacía" }));
    } else {
      setErrors(prev => ({ ...prev, location: "" }));
    }
  };

  // Validación global al enviar el formulario
  const validateForm = () => {
    let valid = true;
    const newErrors = {};

    if (!validator.isEmail(email)) {
      newErrors.email = "Por favor, introduce un correo electrónico válido.";
      valid = false;
    }
    if (!validator.equals(password, confirm)) {
      newErrors.confirm = "Las contraseñas no coinciden.";
      valid = false;
    }
    if (!validator.isLength(password, { min: 6 })) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
      valid = false;
    }
    if (validator.isEmpty(username.trim())) {
      newErrors.username = "El nombre de usuario no puede estar vacío.";
      valid = false;
    }
    if (validator.isEmpty(fullName.trim())) {
      newErrors.fullName = "El nombre completo no puede estar vacío.";
      valid = false;
    }
    if (validator.isEmpty(location.trim())) {
      newErrors.location = "La ubicación no puede estar vacía.";
      valid = false;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return valid;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      await axios.post('http://localhost:8000/api/firebase-signup/', { 
        token,
        role: userType,
        username,
        full_name: fullName,
        location
      });
      if (userType === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/feed');
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      setErrors(prev => ({ ...prev, global: "Se produjo un error durante el registro. Por favor, inténtalo de nuevo." }));
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setLocation(data.display_name);
            setErrors(prev => ({ ...prev, location: "" }));
          } else {
            setErrors(prev => ({ ...prev, location: "No se pudo obtener la dirección." }));
          }
        } catch (err) {
          console.error("Error al obtener la ubicación", err);
          setErrors(prev => ({ ...prev, location: "Error al obtener la ubicación." }));
        }
      }, (error) => {
        console.error("Error al obtener la geolocalización:", error);
        setErrors(prev => ({ ...prev, location: "Error al obtener la geolocalización." }));
      });
    } else {
      setErrors(prev => ({ ...prev, location: "Geolocalización no soportada en este navegador." }));
    }
  };

  return (
    <div className="auth-container">
      <div className="form-wrapper">
        <h2>Sign Up</h2>
        {errors.global && <div className="error-message">{errors.global}</div>}
        <form onSubmit={handleSignup}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={handleUsernameChange}
            required 
          />
          {errors.username && <div className="error-message">{errors.username}</div>}
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            value={fullName} 
            onChange={handleFullNameChange}
            required 
          />
          {errors.fullName && <div className="error-message">{errors.fullName}</div>}
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={handleEmailChange}
            required 
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={handlePasswordChange}
            required 
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirm} 
            onChange={handleConfirmChange}
            required 
          />
          {errors.confirm && <div className="error-message">{errors.confirm}</div>}
          <div className="location-field">
            <input 
              type="text" 
              placeholder="Ubicación" 
              value={location} 
              onChange={handleLocationChange}
              required 
            />
            <button type="button" onClick={getLocation}>Obtener Ubicación</button>
          </div>
          {errors.location && <div className="error-message">{errors.location}</div>}
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

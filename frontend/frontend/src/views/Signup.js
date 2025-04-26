// src/components/Signup.js
import React, { useState } from "react";
import validator from "validator";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";

import "../styles/signup.css";

const Signup = () => {
  const [email, setEmail] = useState(() => localStorage.getItem("signup_email") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("signup_password") || "");
  const [confirm, setConfirm] = useState(() => localStorage.getItem("signup_confirm") || "");
  const [username, setUsername] = useState(() => localStorage.getItem("signup_username") || "");
  const [fullName, setFullName] = useState(() => localStorage.getItem("signup_fullName") || "");
  const [location, setLocation] = useState(() => localStorage.getItem("signup_location") || "");
  const [userType, setUserType] = useState(() => localStorage.getItem("signup_userType") || "student");
  const [acceptedTerms, setAcceptedTerms] = useState(() => localStorage.getItem("signup_acceptedTerms") === "true");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirm: "",
    username: "",
    fullName: "",
    location: "",
    global: "",
  });

  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    localStorage.setItem("signup_email", value);
    setErrors((prev) => ({
      ...prev,
      email: validator.isEmail(value) ? "" : "Correo inválido",
    }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    localStorage.setItem("signup_password", value);
    setErrors((prev) => ({
      ...prev,
      password: validator.isLength(value, { min: 6 })
        ? ""
        : "La contraseña debe tener al menos 6 caracteres",
      confirm:
        confirm && value !== confirm
          ? "Las contraseñas no coinciden"
          : prev.confirm,
    }));
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirm(value);
    localStorage.setItem("signup_confirm", value);
    setErrors((prev) => ({
      ...prev,
      confirm: password !== value ? "Las contraseñas no coinciden" : "",
    }));
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    localStorage.setItem("signup_username", value);
    setErrors((prev) => ({
      ...prev,
      username: validator.isEmpty(value.trim())
        ? "El nombre de usuario no puede estar vacío"
        : "",
    }));
  };

  const handleFullNameChange = (e) => {
    const value = e.target.value;
    setFullName(value);
    localStorage.setItem("signup_fullName", value);
    setErrors((prev) => ({
      ...prev,
      fullName: validator.isEmpty(value.trim())
        ? "El nombre completo no puede estar vacío"
        : "",
    }));
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);
    localStorage.setItem("signup_location", value);
    setErrors((prev) => ({
      ...prev,
      location: validator.isEmpty(value.trim())
        ? "La ubicación no puede estar vacía"
        : "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!validator.isEmail(email)) newErrors.email = "Correo inválido";
    if (!validator.isLength(password, { min: 6 }))
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    if (password !== confirm)
      newErrors.confirm = "Las contraseñas no coinciden";
    if (validator.isEmpty(username.trim()))
      newErrors.username = "El nombre de usuario no puede estar vacío";
    if (validator.isEmpty(fullName.trim()))
      newErrors.fullName = "El nombre completo no puede estar vacío";
    if (validator.isEmpty(location.trim()))
      newErrors.location = "La ubicación no puede estar vacía";

    // Agregué:
    if (!acceptedTerms)
      newErrors.global = "Debes aceptar los términos y condiciones.";

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("firebaseToken", token);

      await axios.post("http://localhost:8000/api/firebase-signup/", {
        token,
        role: userType,
        username,
        full_name: fullName,
        location,
      });

      navigate(userType === "teacher" ? "/teacher" : "/feed");

      localStorage.removeItem("signup_email");
      localStorage.removeItem("signup_password");
      localStorage.removeItem("signup_confirm");
      localStorage.removeItem("signup_username");
      localStorage.removeItem("signup_fullName");
      localStorage.removeItem("signup_location");
      localStorage.removeItem("signup_userType");
      localStorage.removeItem("signup_acceptedTerms");

    } catch (error) {
      console.error("Error al registrar:", error);
      setErrors((prev) => ({
        ...prev,
        global:
          "Se produjo un error durante el registro. Por favor, inténtalo de nuevo.",
      }));
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: "Geolocalización no soportada en este navegador.",
      }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await resp.json();
          if (data.display_name) {
            setLocation(data.display_name);
            setErrors((prev) => ({ ...prev, location: "" }));
          } else {
            throw new Error();
          }
        } catch {
          setErrors((prev) => ({
            ...prev,
            location: "No se pudo obtener la dirección.",
          }));
        }
      },
      () => {
        setErrors((prev) => ({
          ...prev,
          location: "Error al obtener la geolocalización.",
        }));
      }
    );
  };

  return (
    <div className="signup__auth-container">
      <div className="signup__form-wrapper">
        <h2 className="signup__title">Sign Up</h2>
        {errors.global && (
          <div className="signup__error-message">{errors.global}</div>
        )}
        <form onSubmit={handleSignup} className="signup__form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={handleUsernameChange}
            required
          />
          {errors.username && (
            <div className="signup__error-message">{errors.username}</div>
          )}
          <input
            type="text"
            placeholder="Nombre Completo"
            value={fullName}
            onChange={handleFullNameChange}
            required
          />
          {errors.fullName && (
            <div className="signup__error-message">{errors.fullName}</div>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            required
          />
          {errors.email && (
            <div className="signup__error-message">{errors.email}</div>
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          {errors.password && (
            <div className="signup__error-message">{errors.password}</div>
          )}
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={handleConfirmChange}
            required
          />
          {errors.confirm && (
            <div className="signup__error-message">{errors.confirm}</div>
          )}

          <div className="signup__location-field">
            <input
              type="text"
              placeholder="Ubicación"
              value={location}
              onChange={handleLocationChange}
              required
            />
            <button type="button" onClick={getLocation}>
              Obtener Ubicación
            </button>
          </div>
          {errors.location && (
            <div className="signup__error-message">{errors.location}</div>
          )}

          <div className="signup__user-type">
            <label htmlFor="userType">Registrarse como:</label>
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Docente</option>
            </select>
          </div>

          <div className="form-check d-flex align-items-center">
            <label
              className="form-check-label d-flex align-items-center"
              htmlFor="termsCheckbox"
            >
              <input
                id="termsCheckbox"
                type="checkbox"
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                style={{ marginRight: "10px", marginTop: "4px" }}
              />
              <span style={{ marginRight: "5px" }}>Accept</span>
              <Link to="/politicas">Policies</Link>
            </label>
          </div>

          <button type="submit" className="signup__btn--primary">
            SIGN UP
          </button>
        </form>

        <p className="signup__bottom-text">
          Already have an account? <a href="/">Login</a>
        </p>
        <p className="signup__bottom-text">
          <a href="/politicas">Ver Políticas</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;

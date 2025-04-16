import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth'; // Importa la función correcta
import { auth } from '../firebase'; 
import '../styles/recuperarContrasenna.css';

const RecuperarContrasenna = () => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState(null);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    console.log(email)

    if (!email) {
      setMensaje("Please type an email");
      return;
    }
  
    try {
      // Primero consulta al backend para verificar si es admin
      const response = await fetch("http://localhost:8000/api/password-reset-request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        if (data.mensaje === "admin") {
          setMensaje("A different method is required to change the password.");
          return;
        } else if (data.mensaje === "ok") {
          // Ahora sí mandamos el correo desde Firebase
          await sendPasswordResetEmail(auth, email);
          setMensaje("If the email is registered, you'll receive an email to recover your password.");
        }
      } else {
        setMensaje(data.error || "Unexpected error occurred");
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("Error while sending email");
    }
  };
  

  return (
    <div className="auth-container">
      <div className="form-wrapper">
        <h2>Recover password</h2>
        <form onSubmit={handlePasswordReset}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required 
          />
          <button type="submit" className="login-btn">Send email to recover your password</button>
        </form>
        {mensaje && <p>{mensaje}</p>}
        <p> <a href="/">Back to Login</a></p>
        <p><a href="/politicas">See politics</a></p>
      </div>
    </div>
  );
};

export default RecuperarContrasenna;


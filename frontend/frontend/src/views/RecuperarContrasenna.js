import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth'; // Importa la función correcta
import { auth } from '../firebase'; 
import '../styles/recuperarContrasenna.css';

const RecuperarContrasenna = () => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState(null);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMensaje("Please tpye an email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email); // Enviar solicitud a Firebase
      setMensaje("If the email is registered, you'll receive an email to recovery your password.");
    } catch (error) {
      console.error("Error while sending email:", error); 
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


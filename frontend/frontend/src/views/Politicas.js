import React from 'react';
import '../styles/politicas.css';

const Politicas = () => {
  return (
    <div className="politica-container">
      <div className="politica-box">
        <h2>Política de Privacidad</h2>
        <p>
          En nuestra plataforma, valoramos tu privacidad. La información que
          recopilamos es utilizada únicamente para ofrecerte una mejor experiencia de usuario.
        </p>
        <p>
          No compartiremos tus datos con terceros sin tu consentimiento. El uso de esta
          plataforma implica la aceptación de nuestras políticas.
        </p>
        <h3>Datos que recopilamos:</h3>
        <ul>
          <li>Correo electrónico</li>
          <li>Nombre de usuario</li>
          <li>Actividad dentro del sistema</li>
        </ul>
        <p>Podés revisar esta política en cualquier momento.</p>
        <a href="/">Volver al login</a>
      </div>
    </div>
  );
};

export default Politicas;

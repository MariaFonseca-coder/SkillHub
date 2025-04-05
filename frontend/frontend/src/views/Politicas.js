// src/components/Politicas.js
import React from 'react';
import '../styles/politicas.css';

const Politicas = () => {
  return (
    <div className="politica-container">
      <div className="politica-box">
        <h2>Privacy Policy</h2>
        <p>
          At our platform, we value your privacy. The information we collect is used solely to provide you with a better user experience.
        </p>
        <p>
          We will not share your data with third parties without your consent. By using this platform, you agree to our policies.
        </p>
        <h3>Data We Collect:</h3>
        <ul>
          <li>Email address</li>
          <li>Username</li>
          <li>System activity</li>
        </ul>
        <p>You can review this policy at any time.</p>
        <a href="/">Back to login</a>
      </div>
    </div>
  );
};

export default Politicas;

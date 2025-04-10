import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/gestionContactos.css";

const GestionContactos = () => {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/friends-list/");
        setFriends(response.data.friends);
      } catch (error) {
        console.error("Error al obtener la lista de amigos:", error);
      }
    };

    fetchFriends();
  }, []);

  return (
    <div>
      <h2>Friends list</h2>
      <div className="friends-list">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.id} className="friend-card">
              <img
                src= "https://www.obbstartersandalternators.com/images/test.png"
                alt="Foto de usuario"
                className="friend-photo"
              />
              <span className="friend-name">{friend.name}</span>
              <button className="delete-btn">Eliminar</button>
              <button className="message-btn">Enviar mensaje</button>
            </div>
          ))
        ) : (
          <p>No tienes amigos aún.</p>
        )}
      </div>
    </div>
  );
};

export default GestionContactos;


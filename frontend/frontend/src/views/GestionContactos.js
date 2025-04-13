import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import "../styles/gestionContactos.css";

const GestionContactos = () => {
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Estado para mostrar el modal
  const [friendToDelete, setFriendToDelete] = useState(null); // Estado para saber a qué amigo eliminar

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

  const handleDeleteFriend = async (friendId) => {
    try {
      // Mostrar el modal de confirmación
      setShowConfirmModal(true);
      setFriendToDelete(friendId); // Guardar el id del amigo a eliminar
    } catch (error) {
      console.error("Error al eliminar la amistad:", error);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete("http://localhost:8000/api/delete-friend/", {
        data: { friend_id: friendToDelete }
      });
      // Filtramos al amigo eliminado de la lista local
      setFriends((prevFriends) => prevFriends.filter((f) => f.id !== friendToDelete));
      setShowConfirmModal(false); // Cerrar el modal
    } catch (error) {
      console.error("Error al eliminar la amistad:", error);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false); // Cerrar el modal sin hacer nada
  };

  return (
    <div>
      <h2>Friends list</h2>
      <div className="friends-list">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.id} className="friend-card">
              <img
                src={friend.fotoPerfil || "https://via.placeholder.com/96"} // <- si no hay fotoPerfil, imagen por defecto
                alt={`Foto de ${friend.name}`}
                className="friend-photo"
              />
              <span className="friend-name">{friend.name}</span>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteFriend(friend.id)}
              >
                Eliminar
              </button>
              <button
                className="message-btn"
                onClick={() => navigate(`/chat/${friend.id}`)}
              >
                Enviar mensaje
              </button>
            </div>
          ))
        ) : (
          <p>No tienes amigos aún.</p>
        )}
      </div>

      {/* Modal de confirmación - Ventana pequeña */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3>¿Estás seguro de que quieres eliminar a este usuario de tu lista de amigos?</h3>
            <div className="modal-actions">
              <button onClick={confirmDelete} className="modal-btn yes">Sí</button>
              <button onClick={cancelDelete} className="modal-btn no">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionContactos;

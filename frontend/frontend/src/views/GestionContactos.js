import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import "../styles/gestionContactos.css";

const GestionContactos = () => {
  const auth = getAuth();
const user = auth.currentUser;
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Estado para mostrar el modal
  const [friendToDelete, setFriendToDelete] = useState(null); // Estado para saber a qué amigo eliminar

  

  useEffect(() => {
    const auth = getAuth();
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
  
          const response = await axios.get("http://localhost:8000/api/friends-list/", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
  
          setFriends(response.data.friends);
        } catch (error) {
          console.error("Error al obtener la lista de amigos:", error);
        }
      } else {
        console.log("No hay usuario autenticado.");
      }
    });
  
    return () => unsubscribe(); // Limpieza del listener al desmontar el componente
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
    const user = auth.currentUser;
    if (!user) {
      console.error("Usuario no autenticado");
      return;
    }

    const token = await user.getIdToken();

    await axios.delete("http://localhost:8000/api/delete-friend/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { friend_id: friendToDelete }
    });

    // Actualizar lista de amigos local
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
                Delete
              </button>
              <button
                className="message-btn"
                onClick={() => navigate(`/chat/${friend.id}`)}
              >
                Send message
              </button>
            </div>
          ))
        ) : (
          <p>Your friends will be displayed here!</p>
        )}
      </div>

      {/* Modal de confirmación - Ventana pequeña */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3>Are you sure you want to delete this user from your friends list?</h3>
            <div className="modal-actions">
              <button onClick={confirmDelete} className="modal-btn yes">Yes</button>
              <button onClick={cancelDelete} className="modal-btn no">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionContactos;

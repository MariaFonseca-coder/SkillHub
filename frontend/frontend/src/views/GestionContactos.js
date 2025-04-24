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
  const [followers, setFollowers] = useState([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("friends"); // "friends" o "followers"

  
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFollowers = followers.filter((follower) =>
    follower.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          const followersResponse = await axios.get("http://localhost:8000/api/followers-list/", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setFollowers(followersResponse.data.followers);

        } catch (error) {
          console.error("Error al obtener la lista de amigos:", error);
        }
      } else {
        console.log("No hay usuario autenticado.");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteFriend = async (friendId) => {
    setShowConfirmModal(true);
    setFriendToDelete(friendId);
  };

  const handleRemoveFollower = async (followerId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("Usuario no autenticado");
        return;
      }
  
      const token = await user.getIdToken();
  
      await axios.delete("http://localhost:8000/api/delete-follower/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { follower_id: followerId },
      });
  
      // Actualizamos la lista de seguidores localmente
      setFollowers((prev) => prev.filter((f) => f.id !== followerId));
    } catch (error) {
      console.error("Error al eliminar al seguidor:", error);
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
        data: { friend_id: friendToDelete },
      });

      setFriends((prevFriends) => prevFriends.filter((f) => f.id !== friendToDelete));
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error al eliminar la amistad:", error);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
  };

  return (
    
    <div className="layout-wrapper">
  <div className="side-band lleft-band"></div>

  <div className="main-container">
    <h2>Contacts management</h2>

    <div className="toggle-container">
      <button
        className={viewMode === "friends" ? "active-toggle" : ""}
        onClick={() => setViewMode("friends")}
      >
        Friends
      </button>
      <button
        className={viewMode === "followers" ? "active-toggle" : ""}
        onClick={() => setViewMode("followers")}
      >
        Followers
      </button>
    </div>

    <div className="search-container">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />
    </div>

    <div className="friends-list">
      {viewMode === "friends" ? (
        filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <div key={friend.id} className="friend-card">
              <img
                src={friend.fotoPerfil || "https://via.placeholder.com/96"}
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
          <p>No friends found</p>
        )
      ) : (
        filteredFollowers.length > 0 ? (
          filteredFollowers.map((follower) => (
            <div key={follower.id} className="friend-card">
              <img
                src={follower.fotoPerfil || "https://via.placeholder.com/96"}
                alt={`Foto de ${follower.name}`}
                className="friend-photo"
              />
              <span className="friend-name">{follower.name}</span>
              <button
                className="delete-btn"
                onClick={() => handleRemoveFollower(follower.id)}
              >
                Remove follower
              </button>
              <button
                className="message-btn"
                onClick={() => navigate(`/chat/${follower.id}`)}
              >
                Send message
              </button>
            </div>
          ))
        ) : (
          <p>No followers found</p>
        )
      )}
    </div>

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

  <div className="side-band rright-band"></div>
</div>

  );
};

export default GestionContactos;

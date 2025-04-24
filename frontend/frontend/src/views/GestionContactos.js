import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import "../styles/gestionContactos.css";

const GestionContactos = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); // New state for pending requests

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("friends"); // "friends", "followers", or "pending"

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFollowers = followers.filter((follower) =>
    follower.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingRequests = pendingRequests.filter((request) =>
    request.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();

          // Fetch friends
          const friendsResponse = await axios.get("http://localhost:8000/api/friends-list/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFriends(friendsResponse.data.friends);

          // Fetch followers
          const followersResponse = await axios.get("http://localhost:8000/api/followers-list/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFollowers(followersResponse.data.followers);

          // Fetch pending requests
          const pendingResponse = await axios.get("http://localhost:8000/api/friends-list-pending/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPendingRequests(pendingResponse.data.friends);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else {
        console.log("No authenticated user.");
      }
    });

    return () => unsubscribe();
  }, []);


  const fetchPendingRequests = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        const token = await user.getIdToken();

        // Fetch pending requests from the backend
        const pendingResponse = await axios.get("http://localhost:8000/api/friends-list-pending/", {
            headers: { Authorization: `Bearer ${token}` },
        });
        setPendingRequests(pendingResponse.data.friends);
    } catch (error) {
        console.error("Error fetching pending requests:", error);
    }
};


  const handleAcceptRequest = async (friendId) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        const token = await user.getIdToken();

        // Send PUT request to update the friendship state to "accepted"
        await axios.put(
            "http://localhost:8000/api/friends-list-pending/",
            { friend_id: friendId, state: "accepted" },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        // Remove the accepted request from the local state
        setPendingRequests((prev) => prev.filter((request) => request.id !== friendId));
    } catch (error) {
        console.error("Error accepting friend request:", error);
    }
};

const handleDenyRequest = async (friendId) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        const token = await user.getIdToken();

        // Send PUT request to update the friendship state to "denied"
        await axios.put(
            "http://localhost:8000/api/friends-list-pending/",
            { friend_id: friendId, state: "denied" },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        // Remove the denied request from the local state
        setPendingRequests((prev) => prev.filter((request) => request.id !== friendId));
    } catch (error) {
        console.error("Error denying friend request:", error);
    }
};

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
        <h2>Contacts Management</h2>

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
          <button
            className={viewMode === "pending" ? "active-toggle" : ""}
            onClick={() => setViewMode("pending")}
          >
            Pending Requests
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
                  <div className="friend-card-buttons">
                    <button
                      className="message-btn"
                      onClick={() => navigate(`/chat/${friend.id}`)}
                    >
                      Send Message
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteFriend(friend.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No friends found</p>
            )
          ) : viewMode === "followers" ? (
            filteredFollowers.length > 0 ? (
              filteredFollowers.map((follower) => (
                <div key={follower.id} className="friend-card">
                  <img
                    src={follower.fotoPerfil || "https://via.placeholder.com/96"}
                    alt={`Foto de ${follower.name}`}
                    className="friend-photo"
                  />
                  <span className="friend-name">{follower.name}</span>
                  <div className="friend-card-buttons">
                    <button
                      className="message-btn"
                      onClick={() => navigate(`/chat/${follower.id}`)}
                    >
                      Send Message
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleRemoveFollower(follower.id)}
                    >
                      Remove Follower
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No followers found</p>
            )
          ) : viewMode === "pending" ? (
            filteredPendingRequests.length > 0 ? (
              filteredPendingRequests.map((request) => (
                <div key={request.id} className="friend-card">
                  <img
                    src={request.fotoPerfil || "https://via.placeholder.com/96"}
                    alt={`Foto de ${request.name}`}
                    className="friend-photo"
                  />
                  <span className="friend-name">{request.name}</span>
                  <button
                    className="accept-btn"
                    onClick={() => handleAcceptRequest(request.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="deny-btn"
                    onClick={() => handleDenyRequest(request.id)}
                  >
                    Deny
                  </button>
                </div>
              ))
            ) : (
              <p>No pending requests found</p>
            )
          ) : null}
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

    </div>
  );
};

export default GestionContactos;

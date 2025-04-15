import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "../styles/chat.css";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [friendData, setFriendData] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // 👈 nuevo estado

  const { friendId } = useParams();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid); // ✅ guardamos el uid real
      } else {
        console.log("Usuario no autenticado");
      }
    });

    return () => unsubscribe(); // limpieza
  }, []);

  useEffect(() => {
    if (!friendId) return;
    const fetchFriendData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/get_user_info/?friend_id=${friendId}`);
        const data = await response.json();
        setFriendData(data);
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };

    fetchFriendData();
  }, [friendId]);

  useEffect(() => {
    if (!currentUserId || !friendId) return;

    const fetchChatId = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/get-chat-id/?user1=${currentUserId}&user2=${friendId}`);
        const data = await response.json();

        if (response.ok) {
          setChatId(data.chatId);
          setMessages(data.messages || []);
        } else {
          console.warn(data.message || "No se encontró chat.");
        }
      } catch (error) {
        console.error("Error al obtener chat ID:", error);
      }
    };

    fetchChatId();
  }, [currentUserId, friendId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUserId) return;

    const nuevoMensaje = {
      text: newMessage,
      time: new Date().toISOString(),
      user: currentUserId
    };

    try {
      const response = await fetch("http://localhost:8000/api/send-message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatId,
          text: newMessage,
          userId: currentUserId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, nuevoMensaje]);
        setNewMessage("");
      } else {
        console.error("Error al enviar mensaje:", data.error);
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="friend-info">
        {friendData ? (
          <>
            <h3>{friendData.displayName}</h3>
            {friendData.fotoPerfil && (
              <img src={friendData.fotoPerfil} alt="Foto de perfil" className="profile-pic" />
            )}
          </>
        ) : (
          <p>Cargando info del usuario...</p>
        )}
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.user === currentUserId ? "sent" : "received"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Write something..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="send-button" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import "../styles/chat.css";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [friendData, setFriendData] = useState(null);
  const [chatId, setChatId] = useState(null); // <--- nuevo estado para guardar el chatId

  const { friendId } = useParams();
  const currentUserId = "zOcHVjePjAaX8m5xeqOuIYqAedh2"; // Temporalmente quemado


  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/get_user_info/?friend_id=${friendId}`);
        if (!response.ok) throw new Error("Error al obtener datos del usuario");
        const data = await response.json();
        setFriendData(data);
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };

    fetchFriendData();
  }, [friendId]);

  useEffect(() => {
    const fetchChatId = async () => {
      const currentUserId = "zOcHVjePjAaX8m5xeqOuIYqAedh2"; // Temporal
      const friendUserId = friendId;

      try {
        const response = await fetch(`http://localhost:8000/api/get-chat-id/?user1=${currentUserId}&user2=${friendUserId}`);
        const data = await response.json();
        console.log("Chat ID encontrado:", data.chatId);
        setChatId(data.chatId); // <--- guardamos el chatId aquí
      } catch (error) {
        console.error("Error al obtener chat ID:", error);
      }
    };

    fetchChatId();
  }, [friendId]);

  useEffect(() => {
    const fetchChatId = async () => {
      const currentUserId = "zOcHVjePjAaX8m5xeqOuIYqAedh2"; // Temporal
      const friendUserId = friendId;
  
      try {
        const response = await fetch(`http://localhost:8000/api/get-chat-id/?user1=${currentUserId}&user2=${friendUserId}`);
        const data = await response.json();
  
        if (response.ok) {
          console.log("Chat ID encontrado:", data.chatId);
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
  }, [friendId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
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
          chatId: chatId,
          text: newMessage,
          userId: currentUserId
        })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Mostramos el mensaje al instante
        setMessages((prevMessages) => [...prevMessages, nuevoMensaje]);
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
      className={`message ${
        msg.user === currentUserId ? "sent" : "received"
      }`}
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


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

import '../../styles/Profile/profile.css';
import Notifications from '../Notification/NotificationsView'; // Import the Notifications component

const Profile = () => {
    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('firebaseToken');

    useEffect(() => {
        if (token) {
            // Obtener los datos del perfil del usuario
            axios.get('http://localhost:8000/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
                setProfileData(response.data);
                setLoading(false);
            })
            .catch(error => {
                setError('Error getting profile');
                setLoading(false);
            });


        } else {
            setError('Something went wrong, please login again');
            setLoading(false);
        }
    }, [token]);

    // Aquí va la logica para manejar el follow
    const handleFollow = (userId) => {
        console.log(`Follow user: ${userId}`); 
    };

    // Aquí va la logica para manejar el reporte
    const handleReport = (userId) => {
        console.log(`Report user: ${userId}`); 
    };

    // Aquí va la logica para manejar el mensaje 
   
    const handleSendMessage = (userId) => {
    console.log(`Send message to user: ${userId}`);
    navigate(`/chat/${userId}`); // Navigate to the chat page with the userId
};

    // Renderizando el contenido
    if (loading) return <div className="loading-message">Loading...</div>;
    if (error) return <div className="error-message">Error loading profile, Please Login again.</div>;

    return (
        <div className="profile-container">
            <h1>{profileData.name}'s Profile</h1>

            {/* Mostrar foto de perfil si está disponible */}
            {profileData.fotoPerfil && (
                <img 
                    src={profileData.fotoPerfil} 
                    alt="Profile" 
                    className="profile-picture"
                />
            )}

            {/* Mostrar datos del perfil */}
            <p>Email: {profileData.email}</p>
            <p>Biography: {profileData.biografia}</p>
            <p>Name: {profileData.name}</p>

            {/* Botón para redirigir a la sección de Account Management */}
            <Link to="/account-management">
                <button className="manage-account-button">Account Management</button>
            </Link>

            {/* Publicaciones del usuario */}
            <div className="user-posts">
                <h2>My Posts</h2>
                {userPosts.length === 0 ? <p>No posts available.</p> : userPosts.map(post => (
                    <div key={post.id} className="post-item">
                        <p>{post.content}</p>
                    </div>
                ))}
            </div>

 
            

            {/* Notifications */}
            <div className="notifications-section">
                <Notifications /> {}
            </div>
        </div>
    );

    
};

export default Profile;

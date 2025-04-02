import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../styles/Profile/profile.css';

const Profile = () => {
    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]); 
    const [recommendedUsers, setRecommendedUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

            // Obtener las publicaciones del usuario
            axios.get('http://localhost:8000/api/profile/user-posts', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
                setUserPosts(response.data);
            })
            .catch(error => {
                setError('Error getting posts');
            });

            // Obtener usuarios recomendados
            axios.get('http://localhost:8000/api/profile/recommended-users', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
                setRecommendedUsers(response.data); 
            })
            .catch(error => {
                console.error('Error getting recommended users', error);
            });
        } else {
            setError('Something went wrong, please login again');
            setLoading(false);
        }
    }, [token]);


const handleFollow = (userId) => {
    console.log(`Seguir a: ${userId}`); 
};


const handleReport = (userId) => {
    console.log(`Reportar a: ${userId}`); 
};


const handleSendMessage = (userId) => {
    console.log(`Enviar mensaje a: ${userId}`); 
};

    // Renderizando el contenido
    if (loading) return <div className="loading-message">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="profile-container">
            <h1>{profileData.name}'s Profile</h1>

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

            {/* Usuarios recomendados */}
            <div className="recommended-users">
                <h2>Recommended Users</h2>
                {recommendedUsers.length === 0 ? <p>No recommended users.</p> : recommendedUsers.map(user => (
                    <div key={user.uid} className="recommended-user">
                        <p>{user.name}</p>
                        <button className="follow-button" onClick={() => handleFollow(user.uid)}>Follow</button>
                        <button className="report-button" onClick={() => handleReport(user.uid)}>Report</button>
                        <button className="message-button" onClick={() => handleSendMessage(user.uid)}>Send Message</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Profile;

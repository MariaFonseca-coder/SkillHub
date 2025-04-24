import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

import '../../styles/Profile/profile.css';
import Notifications from '../Notification/NotificationsView'; // Import the Notifications component
import { FaHome, FaLock } from "react-icons/fa";

const Profile = () => {
    const { userId: paramUserId } = useParams(); // <-- id de la URL
    const [profileData, setProfileData] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('firebaseToken');

    useEffect(() => {
        if (!token) {
            setError('Token not found. Please log in.');
            setLoading(false);
            return;
        }

        // Obtener el perfil del usuario autenticado
        axios.get('http://localhost:8000/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setCurrentUserId(res.data.id); // Guardamos el ID actual
        })
        .catch(() => {
            setError('Error getting current user');
            setLoading(false);
        });

    }, [token]);

    useEffect(() => {
        if (!token || currentUserId === null) return;

        const url = paramUserId
            ? `http://localhost:8000/api/profile/${paramUserId}`
            : 'http://localhost:8000/api/profile';

        axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            const profile = response.data;
            const isOwn = !paramUserId || profile.id === currentUserId;

            setProfileData(profile);
            setLoading(false);
        })
        .catch(() => {
            setError('Error al obtener los datos del perfil.');
            setLoading(false);
        });

    }, [token, paramUserId, currentUserId]);

    const isOwnProfile = !paramUserId || (currentUserId && parseInt(paramUserId) === currentUserId);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="profile-container">
            <div className='go-back-button'>
                <a href="#" className="btn-go-back"><FaHome /></a>
            </div>
            <h1>{profileData.displayName}</h1>

            {profileData.fotoPerfil && (
                <img src={profileData.fotoPerfil} alt="Profile" className="profile-picture" />
            )}

            <p>Email: {profileData.email}</p>
            <p>Biography: {profileData.biografia}</p>
            <p>Name: {profileData.name}</p>
            {/* Campos agregados */}
            <p>Role: {profileData.role}</p>

            {!isOwnProfile && (
                <div className='actions-profile'>
                    <button className='btn-Add-friend'>Add friend</button>
                    <button className='btn-profile-report'>Report</button>
                    <button className='btn-message-profile'>Message</button>
                </div>
            )}

            {isOwnProfile && (
                <Link to="/account-management">
                    <button className="manage-account-button">Account Management</button>
                </Link>
            )}

            {!isOwnProfile && profileData.privacidad === 'private' && (
                <div className="profile-info-message private">
                    <FaLock className="lock-icon" /> {/* Icono de candado */}
                    Este perfil es privado. Para ver más contenido deberás ser amigo.
                </div>
            )}

            <div className="notifications-section">
                <Notifications />
            </div>
        </div>
    );
};

export default Profile;
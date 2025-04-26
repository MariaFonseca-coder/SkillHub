import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';

import '../../styles/Profile/profile.css';
import Notifications from '../Notification/NotificationsView';
import { FaHome, FaLock } from "react-icons/fa";

const Profile = () => {
    const { userId: paramUserId } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('firebaseToken');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportDescription, setReportDescription] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Token not found. Please log in.');
            setLoading(false);
            return;
        }

        axios.get('http://localhost:8000/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setCurrentUserId(res.data.id);
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
            setProfileData(response.data);
            setLoading(false);
        })
        .catch(() => {
            setError('Error al obtener los datos del perfil.');
            setLoading(false);
        });

    }, [token, paramUserId, currentUserId]);

    const isOwnProfile = !paramUserId || (currentUserId && parseInt(paramUserId) === currentUserId);

    const handleAddFriend = () => {
        if (!token) {
            alert('Debes iniciar sesión para agregar amigos.');
            return;
        }

        axios.post(`http://localhost:8000/api/profile/add-friend/${paramUserId}/`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            alert(response.data.message);
        })
        .catch(error => {
            console.error('Error al agregar amigo:', error);
            alert(error.response?.data?.error || 'Ocurrió un error al agregar al amigo.');
        });
    };

    const handleAddFollower = () => {
        if (!token) {
            alert('Debes iniciar sesión para seguir a alguien.');
            return;
        }

        axios.post(`http://localhost:8000/api/profile/add-follower/${paramUserId}/`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            alert(response.data.message);
        })
        .catch(error => {
            console.error('Error al seguir:', error);
            alert(error.response?.data?.error || 'Ocurrió un error al seguir al usuario.');
        });
    };

    const handleSendMessage = () => {
        navigate(`/chat/${paramUserId}`);
    };

    const handleReport = () => {
        setShowReportModal(true);
    };

    const handleSubmitReport = () => {
        if (!reportDescription.trim()) {
            alert('Por favor, proporciona una descripción para el reporte.');
            return;
        }

        axios.post('http://localhost:8000/api/profile/report-user/', {
            description: reportDescription,
            userId: paramUserId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            alert(response.data.message);
            setShowReportModal(false);
            setReportDescription('');
        })
        .catch(error => {
            console.error('Error al enviar el reporte:', error);
            alert(error.response?.data?.error || 'Error enviando el reporte.');
        });
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="profile-container">
            <div className='go-back-button'>
                <a href="http://localhost:3000/feed" className="btn-go-back"><FaHome /></a>
            </div>
            <h1>{profileData.name}</h1>

            {profileData.fotoPerfil && (
                <img src={profileData.fotoPerfil} alt="Profile" className="profile-picture" />
            )}

            <p className="profile-info">Email: {profileData.email}</p>
            <p className="profile-info">Biography: {profileData.biografia}</p>
            <p className="profile-info">Name: {profileData.name}</p>

            {!isOwnProfile && (
                <div className='actions-profile'>
                    <button className='btn-Add-friend' onClick={handleAddFriend}>Add friend</button>
                    <button className='btn-follow' onClick={handleAddFollower}>Follow</button>
                    <button className='btn-profile-report' onClick={handleReport}>Report</button>
                    <button className='btn-message-profile' onClick={handleSendMessage}>Message</button>
                </div>
            )}

            {isOwnProfile && (
                <>
                    <Link to="/account-management">
                        <button className="manage-account-button">Account Management</button>
                    </Link>
                    <div className="own-profile-actions">
                        <Link to="/GestionContactos">
                            <button className="gestion-contactos-button">Gestionar Contactos</button>
                        </Link>
                    </div>
                </>
            )}

            {!isOwnProfile && profileData.privacidad === 'private' && (
                <div className="profile-info-message private">
                    <FaLock className="lock-icon" />
                    Este perfil es privado. Para ver más contenido deberás ser amigo.
                </div>
            )}

            <div className="notifications-section">
                <Notifications />
            </div>

            {showReportModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Reportar Usuario</h2>
                        <textarea
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            className="report-textarea"
                            placeholder="Descripción del reporte"
                        />
                        <button onClick={handleSubmitReport} className="modal-button">Enviar Reporte</button>
                        <button onClick={() => setShowReportModal(false)} className="cancel-button">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;

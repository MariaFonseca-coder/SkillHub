import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import UserPosts from './components/UserPosts';
import '../../styles/Profile/profile.css';
import Notifications from '../Notification/NotificationsView';
import { FaHome, FaLock } from "react-icons/fa";

const Profile = () => {
    const { userId: paramUserId } = useParams(); // <-- id de la URL

    const [profileData, setProfileData] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('firebaseToken');

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportDescription, setReportDescription] = useState('');
    const [isFriend, setIsFriend] = useState(false);

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

            // Verificamos si el perfil es privado y si es amigo
            if (paramUserId && !isOwn) {
                axios.get(`http://localhost:8000/api/profile/${paramUserId}/is-friend/${currentUserId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then(friendResponse => {
                    setIsFriend(friendResponse.data.isFriend);
                })
                .catch(() => {
                    setIsFriend(false);
                });
            }

            setProfileData(profile);
            setLoading(false);
        })
        .catch(() => {
            setError('Error al obtener los datos del perfil.');
            setLoading(false);
        });
    }, [token, paramUserId, currentUserId]);

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

    const isOwnProfile = !paramUserId || (currentUserId && parseInt(paramUserId) === currentUserId);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="profile-container">
            <div className='go-back-button'>
                <a href="http://localhost:3000/feed" className="btn-go-back"><FaHome /></a>
            </div>
            <h1>{profileData.displayName}</h1>

            {profileData.fotoPerfil && (
                <img src={profileData.fotoPerfil} alt="Profile" className="profile-picture" />
            )}

            <p>Email: {profileData.email}</p>
            <p>Biography: {profileData.biografia}</p>
            <p>Name: {profileData.name}</p>
            <p>Role: {profileData.role}</p>

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
                            <button className="gestion-contactos-button">Manage Contacts</button>
                        </Link>
                    </div>
                </>
            )}

            {!isOwnProfile && profileData.privacidad === 'private' && !isFriend && (
                <div className="profile-info-message private">
                    <FaLock className="lock-icon" />
                    Este perfil es privado. Para ver más contenido, debes ser amigo.
                </div>
            )}

            <div className="notifications-section">
                <Notifications />
            </div>

            {showReportModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Report User</h2>
                        <textarea
                            className="report-textarea"
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            placeholder="Describe el motivo del reporte"
                        />
                        <button className="modal-button" onClick={handleSubmitReport}>
                            Enviar Reporte
                        </button>
                        <button className="cancel-button" onClick={() => setShowReportModal(false)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Mostrar los posts solo si el perfil no es privado o si eres amigo */}
            {((isOwnProfile || (profileData.privacidad !== 'private' || isFriend)) && profileData) && (
                <UserPosts isOwnProfile={isOwnProfile} userId={paramUserId} token={token} />
            )}
        </div>
    );
};

export default Profile;
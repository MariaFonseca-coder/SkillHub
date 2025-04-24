import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

import '../../styles/Profile/profile.css';
import Notifications from '../Notification/NotificationsView'; // Import the Notifications component
import { FaHome, FaLock } from "react-icons/fa";

const Profile = () => {
    const { userId: paramUserId } = useParams(); // Extraer el userId de los parámetros de la URL
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

        // Obtener el ID del usuario logueado
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
            ? `http://localhost:8000/api/profile/${paramUserId}`  // URL para perfil de usuario específico
            : 'http://localhost:8000/api/profile'; // Si no se pasa paramUserId, es el perfil del usuario logueado

        // Obtener los datos del perfil
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

    const handleReportUser = () => {
        if (!token) {
            alert('Debes iniciar sesión para reportar.');
            return;
        }

        if (!paramUserId) {
            alert('ID de usuario no válido.');
            return;
        }

        axios.post('http://localhost:8000/api/profile/report-user/', {
            description: "Este usuario fue reportado por comportamiento inapropiado.",
            userId: paramUserId  // ID del usuario reportado
        },{
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            alert(response.data.message);
        })
        .catch(error => {
            console.error('Error al reportar usuario:', error);
            alert(error.response?.data?.error || 'Ocurrió un error al reportar.');
        });
    };

    const handleReport = () => {
        setShowReportModal(true);
    };

    const handleSubmitReport = () => {
        if (!reportDescription.trim()) {
            alert('Por favor, proporciona una descripción para el reporte.');
            return;
        }

        console.log(paramUserId)

        // Usar el paramUserId para reportar al usuario correcto
        axios.post('http://localhost:8000/api/profile/report-user/', {
            description: reportDescription,  // Descripción ingresada por el usuario
            userId: paramUserId  // ID del usuario reportado, obtenido desde los parámetros de la URL
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            alert(response.data.message);
            setShowReportModal(false);  // Cerrar el modal después de enviar el reporte
            setReportDescription('');  // Limpiar el campo de descripción
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
                <a href="#" className="btn-go-back"><FaHome /></a>
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
                    <button className='btn-Add-friend'>Add friend</button>
                    <button className='btn-profile-report' onClick={handleReport}>Report</button>
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
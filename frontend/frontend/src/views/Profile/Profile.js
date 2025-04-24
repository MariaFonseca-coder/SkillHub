import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

import '../../styles/Profile/profile.css';
import Notifications from '../Notification/NotificationsView'; // Import the Notifications component
import { FaHome } from "react-icons/fa";

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

       /* if (profile.privacidad === 'private' && !isOwn) {
            console.log('perfil privado')            
        } else {
            setProfileData(profile);
        }
        */

        console.log(profile)        
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
        alert('You must be logged in to add a friend.');
        return;
    }

    axios.post(`http://localhost:8000/api/profile/add-friend/${paramUserId}/`, {}, { // Pass friendId in the URL
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
        alert(response.data.message); // Show success message
    })
    .catch(error => {
        console.error('Error adding friend:', error);
        alert(error.response?.data?.error || 'An error occurred while adding the friend.');
    });
};
const handleAddFollower = () => {
    if (!token) {
        alert('You must be logged in to follow someone.');
        return;
    }

    axios.post(`http://localhost:8000/api/profile/add-follower/${paramUserId}/`, {}, { // Pass followedId in the URL
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
        alert(response.data.message); // Show success message
    })
    .catch(error => {
        console.error('Error adding follower:', error);
        alert(error.response?.data?.error || 'An error occurred while adding the follower.');
    });
};


const handleSendMessage = () => {
        // Redirigir al componente Chat con el userId del perfil como friendId
        navigate(`/chat/${paramUserId}`);
    };

    const isOwnProfile = !paramUserId || (currentUserId && parseInt(paramUserId) === currentUserId);
    

    if (loading) return <div>Loading...</div>;
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

            <p>Email: {profileData.email}</p>
            <p>Biography: {profileData.biografia}</p>
            <p>Name: {profileData.name}</p>

            {!isOwnProfile && (
               <div className='actions-profile'>
               <button className='btn-Add-friend' onClick={handleAddFriend}>Add friend</button>
               <button className='btn-profile-report'>Report</button>
               <button className='btn-message-profile' onClick={handleSendMessage}>Message</button>
               <button className='btn-follow' onClick={handleAddFollower}>Follow</button>

               </div>
            )}

            {isOwnProfile && (
                <Link to="/account-management">
                    <button className="manage-account-button">Account Management</button>
                </Link>
            )}


            {profileData.privacidad === 'private' && (
                <h1>Este perfil es privado, para ver mas contenido deberas ser amigo!</h1>
            )}


            <div className="notifications-section">
                <Notifications />
            </div>
        </div>
    );
};

export default Profile;
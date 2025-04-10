import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Notifications/notification.css'; // Ajusta el path según tu estructura

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('firebaseToken');

    const formatDate = (date) => {
        if (!date) return 'No date';
        const parsed = new Date(date);
        return isNaN(parsed) ? 'Invalid date' : parsed.toLocaleString();
    };

    useEffect(() => {
        if (!token) {
            setError('No token found');
            setLoading(false);
            return;
        }

        axios.get('http://localhost:8000/api/profile/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            console.log('🔔 Notifications:', response.data);
            setNotifications(response.data);
        })
        .catch(error => {
            console.error('Error fetching notifications:', error);
            setError('Could not load notifications');
        })
        .finally(() => {
            setLoading(false);
        });
    }, [token]);

    if (loading) return <div className="loading-message">Loading notifications...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="notifications-container">
            <h1>Notifications</h1>
            {notifications.length === 0 ? (
                <p>No notifications available.</p>
            ) : (
                notifications.map((notification, index) => {
                    const date = notification.notificationDate || notification.createdAt || notification.created_at;
                    const message = notification.message || notification.displayName || notification.type || 'No message';
                    const type = notification.type || 'Info';

                    return (
                        <div key={index} className="notification-item">
                            <p><strong>{message}</strong></p>
                            <p>{type}</p>
                            <p>{formatDate(date)}</p>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default Notifications;

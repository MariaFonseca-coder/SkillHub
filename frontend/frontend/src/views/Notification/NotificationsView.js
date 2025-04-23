import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Notifications/notification.css'; 
import { FaBell } from 'react-icons/fa'; 

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false); 

    const token = localStorage.getItem('firebaseToken');

    const formatDate = (date) => {
        if (!date) return 'No date';
        const parsed = new Date(date);
        return isNaN(parsed) ? 'Invalid date' : parsed.toLocaleString();
    };

    useEffect(() => {
        if (!token) {
            console.error('No token found in localStorage');
            setError('No token found');
            setLoading(false);
            return;
        }

        axios.get('http://localhost:8000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
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

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const unreadNotifications = notifications.filter(notification => !notification.readed);

    const handleNotificationClick = async (notificationId) => {
        console.log('Notification ID:', notificationId); 
        console.log('Token:', token); 

        if (!token) {
            console.error('No token found in localStorage');
            setError('No token found');
            return;
        }

        try {
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, readed: true }
                        : notification
                )
            );

        
            const response = await axios.put('http://localhost:8000/api/notifications/', 
                { notificationId }, 
                { headers: { Authorization: `Bearer ${token}` } } 
                
            );

            console.log(`Notification ${notificationId} marked as read successfully:`, response.data);
        } catch (error) {
            console.error(`Error updating notification ${notificationId}:`, error.response.data);



        }
    };

    return (
        <div className="notifications-wrapper">
            <div className="notifications-icon" onClick={toggleDropdown}>
                <FaBell />
                {unreadNotifications.length > 0 && (
                    <span className="notification-count">{unreadNotifications.length}</span>
                )}
            </div>

            {dropdownOpen && (
                <div className="notifications-dropdown">
                    <h3>Notifications</h3>
                    {loading ? (
                        <p>Loading notifications...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : notifications.length === 0 ? (
                        <p>No notifications available.</p>
                    ) : (
                        notifications.map((notification, index) => {
                            const date = notification.notificationDate || notification.createdAt || notification.created_at;
                            const message = notification.message || notification.displayName || notification.type || 'No message';
                            const type = notification.type || 'Info';

                            return (
                                <div
                                    key={index}
                                    className={`notification-item ${notification.readed ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notification.id)}
                                >
                                    <p><strong>{message}</strong></p>
                                    <p>{type}</p>
                                    <p>{formatDate(date)}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;

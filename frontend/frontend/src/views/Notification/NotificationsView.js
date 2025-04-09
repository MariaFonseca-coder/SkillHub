import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationView = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('firebaseToken');
    const currentUserId = localStorage.getItem('currentUserId'); // Asumiendo que tienes el userId guardado en el localStorage

    // Función para formatear la fecha
    const formatDate = (notificationDate) => {
        console.log('Raw Notification Date:', notificationDate); // Ver lo que realmente llega como notificationDate

        if (!notificationDate) {
            return 'No date available'; // Si notificationDate no está presente, devolvemos un mensaje de error
        }

        const parsedDate = new Date(notificationDate); // Intentamos convertir la fecha a un objeto Date

        if (isNaN(parsedDate)) {
            console.log('Invalid date detected:', notificationDate); // Log para ver las fechas no válidas
            return 'Invalid date format'; // Si la fecha no es válida, devolvemos un mensaje de error
        }

        return parsedDate.toLocaleString(); // Convertimos la fecha en una cadena según la configuración regional
    };

    useEffect(() => {
        if (token) {
            // Obtener las notificaciones del usuario
            axios.get('http://localhost:8000/api/profile/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
                console.log('Response from backend:', response.data); // Mostrar la respuesta completa del backend
                // Filtrar las notificaciones para mostrar solo las que son para el usuario actual
                const filteredNotifications = response.data.filter(notification => {
                    
                    return notification.userId === currentUserId; // Solo mostrar notificaciones para el usuario actual
                });

                setNotifications(filteredNotifications);
                setLoading(false);
            })
            .catch(error => {
                setError('Error getting notifications');
                setLoading(false);
            });
        } else {
            setError('Something went wrong, please login again');
            setLoading(false);
        }
    }, [token, currentUserId]);

    if (loading) return <div className="loading-message">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="notifications-container">
            <h1>Notifications</h1>
            {notifications.length === 0 ? (
                <p>No notifications available.</p>
            ) : (
                notifications.map((notification, index) => {
                    console.log('Notification:', notification); // Imprimir cada notificación por separado
                    const notificationDate = notification.createdAt || notification.created_at; // Asegurarnos de acceder al campo correcto de fecha

                    // Ver todos los campos de la notificación
                    console.log('All fields in this notification:', Object.keys(notification));

                    const notificationMessage = notification.message || notification.displayName || notification.type || 'No message available'; // Intentamos acceder a otros posibles campos
                    return (
                        <div key={index} className="notification-item">
                            <p><strong>{notificationMessage}</strong></p> {/* Aquí mostramos el mensaje */}
                            <p>{notification.type}</p>
                            {/* Usamos la función para formatear la fecha del Timestamp */}
                            <p>{formatDate(notificationDate)}</p>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default NotificationView;

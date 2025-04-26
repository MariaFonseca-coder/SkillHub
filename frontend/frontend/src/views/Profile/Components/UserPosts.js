import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../../styles/Profile/profile.css';

const UserPosts = ({ isOwnProfile, userId, token }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('useEffect ejecutado con:', { isOwnProfile, userId, token });

        if (!token) {
            console.warn('Token no disponible, no se hará la petición.');
            setError('Token no disponible');
            setLoading(false);
            return;
        }

        const endpoint = isOwnProfile
            ? 'http://localhost:8000/api/profile/user-posts/'
            : `http://localhost:8000/api/profile/${userId}/posts/`;

        console.log('Llamando a la API:', endpoint);

        axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            console.log('Respuesta de la API:', res);
            setPosts(res.data);  // Suponiendo que res.data contiene los posts
            setLoading(false);
        })
        .catch(err => {
            console.error('Error al hacer la solicitud a la API:', err);
            setError('Error al obtener los posts');
            setLoading(false);
        });

    }, [userId, isOwnProfile, token]);

    if (loading) {
        console.log('Cargando publicaciones...');
        return <p>Cargando publicaciones...</p>;
    }

    if (error) {
        console.error('Error en la carga de posts:', error);
        return <p>Error: {error}</p>;
    }

    return (
        <div className="user-posts-section">
            <h2>Publicaciones</h2>
            {posts.length === 0 ? (
                <p>No hay publicaciones para mostrar.</p>
            ) : (
                posts.map((post, idx) => (
                    <div key={idx} className="post-card">
                        {/* Mostrando el contenido del post */}
                        <p>{post.content}</p>

                        {/* Verificando si el post tiene un video de YouTube asociado */}
                        {post.mediaUrl && post.mediaUrl.includes('youtube.com') && (
                            <div className="media-container">
                                <iframe 
                                    width="560" 
                                    height="315" 
                                    src={`https://www.youtube.com/embed/${new URL(post.mediaUrl).searchParams.get('v')}`} 
                                    title="YouTube video" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen>
                                </iframe>
                            </div>
                        )}

                        {/* Verificando si el post tiene una imagen o URL de otro tipo */}
                        {post.mediaUrl && !post.mediaUrl.includes('youtube.com') && (
                            <div className="media-container">
                                <img
                                    src={post.mediaUrl}
                                    alt={`Post media ${idx}`}
                                    className="post-image"
                                />
                            </div>
                        )}

                        {/* Mostrando la fecha de creación */}
                        <small>{new Date(post.createdAt * 1000).toLocaleString()}</small>
                    </div>
                ))
            )}
        </div>
    );
};

export default UserPosts;
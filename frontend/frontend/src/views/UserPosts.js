import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserPosts = ({ isOwnProfile, userId, token }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const endpoint = isOwnProfile
            ? 'http://localhost:8000/api/profile/user-posts/'
            : `http://localhost:8000/api/profile/${userId}/posts/`;

        axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setPosts(res.data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Error al obtener los posts:', err);
            setLoading(false);
        });

    }, [userId, isOwnProfile, token]);

    if (loading) return <p>Cargando publicaciones...</p>;

    return (
        <div className="user-posts-section">
            <h2>Publicaciones</h2>
            {posts.length === 0 ? (
                <p>No hay publicaciones para mostrar.</p>
            ) : (
                posts.map((post, idx) => (
                    <div key={idx} className="post-card">
                        <p>{post.content}</p>
                        <small>{new Date(post.createdAt._seconds * 1000).toLocaleString()}</small>
                    </div>
                ))
            )}
        </div>
    );
};

export default UserPosts;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserPosts = ({ uid, token }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                let res;
                if (token) {
                    res = await axios.get('http://localhost:8000/api/posts/', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                } else {
                    res = await axios.get(`http://localhost:8000/api/posts/public/${uid}/`);
                }
                setPosts(res.data);
            } catch (err) {
                console.error("Error fetching posts", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [uid, token]);

    if (loading) return <p>Cargando publicaciones...</p>;
    if (posts.length === 0) return <p>Este usuario no tiene publicaciones.</p>;

    return (
        <div className="mt-6 space-y-4">
            {posts.map(post => (
                <div key={post.id} className="p-4 border rounded-xl shadow">
                    <p>{post.contenido}</p>
                    <small>{new Date(post.createdAt._seconds * 1000).toLocaleString()}</small>
                </div>
            ))}
        </div>
    );
};

export default UserPosts;
import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import {
  FaBell,
  FaSearch,
  FaPlus,
  FaHeart,
  FaTh,
  FaList,
  FaUsers,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const Header = ({ currentUser }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error al cerrar sesión: ", error);
      });
  };

  return (
    <header className="bg-white shadow p-3 d-flex flex-column flex-md-row justify-content-between align-items-center position-relative" style={{ zIndex: 1100 }}>
      <div className="d-flex align-items-center mb-2 mb-md-0">
        <Link to="/feed" className="fs-4 fw-bold text-dark text-decoration-none me-3 mb-2 mb-md-0">
          SkillHub
        </Link>
        <div className="d-flex align-items-center gap-2">
          <FaSearch className="text-secondary" />
          <input type="text" placeholder="Buscar..." className="form-control" style={{ maxWidth: "250px" }} />
        </div>
      </div>
      <div className="d-flex align-items-center gap-3 position-relative">
        <div className="d-flex align-items-center gap-1">
          <FaUsers className="text-secondary" />
          <span className="d-none d-md-inline">Amigos</span>
        </div>
        <button className="btn btn-light position-relative" onClick={toggleNotifications}>
          <FaBell className="text-secondary fs-4" />
        </button>
        {showNotifications && (
          <div className="position-absolute top-100 end-0 bg-white shadow p-3 rounded" style={{ zIndex: 1500, width: "200px" }}>
            <p className="mb-0">No hay notificaciones</p>
          </div>
        )}
        <div onClick={toggleProfileMenu} style={{ cursor: "pointer" }} className="d-flex align-items-center gap-2">
        <img
          src={currentUser?.photoURL || "https://via.placeholder.com/40"}
          alt="User"
          className="rounded-circle"
          style={{ width: "40px", height: "40px", objectFit: "cover" }}
        />
          <span className="d-none d-md-inline">{currentUser?.displayName || currentUser?.email || "Cuenta"}</span>
        </div>
        {showProfileMenu && (
          <div className="position-absolute top-100 end-0 bg-white shadow p-3 rounded" style={{ zIndex: 1500, width: "200px" }}>
            <p className="mb-0">{currentUser?.displayName || "Usuario"}</p>
            <p className="text-muted">{currentUser?.email}</p>
            <button className="btn btn-primary btn-sm w-100">Ver perfil</button>
            <button className="btn btn-danger btn-sm w-100 mt-2" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </header>
  );
};

const Posts = ({ currentUser }) => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "David Fernández",
      content: "Lorem ipsum dolor sit amet...",
      category: "📄 Post",
      likes: 0,
      comments: [],
      media: "",
      likedBy: [],
    },
    {
      id: 2,
      author: "Daniela Solís",
      content: "🎵 Música increíble",
      category: "🎵 Música",
      likes: 0,
      comments: [],
      media: "",
      likedBy: [],
    },
    {
      id: 3,
      author: "Gabriel Sánchez",
      content: "Lorem ipsum dolor sit amet...",
      category: "📄 Post",
      likes: 0,
      comments: [],
      media: "",
      likedBy: [],
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPost, setNewPost] = useState({
    content: "",
    category: "📄 Post",
    media: null,
  });
  const [viewMode, setViewMode] = useState("list");
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const userId = "user123";

  const handleLike = (id) => {
    setPosts(
      posts.map((post) => {
        if (post.id === id) {
          const hasLiked = post.likedBy.includes(userId);
          if (hasLiked) {
            return {
              ...post,
              likes: post.likes - 1,
              likedBy: post.likedBy.filter((user) => user !== userId),
            };
          } else {
            return {
              ...post,
              likes: post.likes + 1,
              likedBy: [...post.likedBy, userId],
            };
          }
        }
        return post;
      })
    );
  };

  const handleComment = (id, comment) => {
    if (!comment) return;
    setPosts(
      posts.map((post) =>
        post.id === id
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );
  };

  const handleAddPost = () => {
    if (!newPost.content.trim()) return;
    const newEntry = {
      ...newPost,
      id: posts.length + 1,
      author: currentUser?.displayName || currentUser?.email || "Usuario",
      likes: 0,
      comments: [],
      likedBy: [],
    };
    setPosts([newEntry, ...posts]);
    setShowModal(false);
    setNewPost({ content: "", category: "📄 Post", media: null });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, media: URL.createObjectURL(file) });
    }
  };

  const togglePostExpand = (id) => {
    setExpandedPost(expandedPost === id ? null : id);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
      <h2>¡Bienvenid@, {currentUser?.displayName || currentUser?.email || "usuario"}!</h2>
        <div>
          <button className="btn btn-light" onClick={() => setViewMode("list")}>
            <FaList />
          </button>
          <button className="btn btn-light ms-2" onClick={() => setViewMode("grid")}>
            <FaTh />
          </button>
          <button className="btn btn-primary ms-2" onClick={() => setShowModal(true)}>
            <FaPlus /> Agregar
          </button>
        </div>
      </div>
      <div className={`mt-3 ${viewMode === "grid" ? "d-flex flex-wrap gap-3" : ""}`}>
        {posts.map((post) => (
          <div key={post.id} className={`card mb-3 shadow-sm ${viewMode === "grid" ? "p-2" : ""}`}>
            <div
              className="card-body"
              onClick={() => togglePostExpand(post.id)}
              style={{ cursor: "pointer" }}
            >
              <h5 className="d-flex justify-content-between">
                <span>{post.author}</span>
                <span className="badge bg-secondary">{post.category}</span>
              </h5>
              {post.media && (
                <img
                  src={post.media}
                  alt="Adjunto"
                  className="img-fluid rounded mb-2"
                  style={{
                    width: "80%",
                    maxWidth: "300px",
                    height: "auto",
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    cursor: "pointer",
                    display: "block",
                    margin: "0 auto",
                  }}
                  onClick={() => setFullScreenMedia(post.media)}
                />
              )}
              <p>{post.content}</p>
            </div>
            {expandedPost === post.id && (
              <div className="p-3 border-top">
                <button className="btn btn-light" onClick={() => handleLike(post.id)}>
                  <FaHeart className={post.likedBy.includes(userId) ? "text-danger" : ""} />{" "}
                  {post.likes}
                </button>
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Escribe un comentario..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim() !== "") {
                      handleComment(post.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
                {post.comments.length > 0 ? (
                  <div className="mt-2">
                    <h6>Comentarios</h6>
                    <ul className="list-group">
                      {post.comments.map((comment, index) => (
                        <li key={index} className="list-group-item">
                          {comment}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-2 text-muted">No hay comentarios.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {fullScreenMedia && (
        <div className="modal-overlay" onClick={() => setFullScreenMedia(null)}>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-body p-0">
                  <img src={fullScreenMedia} alt="Fullscreen" className="img-fluid w-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Nuevo Post</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Escribe algo..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  ></textarea>
                  <input type="file" className="form-control mt-3" onChange={handleFileUpload} />
                  <div className="mt-3">
                    <button className="btn btn-primary w-100" onClick={handleAddPost}>
                      Publicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header currentUser={currentUser} />
      <main className="flex-grow-1 p-4">
        <Posts currentUser={currentUser} />
      </main>
    </div>
  );
};

export default Feed;


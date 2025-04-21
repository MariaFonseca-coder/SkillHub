import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import {
  FaBell,
  FaSearch,
  FaPlus,
  FaHeart,
  FaTh,
  FaList,
  FaUsers,
  FaShare,
  FaFlag,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import firebase from "firebase/compat/app";

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
      .then(() => navigate("/"))
      .catch((error) => console.error("Error al cerrar sesión: ", error));
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
        <Link to="/GestionContactos" className="btn btn-light d-flex align-items-center gap-1">
          <FaUsers className="text-secondary" />
          <span className="d-none d-md-inline">Amigos</span>
        </Link>

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
          <Link to="/Profile" className="btn btn-primary btn-sm w-100 text-decoration-none text-white">
            Ver perfil
        </Link>
    <button className="btn btn-danger btn-sm w-100 mt-2" onClick={handleLogout}>
      Cerrar sesión
    </button>
  </div>
)}

      </div>
    </header>
  );
};

const Posts = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [shareModal, setShareModal] = useState(false); // Modal para compartir
  const [viewMode, setViewMode] = useState("list");
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPost, setNewPost] = useState({ content: "", category: "📄 Post", privacy: "public" });
  const [shareText, setShareText] = useState(""); // Texto adicional para compartir
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const [postIdToShare, setPostIdToShare] = useState(null); // Estado para guardar el id del post a compartir

  useEffect(() => {
    const unsubscribe = db.collection("posts")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const fetchedPosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPosts(fetchedPosts);
      });
    return unsubscribe;
  }, []);

  const handleAddPost = async () => {
    if (!newPost.content.trim() || !currentUser) return;

    await db.collection("posts").add({
      content: newPost.content,
      category: newPost.category,
      authorId: currentUser.uid,
      author: currentUser.displayName || currentUser.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      likes: [],
      comments: [],
      privacy: newPost.privacy,
      reports: [],
      sharedBy: [],
    });
    setNewPost({ content: "", category: "📄 Post", privacy: "public" });
    setShowModal(false);
  };

  const handleLike = async (postId) => {
    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();
    const likedBy = doc.data().likes || [];

    const alreadyLiked = likedBy.includes(currentUser.uid);
    const newLikes = alreadyLiked
      ? likedBy.filter((id) => id !== currentUser.uid)
      : [...likedBy, currentUser.uid];

    await postRef.update({ likes: newLikes });
  };

  const handleComment = async (postId, comment) => {
    const postRef = db.collection("posts").doc(postId);
    await postRef.update({
      comments: firebase.firestore.FieldValue.arrayUnion({
        text: comment,
        author: currentUser.displayName || currentUser.email,
      }),
    });
  };

  const handleReport = async (postId) => {
    const postRef = db.collection("posts").doc(postId);
    await postRef.update({
      reports: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
    });
    alert("Has reportado esta publicación.");
  };

  const handleShare = (postId) => {
    setPostIdToShare(postId); // Establecer el postId del post que se va a compartir
    setShareModal(true); // Mostrar el modal de compartir
    setShareText(""); // Limpiar el texto adicional
  };

  const handleConfirmShare = async () => {
    try {
      const postRef = db.collection("posts").doc(postIdToShare);
      const postSnapshot = await postRef.get();
      const postData = postSnapshot.data();

      if (!postData) {
        console.error("Post no encontrado.");
        return;
      }

      // Crear un nuevo post como compartido
      await db.collection("posts").add({
        content: postData.content, // El contenido original del post
        category: postData.category,
        authorId: currentUser.uid,
        author: currentUser.displayName || currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [],
        comments: [],
        privacy: postData.privacy, // Mantener la misma privacidad
        reports: [],
        sharedBy: [currentUser.displayName || currentUser.email], // Agregar el nombre del usuario que lo compartió
        sharedFrom: postIdToShare, // Relacionar con el post original
        additionalText: shareText || "", // El texto adicional que el usuario escribió
      });

      alert("¡Has compartido esta publicación dentro de SkillHub!");
      setShareModal(false); // Cerrar el modal de compartir
    } catch (error) {
      console.error("Error al compartir dentro de la app:", error);
      alert("Ocurrió un error al compartir la publicación.");
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
      await db.collection("posts").doc(postId).delete();
    }
  };
  
  const handleEditPost = async (postId) => {
    const newContent = prompt("Edita tu publicación:");
    if (newContent && newContent.trim()) {
      await db.collection("posts").doc(postId).update({
        content: newContent.trim()
      });
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
          <button className="btn btn-light" onClick={() => setViewMode("list") }><FaList /></button>
          <button className="btn btn-light ms-2" onClick={() => setViewMode("grid") }><FaTh /></button>
          <button className="btn btn-primary ms-2" onClick={() => setShowModal(true)}><FaPlus /> Agregar</button>
        </div>
      </div>
  
      <div className={`mt-3 ${viewMode === "grid" ? "d-flex flex-wrap gap-3" : ""}`}>
        {posts.map((post) => (
          (post.privacy === "public" || post.authorId === currentUser?.uid) && (
            <div key={post.id} className={`card mb-3 shadow-sm ${viewMode === "grid" ? "p-2" : ""}`}>
              <div className="card-body" onClick={() => togglePostExpand(post.id)} style={{ cursor: "pointer" }}>
                <h5 className="d-flex justify-content-between">
                  <span>{post.author}</span>
                  <span className="badge bg-secondary">{post.category}</span>
                </h5>
                {post.sharedBy?.length > 0 && (
                  <p className="text-muted"><small>Compartido por: {post.sharedBy.join(", ")}</small></p>
                )}
                <p>{post.content}</p>
                {post.additionalText && (
                  <p className="text-muted"><small>Texto adicional: {post.additionalText}</small></p>
                )}
              </div>
  
              {expandedPost === post.id && (
                <div className="p-3 border-top">
                  <button className="btn btn-light me-2" onClick={() => handleLike(post.id)}>
                    <FaHeart className={post.likes?.includes(currentUser.uid) ? "text-danger" : ""} /> {post.likes?.length || 0}
                  </button>
                  <button className="btn btn-light me-2" onClick={() => handleShare(post.id)}><FaShare /></button>
                  {post.authorId === currentUser.uid && (
                    <>
                      <button className="btn btn-outline-warning btn-sm me-2" onClick={() => handleEditPost(post.id)}>Editar</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeletePost(post.id)}>Eliminar</button>
                    </>
                  )}
                  {post.authorId !== currentUser.uid && (
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleReport(post.id)}><FaFlag /> Reportar</button>
                  )}
  
                  <input type="text" className="form-control mt-2" placeholder="Escribe un comentario..." onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      handleComment(post.id, e.target.value);
                      e.target.value = "";
                    }
                  }} />
  
                  {post.comments?.length > 0 && (
                    <ul className="list-group mt-3">
                      {post.comments.map((c, i) => (
                        <li key={i} className="list-group-item"><strong>{c.author}:</strong> {c.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        ))}
      </div>
      {/* Modal para agregar un post */}
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
                    placeholder="Escribe tu post..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  />
                  <div className="mt-2">
                    <select
                      className="form-control"
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    >
                      <option value="📄 Post">📄 Post</option>
                      <option value="📸 Imagen">📸 Imagen</option>
                      <option value="🎥 Video">🎥 Video</option>
                    </select>
                  </div>
                  <div className="mt-2">
                    <select
                      className="form-control"
                      value={newPost.privacy}
                      onChange={(e) => setNewPost({ ...newPost, privacy: e.target.value })}
                    >
                      <option value="public">Público</option>
                      <option value="private">Privado</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                  <button type="button" className="btn btn-primary" onClick={handleAddPost}>Agregar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de compartir */}
      {shareModal && (
        <div className="modal-overlay">
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Compartir publicación</h5>
                  <button type="button" className="btn-close" onClick={() => setShareModal(false)}></button>
                </div>
                <div className="modal-body">
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Escribe algo..."
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShareModal(false)}>Cerrar</button>
                  <button type="button" className="btn btn-primary" onClick={handleConfirmShare}>Compartir</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default function Feed() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setCurrentUser);
    return unsubscribe;
  }, []);

  if (!currentUser) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <Header currentUser={currentUser} />
      <Posts currentUser={currentUser} />
    </>
  );
}

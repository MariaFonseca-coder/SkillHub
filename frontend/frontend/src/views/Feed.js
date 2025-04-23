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
import { auth, db, storage } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";
import { useLocation } from "react-router-dom";


const Header = ({ currentUser, searchTerm, setSearchTerm }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);


  useEffect(() => {
    if (!currentUser) return;
  
    const q = query(
      collection(db, "notifications"),
      where("UserId", "==", currentUser.uid),
      orderBy("notificationDate", "desc")
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((n) => !n.readed);
    
      setNotifications(fetched);
    });
       
    
    return unsubscribe;
  }, [currentUser]);
  
  const navigate = useNavigate();

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
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
          <input
            type="text"
            placeholder="Buscar..."
            className="form-control"
            style={{ maxWidth: "250px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="d-flex align-items-center gap-3 position-relative">
        <Link to="/GestionContactos" className="btn btn-light d-flex align-items-center gap-1">
          <FaUsers className="text-secondary" />
          <span className="d-none d-md-inline">Amigos</span>
        </Link>

        <button className="btn btn-light position-relative" onClick={toggleNotifications} aria-label="Mostrar notificaciones">
          <FaBell className="text-secondary fs-4" />
          {notifications.some(n => !n.readed) && (
            <span
              className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
              style={{ width: "10px", height: "10px" }}
            ></span>
          )}
        </button>

        {showNotifications && (
          <div className="position-absolute top-100 end-0 bg-white shadow p-3 rounded" style={{ zIndex: 1500, width: "300px", maxHeight: "300px", overflowY: "auto" }}>
            <h6 className="fw-bold mb-2">Notificaciones</h6>
            {notifications.length === 0 ? (
              <p className="mb-0 text-muted">No hay notificaciones</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`mb-2 small ${n.readed ? "text-muted" : "fw-bold"}`}
                    style={{ cursor: "pointer" }}
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, "notifications", n.id), { readed: true });
                        navigate(`/feed?post=${n.postId}`);
                    
                        setTimeout(() => {
                          setNotifications((prev) => prev.filter((notif) => notif.id !== n.id));
                          setShowNotifications(false);
                        }, 500);
                      } catch (error) {
                        console.error("Error al manejar la notificación:", error);
                      }
                    }}
                                        
                  >
                    {n.message}
                    <br />
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {new Date(n.notificationDate.seconds * 1000).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
            <p className="mb-0 fw-bold">{currentUser?.displayName || "Usuario"}</p>
            <p className="text-muted small">{currentUser?.email}</p>
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

const Posts = ({ currentUser, searchTerm }) => {
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPost, setNewPost] = useState({ content: "", mediaUrl: "", category: "📄 Post", privacy: "public" });
  const [shareText, setShareText] = useState("");
  const [postIdToShare, setPostIdToShare] = useState(null);
  const [reportModalPostId, setReportModalPostId] = useState(null);
  const [reportModalCommentId, setReportModalCommentId] = useState(null);
  const [reportCommentDescription, setReportCommentDescription] = useState("");
  const [reportCommentError, setReportCommentError] = useState("");
  const [reportCommentSuccess, setReportCommentSuccess] = useState("");
  const [reportDescription, setReportDescription] = useState("");  
  const [uploading, setUploading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [mediaValid, setMediaValid] = useState(true);
  

  useEffect(() => {
    if (newPost.mediaUrl && isImageUrl(newPost.mediaUrl)) {
      const img = new Image();
      img.onload = () => setMediaValid(true);
      img.onerror = () => setMediaValid(false);
      img.src = newPost.mediaUrl;
    } else {
      setMediaValid(true); // en caso de que no sea imagen
    }
  }, [newPost.mediaUrl]);
  
  const validateImageUrl = (url) => {
    const img = new Image();
    img.onload = () => setMediaValid(true);
    img.onerror = () => setMediaValid(false);
    img.src = url;
  };
  
  useEffect(() => {
    if (newPost.mediaUrl && isImageUrl(newPost.mediaUrl)) {
      validateImageUrl(newPost.mediaUrl);
    }
  }, [newPost.mediaUrl]);
  

  useEffect(() => {
    if (!expandedPost) return;
    const q = query(collection(db, "posts", expandedPost, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPostComments(comments);
    });
  
    return unsubscribe;
  }, [expandedPost]);
  
  const filteredPosts = posts.filter((post) => {
    const content = post.content?.toLowerCase() || "";
    const additional = post.additionalText?.toLowerCase() || "";
    const query = searchTerm.toLowerCase();
    return content.includes(query) || additional.includes(query);
  });

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("status", "==", "enabled"),
      orderBy("createdAt", "desc")
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(fetchedPosts);
    });
  
    return unsubscribe;
  }, []);  

  const location = useLocation();
    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const postIdFromUrl = params.get("post");
      if (postIdFromUrl) {
        setExpandedPost(postIdFromUrl);
      }
    }, [location]);

    const isImageUrl = (url) => {
      return /^https?:\/\/.+\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/i.test(url);
    };
    
    const isVideoUrl = (url) => {
      return /^https?:\/\/.+\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
    };
    
    const isYouTubeUrl = (url) => {
      return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);
    };
    
    const extractYouTubeId = (url) => {
      const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([\w-]{11})/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    };
    
    const handleAddPost = async () => {
      if (!newPost.content.trim() || !currentUser) {
        alert("Debés escribir algo y estar logueado para publicar.");
        return;
      }
    
      let mediaUrl = null;
    
      if (newPost.file) {
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/ogg"];
        if (!validTypes.includes(newPost.file.type)) {
          alert("Formato de archivo no permitido. Solo se permiten imágenes y videos MP4/WebM/Ogg.");
          return;
        }
    
        const formData = new FormData();
        formData.append("file", newPost.file);
    
        try {
          const response = await fetch("http://localhost:8000/api/upload/", {
            method: "POST",
            body: formData,
          });
    
          const data = await response.json();
          if (data.url) {
            mediaUrl = data.url;
            const ext = mediaUrl.split(".").pop().toLowerCase();
            const validExtensions = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "ogg"];
            if (!validExtensions.includes(ext)) {
              alert("El archivo se subió pero no tiene una extensión válida para mostrarse.");
              return;
            }
          } else {
            alert("Error al subir el archivo");
            return;
          }
        } catch (error) {
          console.error("Error al subir desde backend:", error);
          alert("Hubo un problema subiendo el archivo");
          return;
        }
      }
    
      const finalMediaUrl = mediaUrl || newPost.mediaUrl || null;
    
      if (
        finalMediaUrl &&
        !isImageUrl(finalMediaUrl) &&
        !isVideoUrl(finalMediaUrl) &&
        !isYouTubeUrl(finalMediaUrl)
      ) {
        alert("El archivo subido no es una imagen, video válido ni un enlace de YouTube.");
        return;
      }
    
      try {
        await addDoc(collection(db, "posts"), {
          content: newPost.content,
          mediaUrl: finalMediaUrl,
          category: newPost.category,
          privacy: newPost.privacy,
          authorId: currentUser.uid,
          author: currentUser.displayName || currentUser.email,
          createdAt: serverTimestamp(),
          likes: [],
          comments: [],
          reports: [],
          status: "enabled"
        });
    
        setNewPost({ content: "", category: "📄 Post", privacy: "public", file: null, mediaUrl: "" });
        setShowModal(false);
      } catch (error) {
        console.error("Error al guardar el post:", error);
        alert("No se pudo guardar el post. Intentalo de nuevo.");
      }
    }; 
  
  const handleLike = async (postId) => {
    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    const likedBy = postDoc.data().likes || [];

    const alreadyLiked = likedBy.includes(currentUser.uid);
    const newLikes = alreadyLiked
      ? likedBy.filter((id) => id !== currentUser.uid)
      : [...likedBy, currentUser.uid];

    await postRef.update({ likes: newLikes });
    const postSnapshot = await postRef.get();

    if (!alreadyLiked && postSnapshot.exists && postSnapshot.data().authorId !== currentUser.uid) {
      const authorId = postSnapshot.data().authorId;

      const existing = await getDocs(
        query(
          collection(db, "notifications"),
          where("UserId", "==", doc(db, "users", authorId)),
          where("type", "==", "like"),
          where("readed", "==", false),
          where("postId", "==", postId)
        )
      );

      if (!existing.empty) {
        const notifRef = existing.docs[0].ref;
        await updateDoc(notifRef, {
          message: `${currentUser.displayName || "Alguien"} y otr@s le dieron like a tu publicación.`,
          notificationDate: new Date()
        });
      } else {
        await addDoc(collection(db, "notifications"), {
          UserId: authorId,
          message: `${currentUser.displayName || "Alguien"} le dio like a tu publicación.`,
          notificationDate: new Date(),
          readed: false,
          type: "like",
          postId: postId
        });        
      }
    }
        
  };

  const handleComment = async (postId, comment) => {
    const postRef = db.collection("posts").doc(postId);
    await addDoc(collection(db, "posts", postId, "comments"), {
      text: comment,
      author: currentUser.displayName || currentUser.email,
      authorId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    
  
    const postSnapshot = await postRef.get();
    const postAuthorId = postSnapshot.data().authorId;
  
    if (postAuthorId !== currentUser.uid) {
      const userRef = doc(db, "users", postAuthorId);
  
      const existing = await getDocs(
        query(
          collection(db, "notifications"),
          where("UserId", "==", userRef),
          where("type", "==", "comment"),
          where("readed", "==", false),
          where("postId", "==", postId)
        )
      );
  
      if (!existing.empty) {
        const notifRef = existing.docs[0].ref;
        await updateDoc(notifRef, {
          message: `${currentUser.displayName || "Alguien"} y otr@s comentaron tu publicación.`,
          notificationDate: new Date()
        });
      } else {
        console.log("Creando notificación de comentario con:", {
          UserId: doc(db, "users", postAuthorId),
          message: `${currentUser.displayName || "Alguien"} comentó tu publicación.`,
          notificationDate: new Date(),
          readed: false,
          type: "comment",
          postId: postId
        });
        
        await addDoc(collection(db, "notifications"), {
          UserId: postAuthorId,
          message: `${currentUser.displayName || "Alguien"} comentó tu publicación.`,
          notificationDate: new Date(),
          readed: false,
          type: "comment",
          postId: postId
        });             
      }
    }
  };
  
  
  const submitReport = async () => {
    if (!reportDescription.trim()) {
      setReportError("La descripción no puede estar vacía.");
      return;
    }
  
    try {
      const postRef = doc(db, "posts", reportModalPostId);
      const postSnapshot = await getDoc(postRef);
      const postData = postSnapshot.data();
  
      if (!postSnapshot.exists()) {
        throw new Error("El post ya no existe.");
      }
  
      await addDoc(collection(db, "reports"), {
        description: reportDescription,
        postReported: postRef,
        reportDate: new Date(),
        state: "pending",
        type: postData.category || "Post",
        userReported: doc(db, "users", currentUser.uid),
      });
  
      setReportModalPostId(null);
      setReportDescription("");
      setReportError("");
      setReportSuccess("Reporte enviado con éxito.");
  
      setTimeout(() => setReportSuccess(""), 3000);
    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      setReportError("Ocurrió un error al enviar el reporte.");
    }
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

    // Crear un nuevo post como compartido con data anidada
    await db.collection("posts").add({
      content: shareText || "", // solo el comentario del que comparte
      category: "📄 Post",
      authorId: currentUser.uid,
      author: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
      likes: [],
      comments: [],
      privacy: postData.privacy,
      reports: [],
      sharedFrom: postIdToShare,
      originalPost: {
        content: postData.content,
        author: postData.author,
        mediaUrl: postData.mediaUrl || null,
        category: postData.category,
        additionalText: postData.additionalText || "",
        createdAt: postData.createdAt,
      }
    });

    // Crear notificación al autor original
    if (postData.authorId !== currentUser.uid) {
      const userRef = doc(db, "users", postData.authorId);
      const existing = await getDocs(
        query(
          collection(db, "notifications"),
          where("UserId", "==", userRef),
          where("type", "==", "share"),
          where("readed", "==", false),
          where("postId", "==", postIdToShare)
        )
      );

      if (!existing.empty) {
        const notifRef = existing.docs[0].ref;
        await updateDoc(notifRef, {
          message: `${currentUser.displayName || "Alguien"} y otr@s compartieron tu publicación.`,
          notificationDate: new Date()
        });
      } else {
        await addDoc(collection(db, "notifications"), {
          UserId: postData.authorId,
          message: `${currentUser.displayName || "Alguien"} compartió tu publicación.`,
          notificationDate: new Date(),
          readed: false,
          type: "share",
          postId: postIdToShare
        });        
      }
    }

    alert("¡Has compartido esta publicación dentro de SkillHub!");
    setShareModal(false);
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
  
  const startEditingPost = (post) => {
    setNewPost({
      content: post.content,
      category: post.category,
      privacy: post.privacy,
      file: null,
    });
    setEditingPostId(post.id);
    setShowModal(true);
  };
  
  const confirmEditPost = async () => {
    if (!editingPostId || !newPost.content.trim()) return;
  
    const updatedFields = {
      content: newPost.content,
      category: newPost.category,
      privacy: newPost.privacy,
      updatedAt: serverTimestamp(),
    };
  
    if (newPost.file) {
      try {
        setUploading(true);
        const cleanName = newPost.file.name.replace(/\s+/g, "_");
        const filePath = `posts/${Date.now()}_${cleanName}`;
        const fileRef = ref(storage, filePath);
  
        await uploadBytes(fileRef, newPost.file);
        const mediaUrl = await getDownloadURL(fileRef);
        updatedFields.mediaUrl = mediaUrl;
  
        setUploading(false);
      } catch (error) {
        console.error("Error subiendo archivo:", error);
        setUploading(false);
        alert("No se pudo subir el archivo.");
        return;
      }
    }
  
    try {
      await updateDoc(doc(db, "posts", editingPostId), updatedFields);
      setEditingPostId(null);
      setShowModal(false);
      setNewPost({ content: "", category: "📄 Post", privacy: "public", file: null });
    } catch (error) {
      console.error("Error al actualizar post:", error);
      alert("No se pudo actualizar el post.");
    }
  };    

  const togglePostExpand = (id) => {
    setExpandedPost(expandedPost === id ? null : id);
  };

  const startEditingComment = async (postId, comment) => {
    const newText = prompt("Editar comentario", comment.text);
    if (newText && newText.trim()) {
      await updateDoc(doc(db, "posts", postId, "comments", comment.id), {
        text: newText,
        updatedAt: serverTimestamp()
      });
    }
  };
  
  const deleteComment = async (postId, commentId) => {
    if (window.confirm("¿Eliminar este comentario?")) {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    }
  };
  
  const reportComment = (postId, comment) => {
    if (comment.authorId === currentUser.uid) return;
    setReportModalPostId(postId);
    setReportModalCommentId(comment.id);
    setReportCommentDescription("");
    setReportCommentError("");
  };
  
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>¡Bienvenid@, {currentUser?.displayName || currentUser?.email || "usuario"}!</h2>
        <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0 justify-content-end">
          <button className="btn btn-light" onClick={() => setViewMode("list")}><FaList /></button>
          <button className="btn btn-light" onClick={() => setViewMode("grid")}><FaTh /></button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><FaPlus /> Agregar</button>
        </div>
      </div>
  
      <div className={`mt-3 ${viewMode === "grid" ? "d-flex flex-wrap gap-3" : ""}`}>
        
      {filteredPosts.map((post) => (
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

                {post.mediaUrl && (
                isYouTubeUrl(post.mediaUrl) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(post.mediaUrl)}`}
                    width="100%"
                    height="315"
                    frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube video"
                    className="rounded mb-2"
                  ></iframe>
                ) : isVideoUrl(post.mediaUrl) ? (
                  <video controls className="w-100 mt-2 rounded">
                    <source src={post.mediaUrl} type="video/mp4" />
                    Tu navegador no soporta el video.
                  </video>
                ) : isImageUrl(post.mediaUrl) ? (
                  <img src={post.mediaUrl} alt="media" className="img-fluid mt-2 rounded" />
                ) : (
                  <p className="text-muted small">No se puede mostrar el archivo. Verificá que el enlace sea válido.</p>
                )
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
                      <button className="btn btn-outline-warning btn-sm me-2" onClick={() => startEditingPost(post)}>Editar</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeletePost(post.id)}>Eliminar</button>
                    </>
                  )}
                  {post.authorId !== currentUser.uid && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        setReportModalPostId(post.id);
                        setReportDescription("");
                      }}
                    >
                      <FaFlag /> Reportar
                    </button>
                  )}
                  <input type="text" className="form-control mt-2" placeholder="Escribe un comentario..." onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      handleComment(post.id, e.target.value);
                      e.target.value = "";
                    }
                  }} />
                    <ul className="list-group mt-3">
                    {postComments.map((comment) => (
                      <li key={comment.id} className="list-group-item d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{comment.author}:</strong> {comment.text}
                        </div>
                        <div className="btn-group btn-group-sm">
                          {comment.authorId === currentUser.uid && (
                            <>
                              <button className="btn btn-outline-warning" onClick={() => startEditingComment(post.id, comment)}>Editar</button>
                              <button className="btn btn-outline-danger" onClick={() => deleteComment(post.id, comment.id)}>Eliminar</button>
                            </>
                          )}
                          {comment.authorId !== currentUser.uid && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => reportComment(post.id, comment)}
                            >
                              Reportar
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        ))}
      </div>
      {/* Modal para agregar un post */}
      {showModal && (
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editingPostId ? "Editar Post" : "Nuevo Post"}</h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Contenido:</label>
                <textarea
                  className="form-control"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Categoría:</label>
                <select
                  className="form-select"
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                >
                  <option value="📄 Post">📄 Post</option>
                  <option value="🎥 Video">🎥 Video</option>
                  <option value="📷 Imagen">📷 Imagen</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Privacidad:</label>
                <select
                  className="form-select"
                  value={newPost.privacy}
                  onChange={(e) => setNewPost({ ...newPost, privacy: e.target.value })}
                >
                  <option value="public">Público</option>
                  <option value="private">Privado</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">URL del archivo (imagen o video)</label>
                <input
                  type="text"
                  className="form-control"
                  value={newPost.mediaUrl || ""}
                  onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {newPost.mediaUrl && (
                <div className="mb-3">
                  <label className="form-label">Vista previa:</label>
                  {isVideoUrl(newPost.mediaUrl) ? (
                    <video controls className="w-100">
                      <source src={newPost.mediaUrl} />
                    </video>
                  ) : isImageUrl(newPost.mediaUrl) ? (
                    mediaValid ? (
                      <img
                        src={newPost.mediaUrl}
                        alt="vista previa"
                        className="img-fluid rounded"
                        style={{ maxHeight: "200px" }}
                      />
                    ) : (
                      <p className="text-danger small">No se puede cargar la imagen. Verificá el enlace.</p>
                    )
                  ) : (
                    <p className="text-muted small">El enlace no es una imagen ni un video válido.</p>
                  )}
                </div>
              )}

              {/* Spinner de subida */}
              {uploading && (
                <div className="mb-3 text-primary">
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Subiendo archivo...
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={editingPostId ? confirmEditPost : handleAddPost}
                disabled={uploading || !mediaValid}
              >
                {editingPostId ? "Guardar cambios" : "Publicar"}
              </button>
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
      {reportModalPostId && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)", // fondo oscuro
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1050,
          }}
        >
          <div className="modal-dialog modal-dialog-centered w-100" style={{ maxWidth: "500px" }}>
            <div className="modal-content shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Reportar publicación</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setReportModalPostId(null);
                    setReportDescription("");
                    setReportError("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <label htmlFor="reportTextarea" className="form-label">
                  Describe el problema:
                </label>
                <textarea
                  id="reportTextarea"
                  className={`form-control ${reportError ? "is-invalid" : ""}`}
                  value={reportDescription}
                  onChange={(e) => {
                    setReportDescription(e.target.value);
                    setReportError("");
                  }}
                  rows="4"
                  placeholder="Ej. Esta publicación contiene contenido inapropiado..."
                />
                {reportError && <div className="invalid-feedback">{reportError}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setReportModalPostId(null)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={submitReport}>
                  Enviar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {reportModalCommentId && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1050,
          }}
        >
          <div className="modal-dialog modal-dialog-centered w-100" style={{ maxWidth: "500px" }}>
            <div className="modal-content shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Reportar comentario</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setReportModalCommentId(null);
                    setReportCommentDescription("");
                    setReportCommentError("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <label htmlFor="reportCommentTextarea" className="form-label">
                  Describe el problema:
                </label>
                <textarea
                  id="reportCommentTextarea"
                  className={`form-control ${reportCommentError ? "is-invalid" : ""}`}
                  value={reportCommentDescription}
                  onChange={(e) => {
                    setReportCommentDescription(e.target.value);
                    setReportCommentError("");
                  }}
                  rows="4"
                  placeholder="Ej. Este comentario es ofensivo..."
                />
                {reportCommentError && <div className="invalid-feedback">{reportCommentError}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setReportModalCommentId(null)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    if (!reportCommentDescription.trim()) {
                      setReportCommentError("La descripción no puede estar vacía.");
                      return;
                    }

                    try {
                      await addDoc(collection(db, "reports"), {
                        type: "Comment",
                        description: reportCommentDescription,
                        commentReported: doc(db, "posts", reportModalPostId, "comments", reportModalCommentId),
                        postReported: doc(db, "posts", reportModalPostId),
                        userReported: doc(db, "users", currentUser.uid),
                        reportDate: new Date(),
                        state: "pending"
                      });

                      setReportModalCommentId(null);
                      setReportCommentDescription("");
                      setReportCommentError("");
                      setReportCommentSuccess("Reporte enviado con éxito.");
                      setTimeout(() => setReportCommentSuccess(""), 3000);
                    } catch (error) {
                      console.error("Error al enviar el reporte:", error);
                      setReportCommentError("Ocurrió un error al enviar el reporte.");
                    }
                  }}
                >
                  Enviar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  ); 
}

export default function Feed() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setCurrentUser);
    return unsubscribe;
  }, []);

  if (!currentUser) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  return (
    <>
      <Header currentUser={currentUser} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <Posts currentUser={currentUser} searchTerm={searchTerm} />
    </>
  );
}
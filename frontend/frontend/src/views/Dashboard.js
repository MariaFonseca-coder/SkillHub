import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [postStatuses, setPostStatuses] = useState({});


  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/list-users/');
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de usuarios');
      }
      const data = await response.json();
      setUsers(data.users); // Asegúrate que el backend devuelve {"users": [...]}
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };


  const fetchPostStatus = async (postId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/get-post-status/${postId}/`);
      const data = await response.json();
  
      if (response.ok) {
        setPostStatuses(prev => ({
          ...prev,
          [postId]: data.status
        }));
      }
    } catch (error) {
      console.error("Error fetching post status:", error);
    }
  };
  
  const handleToggleAccountStatus = async (userId, currentStatus) => {
    const url =
      currentStatus === 'enabled'
        ? 'http://127.0.0.1:8000/api/disable-user/'
        : 'http://127.0.0.1:8000/api/enable-user/';
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
  
      if (!response.ok) {
        throw new Error('Error al cambiar el estado del usuario');
      }
  
      const result = await response.json();
      console.log(result.message);
  
      // Actualizar la lista de usuarios después del cambio
      fetchUsers();
    } catch (error) {
      console.error('Error al actualizar el estado del usuario:', error);
    }
  };

  const fetchUserStatuses = async () => {
    const userIds = reports
      .filter((report) => report.type === "user")
      .map((report) => report.userReported.split("/").pop());
  
    const statuses = {};
  
    for (const userId of userIds) {
      try {
        const response = await fetch(`http://localhost:8000/api/get-user-status/${userId}/`);
        const data = await response.json();
  
        if (response.ok) {
          statuses[userId] = data.status;
        } else {
          console.error(`Error obteniendo estado de usuario ${userId}:`, data.error);
        }
      } catch (error) {
        console.error(`Error con userId ${userId}:`, error);
      }
    }
  
    setUserStatuses(statuses);
  };
  
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/list-reports/');
      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  useEffect(() => {
    reports
      .filter((r) => r.state === "pending" && r.type === "post")
      .forEach((r) => {
        if (!postStatuses[r.postReported]) {
          fetchPostStatus(r.postReported);
        }
      });
  }, [reports]);

  useEffect(() => {
    if (reports.length > 0) {
      fetchUserStatuses();
    }
  }, [reports]);
  

  const denyReport = async (reportId) => {
    console.log(reportId);
    try {
      const response = await fetch(`http://localhost:8000/api/deny-report/${reportId}/`, {
        method: 'POST',
      });
  
      const data = await response.json();
      if (response.ok) {
        fetchReports();
        
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error denying report:", error);
    }
  };

  const deleteReportedPost = async (postId) => {
    const currentStatus = postStatuses[postId];
    const newStatus = currentStatus === "disabled" ? "enabled" : "disabled";

    try {
      const response = await fetch(`http://localhost:8000/api/delete-post/${postId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setPostStatuses((prev) => ({
          ...prev,
          [postId]: newStatus
        }));
        fetchReports(); // Si querés refrescar la lista
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error updating post status:", error);
    }
  };
  
  const disableReportedUser = async (userId) => {
    try {
      console.log("Toggling status for user with ID:", userId);
  
      // 1. Consultar el estado actual del usuario
      const statusResponse = await fetch(`http://localhost:8000/api/get-user-status/${userId}/`);
      const statusData = await statusResponse.json();
  
      if (!statusResponse.ok) {
        console.error("Error obteniendo estado del usuario:", statusData.error);
        return;
      }
  
      const currentStatus = statusData.status;
      const isCurrentlyDisabled = currentStatus === "disabled";
  
      // Determinar endpoint a llamar
      const endpoint = isCurrentlyDisabled
        ? "enable-user"
        : "disable-user";
  
      // 2. Llamar al endpoint correcto
      const response = await fetch(`http://localhost:8000/api/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        const newStatus = isCurrentlyDisabled ? "enabled" : "disabled";
        alert(`Usuario actualizado a estado: ${newStatus}`);
        setUserStatuses(prevStatuses => ({
          ...prevStatuses,
          [userId]: newStatus
        }));
        fetchReports(); 
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error actualizando estado del usuario:", error);
    }
  };
  


  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <h1>Administration panel</h1>
        <p>Manage users and reports made by users</p>

        <div className="dashboard-toggle">
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            All users
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Post reports
          </button>
          <button
            className={activeTab === 'reportsUsers' ? 'active' : ''}
            onClick={() => setActiveTab('reportsUsers')}
          >
            User reports
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'users' ? (
            //VISTA PARA GESTIONAR USUARIOS
            <div className="friends-list">
              {users.length > 0 ? (
                users
                .filter((user) => user.role !== 'admin')
                .map((user) => (
                  <div key={user.id} className="friend-card">
                    <img
                      src={user.fotoPerfil || 'https://via.placeholder.com/96'}
                      alt={`Foto de ${user.name}`}
                      className="friend-photo"
                    />
                    <div className="friend-info">
                      <span className="friend-name">{user.name}</span>
                      <span className="friend-role"><strong>Role:</strong> {user.role}</span>
                      <span className="friend-role"><strong>Status:</strong> {user.status}</span>

                    </div>
                    <button
                      className={`delete-btn ${user.status === 'enabled' ? 'disable' : 'enable'}`}
                      onClick={() => handleToggleAccountStatus(user.id, user.status)}
                    >
                      {user.status === 'enabled' ? 'Disable Account' : 'Enable Account'}
                    </button>
                  </div>
                ))
              ) : (
                <p>No hay usuarios disponibles</p>
              )}
            </div>
          ) : activeTab === 'reports' ?  (
            // VISTA PARA GESTIONAR REPORTES DE POST
            <div className="reports-list">
              <p>Reported posts</p>
              {reports.length > 0 ? (
                reports
                  .filter((report) => report.state === "pending" && report.type === "post" )
                  .map((report) => (
                    <div key={report.id} className="report-card">
                      <div className="report-info"> 
                        <p><strong>Description:</strong> {report.description}</p>
                        <p><strong>State:</strong> {report.state}</p>
                        <p><strong>Reported Post:</strong> {console.log("POST REPORTADO:", report.postReported)} {report.postReported}</p>

                        <p><strong>Report Date:</strong> {new Date(report.reportDate).toLocaleString()}</p>
                        <p><strong>Reported user:</strong> {report.userReportedName}</p>
                      </div>
                      <div className="report-actions">
                        <button
                          className="delete-btn"
                          onClick={() => deleteReportedPost(report.postReported)} // Aquí pasamos el postReported
                        >
                          {postStatuses[report.postReported] === "disabled" ? "Enable post" : "Disable post"}

                        </button>
                        
                        <button
                          className="delete-btn"
                          onClick={() => denyReport(report.id)}

                        >
                          Remove report
                        </button>
                      </div>
                    </div>  
                  ))
              ) : (
                <p>No pending reports</p>
              )}
            </div>
          ) : activeTab === 'reportsUsers' ? (
             // VISTA PARA GESTIONAR REPORTES DE USUARIOS
            
            <div className="reports-list">
              <p>Reported user profiles</p>
              {reports.length > 0 ? (
                reports
                  .filter((report) => report.state === "pending" && report.type === "user" )
                  .map((report) => (
                    <div key={report.id} className="report-card">
                      <div className="report-info">
                        <p><strong>Description:</strong> {report.description}</p>
                        <p><strong>State:</strong> {report.state}</p>
                        <p><strong>Report Date:</strong> {new Date(report.reportDate).toLocaleString()}</p>
                        <p><strong>Reported user:</strong> {report.userReportedName}</p>
                      </div>
                      <div className="report-actions">
                      <button
                        className="delete-btn"
                        onClick={() => disableReportedUser(report.userReported.split("/").pop())}
                      >
                        {userStatuses[report.userReported.split("/").pop()] === "disabled" ? "Enable account" : "Disable account"}
                      </button>
                        <button
                          className="delete-btn"
                          onClick={() => denyReport(report.id)}

                        >
                          Remove report
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <p>No pending reports</p>
              )}
            </div>
          ) : null}
        </div>

        <button onClick={handleLogout} className="main-button">Log out</button>
      </div>
    </div>
  );
};


export default Dashboard;

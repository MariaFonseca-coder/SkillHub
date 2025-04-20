import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);

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

  const handleDisableAccount = (userId) => {
    console.log('Desactivar usuario con ID:', userId);
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
            Users
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Reports
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
                      alt={`Foto de ${user.displayName}`}
                      className="friend-photo"
                    />
                    <div className="friend-info">
                      <span className="friend-name">{user.displayName}</span>
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
          ) : (
            // VISTA PARA GESTIONAR REPORTES
            <div className="reports-list">
              {reports.length > 0 ? (
                reports
                  .filter((report) => report.state === "pending")
                  .map((report) => (
                    <div key={report.id} className="report-card">
                      <div className="report-info">
                        <p><strong>Description:</strong> {report.description}</p>
                        <p><strong>State:</strong> {report.state}</p>
                        <p><strong>Reported Post:</strong> {report.postReported}</p>
                        <p><strong>Report Date:</strong> {new Date(report.reportDate).toLocaleString()}</p>
                        <p><strong>User Reported:</strong> {report.userReportedName}</p>
                      </div>
                      <div className="report-actions">
                        <button
                          className="delete-btn"
                          
                        >
                          Delete Post
                        </button>
                        <button
                          className="delete-btn"
                          
                        >
                          Disable Account
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <p>No pending reports</p>
              )}
            </div>
          )
          }
        </div>

        <button onClick={handleLogout} className="main-button">Log out</button>
      </div>
    </div>
  );
};


export default Dashboard;

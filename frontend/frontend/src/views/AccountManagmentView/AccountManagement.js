import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';  
import '../../styles/AccountM/accountManagement.css'

const AccountManagement = () => {
    const [profileData, setProfileData] = useState(null);
    const [newData, setNewData] = useState({ name: '', biografia: '', privacidad: 'public', fotoPerfil: '' }); 
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({ name: '', biografia: '' }); // Errores específicos para cada campo
    const [success, setSuccess] = useState(null);

    const token = localStorage.getItem('firebaseToken');
    const navigate = useNavigate();

    // Cargar los datos del perfil al inicio
    useEffect(() => {
        if (token) {
            axios.get('http://localhost:8000/api/profile', { 
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
                setProfileData(response.data);
                setNewData({ 
                    name: response.data.name, 
                    biografia: response.data.biografia, 
                    privacidad: response.data.privacidad || 'public',
                    fotoPerfil: response.data.fotoPerfil || '' // <-- nuevo campo cargado
                });
                setLoading(false);
            })
            .catch(error => {
                setErrors({ name: 'Error al obtener el perfil', biografia: '' });
                setLoading(false);
            });
        } else {
            setErrors({ name: 'No se ha encontrado el token', biografia: '' });
            setLoading(false);
        }
    }, [token]);

    // Estado para saber si hay cambios no guardados
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Verificar si hay cambios sin guardar
    useEffect(() => {
        if (profileData && JSON.stringify(profileData) !== JSON.stringify(newData)) {
            setHasUnsavedChanges(true);
        } else {
            setHasUnsavedChanges(false);
        }
    }, [newData, profileData]);

    // Manejo de cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewData({ ...newData, [name]: value });

        // Limpiar el error del campo cuando el usuario comience a escribir
        if (name === 'name' || name === 'biografia') {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Función para guardar los cambios
    const handleSave = (e) => {
        e.preventDefault();

        // Validar los campos
        let isValid = true;
        let tempErrors = { name: '', biografia: '' };

        if (!newData.name) {
            tempErrors.name = 'Name is required';
            isValid = false;
        }

        if (!newData.biografia) {
            tempErrors.biografia = 'Biography is required';
            isValid = false;
        }

        if (!isValid) {
            setErrors(tempErrors);
            return;
        }

        // Si todo está bien, hace el PUT
        axios.put('http://localhost:8000/api/profile/account-managment/', newData, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setProfileData(response.data);
            setSuccess('Profile updated successfully');
            setTimeout(() => navigate('/profile'), 2000);  // Redirige después de 2 segundos
        })
        .catch(error => {
            setErrors({ name: error.response?.data?.error || 'Error updating profile', biografia: '' });
        });
    };

    // Pregunta si desea salir sin guardar cambios
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (hasUnsavedChanges) {
                const message = "You have unsaved changes. Are you sure you want to leave?";
                event.returnValue = message; 
                return message; 
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    // Mostrar mensaje de carga o error
    if (loading) return <div className="am_loading-message">Loading...</div>;
    if (success) return <div className="am_success-message">{success}</div>;

    // Manejar la navegación interna para evitar la salida sin guardar
    const handleNavigate = (path) => {
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm("You have unsaved changes. Do you want to leave without saving?");
            if (confirmLeave) {
                navigate(path);
            }
        } else {
            navigate(path);
        }
    };

    return (
        <div className="am_account-management-container">
            <h1 className="am_account-management-title">Edit Profile</h1>
            <form onSubmit={handleSave}>
                <div className="am_account-management-form-group">
                    <label className="am_account-management-form-label">Name</label>
                    <input 
                        className="am_account-management-form-input"
                        type="text" 
                        name="name" 
                        value={newData.name} 
                        onChange={handleChange} 
                    />
                    {errors.name && <div className="am_account-management-error-message">{errors.name}</div>}
                </div>

                <div className="am_account-management-form-group">
                    <label className="am_account-management-form-label">Biography</label>
                    <textarea 
                        className="am_account-management-form-input"
                        name="biografia" 
                        value={newData.biografia} 
                        onChange={handleChange} 
                    />
                    {errors.biografia && <div className="am_account-management-error-message">{errors.biografia}</div>}
                </div>

                <div className="am_account-management-form-group">
                    <label className="am_account-management-form-label">Privacy</label>
                    <select 
                        className="am_account-management-form-input"
                        name="privacidad" 
                        value={newData.privacidad} 
                        onChange={handleChange}
                    >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                </div>

                <div className="am_account-management-form-group">
                    <label className="am_account-management-form-label">Profile Photo URL</label>
                    <input 
                        className="am_account-management-form-input"
                        type="text" 
                        name="fotoPerfil" 
                        value={newData.fotoPerfil} 
                        onChange={handleChange} 
                    />
                    {/* Vista previa si hay URL */}
                    {newData.fotoPerfil && (
                        <img 
                            src={newData.fotoPerfil} 
                            alt="Preview" 
                            style={{ width: '100px', marginTop: '10px', borderRadius: '50%' }} 
                        />
                    )}
                </div>

                <button type="submit" className="am_account-management-save-button">Save Changes</button>
            </form>

            <div className="am_go-back-container">
                <button onClick={() => handleNavigate('/profile')} className="am_go-back-button">Go Back to Profile</button>
            </div>
        </div>
    );
};

export default AccountManagement;

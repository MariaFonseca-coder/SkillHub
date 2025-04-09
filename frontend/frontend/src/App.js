import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './views/Login';
import Signup from './views/Signup';
import Politicas from './views/Politicas';
import Dashboard from './views/Dashboard';
import Profile from './views/Profile/Profile'
import AccountManagement from './views/AccountManagmentView/AccountManagement'
import Feed from './views/Feed';
<<<<<<< HEAD
import NotificationView from './views/Notification/NotificationsView';
=======
import Teacher from './views/Teacher';  
>>>>>>> d0d6643c3e02621a9690ffd8da72e4c6f0cbd391

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/politicas" element={<Politicas />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
<<<<<<< HEAD
        <Route path='/profile' element={<Profile/>}/>
        <Route path="/account-management" element={<AccountManagement />} />
        <Route path="/notifications" element={<NotificationView/>}/>
=======
        <Route path="/teacher" element={<Teacher />} />
>>>>>>> d0d6643c3e02621a9690ffd8da72e4c6f0cbd391
      </Routes>
    </Router>
  );
}

export default App;

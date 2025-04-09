import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './views/Login';
import Signup from './views/Signup';
import Politicas from './views/Politicas';
import Dashboard from './views/Dashboard';
import Profile from './views/Profile/Profile'
import AccountManagement from './views/AccountManagmentView/AccountManagement'
import Feed from './views/Feed';
import NotificationView from './views/Notification/NotificationsView';

import Teacher from './views/Teacher';  

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/politicas" element={<Politicas />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path='/profile' element={<Profile/>}/>
        <Route path="/account-management" element={<AccountManagement />} />
        <Route path="/notifications" element={<NotificationView/>}/>
        <Route path="/teacher" element={<Teacher />} />
      </Routes>
    </Router>
  );
}

export default App;

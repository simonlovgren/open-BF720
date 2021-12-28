import './css/app.css';
import './css/user.css'

import React from 'react';
import env from 'react-dotenv';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Users from './components/users/users';
import User from './components/user/user';

function App() {
    return (
        <div className="wrapper">
            <Router>
                <Routes>
                    <Route path="/" element={<Users/>} />
                    <Route path="/user/:userid" element={<User/>} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
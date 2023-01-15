import React, { useEffect, useState } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom'

import axios from 'axios';
import env from 'react-dotenv';
import Identicon from '../user/identicon';

const BASE_URL = `http://${env.BACKEND_URL}:${env.BACKEND_PORT}`;

export default function Users(props) {
    const [users, setUsers] = useState([]);

    const getUsers = () => {
        axios.get(
            `${BASE_URL}/user/`
        ).then(response => {
            setUsers(response.data);
        });
    };
    useEffect(() => {
        getUsers();
    }, []);

    return (
        <div id="profile-list">
            <div className="list-profiles">
                <h1>Who's here?</h1>
                <ul className="profiles">
                    {users.map((user) => (
                        <li key={user.id} className="profile">
                            <Link to={`/user/${user.id}`} className="profile-link">
                                <div className="avatar-wrapper">
                                    <Identicon userid={user.id}/>
                                </div>
                                <p className="profile-name">{user.name}</p>
                            </Link>
                        </li>
                    ))}
                    <li key="add-user" className="profile">
                        <Link to="#" className="profile-link">
                            <div className="avatar-wrapper">
                                <div className="add-profile-icon"/>
                            </div>
                            <p className="profile-name">Add Profile</p>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}
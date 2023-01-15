import React, { useEffect, useState } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom'
import axios from 'axios';
import env from 'react-dotenv';
import Identicon from './identicon';

import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { identifier } from '@babel/types';

const BASE_URL = `http://${env.BACKEND_URL}:${env.BACKEND_PORT}`;

export default function User() {
    // State variables
    const [measurements, setMeasurements] = useState([]);
    const [userProfile, setUserProfile] = useState({});

    // Get route parameters
    const { userid } = useParams();

    // Get user
    const getUser = () => {
        axios.get(
            `${BASE_URL}/user/${userid}`
        ).then(response => {
            setUserProfile(response.data);
        });
    };
    useEffect(() => {
        getUser();
    }, []);

    // Get user measurements
    const getMeasurements = () => {
        axios.get(
            `${BASE_URL}/user/${userid}/measurements`
        ).then(response => {
            setMeasurements(response.data);
        });
    };
    // Calculate percentages from weight-based values and add
    // 0 for missing values.
    for (let index in measurements) {
        let measurement = measurements[index];
        // Default values
        measurement.waterMassInKg = measurement.waterMassInKg || 0;
        measurement.bodyFatInPct = measurement.bodyFatInPct || 0;
        measurement.musclesInPct = measurement.musclesInPct || 0;
        measurement.bmrInJoule = measurement.bmrInJoule || 0;
        measurement.impedanceInOhm = measurement.impedanceInOhm || 0;
        measurement.softLeanMassInKg = measurement.softLeanMassInKg || 0;
        // Calculated values
        measurement.waterInPct = (Math.round((measurement.waterMassInKg / measurement.weightInKg) * 1000.0) / 10.0) || 0;
    }
    useEffect(() => {
        getMeasurements();
    }, []);




    return (
        <div class='userdata'>
            <>
                <div id="header">
                    <Identicon userid={userid}/>
                    <h1>{userProfile.name}</h1>
                    <div class="clr"/>
                </div>
                <div class="charts">
                    <div class="user-chart">
                        <h2>Weight</h2>
                        <ResponsiveContainer width="100%" height={400} className="weight">
                            <AreaChart data={measurements}>
                                <XAxis dataKey="timestamp" tickFormatter={(d) => new Date(d).toDateString()} />
                                <YAxis type="number" domain={[dataMin => (Math.floor(dataMin - 3)), dataMax => (Math.ceil(dataMax + 3))]} />
                                <CartesianGrid stroke="#ccc" vertical={false} strokeDasharray="3" />
                                <Tooltip />
                                <Area type="monotone" dataKey="weightInKg" stroke="#7CD1B8" fill="#7CD1B8" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div class="user-chart">
                        <h2>Body composition</h2>
                        <ResponsiveContainer width="100%" height={400} className="body-composition">
                            <AreaChart data={measurements}>
                                <XAxis dataKey="timestamp" tickFormatter={(d) => new Date(d).toDateString()} />
                                <YAxis type="number" domain={[dataMin => (Math.floor(dataMin - 3)), 100]} />
                                <CartesianGrid stroke="#ccc" vertical={false} strokeDasharray="3" />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" stackId="1" dataKey="bodyFatInPct" name='BodyFat' stroke="#ffc658" fill="#ffc658" strokeWidth={2} dot={false} />
                                <Area type="monotone" stackId="1" dataKey="musclesInPct" name='Muscle' stroke="#FA744F" fill="#FA744F" strokeWidth={2} dot={false} />
                                <Area type="monotone" stackId="1" dataKey="waterInPct" name='Water' strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </>
        </div>
    )
}


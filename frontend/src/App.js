import './css/app.css';
import './css/user.css'

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import axios from 'axios';
import env from 'react-dotenv';

const BASE_URL = `http://${env.BACKEND_URL}:${env.BACKEND_PORT}`;

function App() {
  const [users, setUsers] = useState([]);
  const [measurements, setMeasurements] = useState({});

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    if(users.length > 0){
      let measurementPromises = users.map(user => getMeasurements(user.id));

      Promise.all(measurementPromises).then((results) => {
        console.log(results);
        let measurementResults = {}
        results.forEach(s => {measurementResults[s.data[0].userId]=s.data})
        setMeasurements(measurementResults);
      })
    }
  }, [users]);


  useEffect(() => {
   console.log(measurements)
  }, [measurements]);


  const getUsers = () => {
    console.log('Calling API');
    axios.get(
      `${BASE_URL}/user/`
    ).then(response => {
      setUsers(response.data);
    });
  };

  const getMeasurements = (userId) => {
    return axios.get(
      `${BASE_URL}/user/${userId}/measurements`
    )
  };

  // Calculate percentages from weight-based values and add
  // 0 for missing values.
  Object.keys(measurements).map(key => {
    for (let index in measurements[key])
    {
      let measurement = measurements[key][index];
      // Default values
      measurement.waterMassInKg = measurement.waterMassInKg || 0;
      measurement.bodyFatInPct = measurement.bodyFatInPct || 0;
      measurement.musclesInPct = measurement.musclesInPct || 0;
      measurement.bmrInJoule = measurement.bmrInJoule || 0;
      measurement.impedanceInOhm = measurement.impedanceInOhm || 0;
      measurement.softLeanMassInKg = measurement.softLeanMassInKg || 0;
      // Calculated values
      measurement.waterInPct = (Math.round((measurement.waterMassInKg/measurement.weightInKg)*1000.0)/10.0) || 0;
    }
  });

  return (
    <div class='userdata'>
        {
          Object.keys(measurements).map(key =>
            <>
              <h1>{users.find(u => u.id === measurements[key][0].userId).name}</h1>
              <div class="charts">
                <div class="user-chart">
                  <h2>Weight</h2>
                  <ResponsiveContainer width="100%" height={400} className="weight">
                    <AreaChart data={measurements[key]}>
                      <XAxis dataKey="timestamp" tickFormatter={(d) => new Date(d).toDateString()} />
                      <YAxis type="number" domain={[dataMin => (Math.floor(dataMin-3)),dataMax => (Math.ceil(dataMax+3))]}/>
                      <CartesianGrid stroke="#ccc" vertical={false} strokeDasharray="3" />
                      <Tooltip />
                      <Area type="monotone" dataKey="weightInKg" stroke="#7CD1B8" fill="#7CD1B8" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div class="user-chart">
                  <h2>Body composition</h2>
                  <ResponsiveContainer width="100%" height={400} className="body-composition">
                    <AreaChart data={measurements[key]}>
                      <XAxis dataKey="timestamp" tickFormatter={(d) => new Date(d).toDateString()} />
                      <YAxis type="number" domain={[dataMin => (Math.floor(dataMin-3)),100]}/>
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
            )
        }
    </div>
  )
}

export default App;

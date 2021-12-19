import './App.css';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import axios from 'axios'

const BASE_URL = 'http://[BACKEND_IP]:[BACKEND_PORT]';

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

  return (
    <>
        {
          Object.keys(measurements).map(key =>
            <>
            <h1>{users.find(u => u.id === measurements[key][0].userId).name}</h1>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={measurements[key]}>
                <Line type="monotone" dataKey="weightInKg" stroke="#8884d8" />
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="timestamp" tickFormatter={(d) => new Date(d).toDateString()} />
                <YAxis type="number" domain={['auto', 'auto']}/>
                <Tooltip />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
            <br/>
            </>
            )
        }
    </>
  )
}

export default App;

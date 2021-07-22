import { Router } from 'express';
import { Container } from 'typedi';
import { IUser } from '../interfaces/IUser';
import MeasurementService from '../services/MeasurementService';


const r = Router();

const service: MeasurementService = Container.get(MeasurementService);

r.get('/', (request, response) => {
  service.listAllMeasurments().then((result)=>{
    return response.json(result);
  }).catch(error => {
    console.error(error);
    return response.status(404).json(error);
  })
});

r.get('/user', (request, response) => {
  console.log(request.query)
  const user:IUser = {
    id: String(request.query.id)
  }
  if(!user.id){
    return response.status(500).json("No user id specified");
  }
  
  service.listMeasurements(user).then((result)=>{
    return response.json(result);
  }).catch(error => {
    console.error(error);
    return response.status(404).json(error);
  })
});

export default r;
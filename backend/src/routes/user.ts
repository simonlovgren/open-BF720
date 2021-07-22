import { Router } from 'express';
import { Container } from 'typedi';
import UserService from '../services/UserService';
import { IUserProfileInput } from '../interfaces/IUser';


const r = Router();

const userService = Container.get(UserService);

r.get('/', (request, response) => {
  const profiles = userService.listUsersProfiles()
  return response.json(profiles);
});

r.post('/add', (request, response) => {
  const p = request.body;
  console.log(request.body)
  const userInput:IUserProfileInput = {
    name: p.name,
    initials: p.name.split(" ").length > 1 ? 
      p.name.split(" ")[0][0].toUpperCase()+p.name.split(" ")[1][0].toUpperCase() 
      : 
      p.name[0].toUpperCase(),
    heightInCm: p.heightInCm,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth
  }

  userService.addNewUser(userInput).then(()=>{
    return response.json("User added.");
  }).catch(error => {
    console.log(error);
    return response.json("Failed to add user.");
  })
  
});

r.post('/login', (request, response) => {
  const p = request.body;
  console.log(request.body)
  
  const userProfile = userService.getUserProfile(p.userIndex);

  userService.loginUser(userProfile).then(() => {
    return response.json("User logged in!");
  }).catch(error => {
    console.log(error);
    return response.status(404).json(error);
  });
  
});

export default r;
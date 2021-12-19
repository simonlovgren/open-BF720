/**
 * ==========================================================================
 * Imports
 * ==========================================================================
 */
import { Router } from 'express';
import { Container } from 'typedi';
import UserService from '../services/UserService';
import { IUserProfileInput, IUser } from '../interfaces/IUser';
import MeasurementService from '../services/MeasurementService';

/**
 * ==========================================================================
 * Variables
 * ==========================================================================
 */
const r = Router();
const userService = Container.get(UserService);
const measurementService = Container.get(MeasurementService)

/**
 * ===========================================================================
 * Static routes
 * ===========================================================================
 */
/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
r.get('/', (request, response) => {
  const profiles = userService.listUsersProfiles()
  return response.json(profiles);
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
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


/**
 * ===========================================================================
 * Dynamoc routes
 * ===========================================================================
 */
// Routes with user ID:s must be placed after static routes
/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
r.get('/:userid', (request, response) => {
  const userProfile = userService.getUserProfileById(request.params.userid)
  return response.json(userProfile);
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
 r.get('/:userid/measurements', (request, response) => {
  const user:IUser = {
    id: String(request.params.userid)
  }
  if(!user.id){
    return response.status(500).json("No user id specified");
  }

  measurementService.listMeasurements(user).then((result)=>{
    return response.json(result);
  }).catch(error => {
    console.error(error);
    return response.status(404).json(error);
  })
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
 r.get('/:userid/measurements/sync', (request, response) => {
  const userProfile = userService.getUserProfileById(request.params.userid);

  userService.loginUser(userProfile).then(() => {
    return response.json(`Measurements synced for user ${userProfile.name}!`);
  }).catch(error => {
    console.log(error);
    return response.status(504).json(error);
  });
});

/**
 * ===========================================================================
 * Exports
 * ===========================================================================
 */
export default r;
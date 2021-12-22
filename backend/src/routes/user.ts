/**
 * ==========================================================================
 * Imports
 * ==========================================================================
 */
import { Router } from 'express';
import { Container } from 'typedi';
import UserService from '../services/UserService';
import { IUserProfileInput, IUser, IUserProfile } from '../interfaces/IUser';
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
 * Helpers
 * ===========================================================================
 */

function generateInitials(name: string): string {
  return name.split(' ').map(subName => subName[0]).slice(0, 3).join('').toUpperCase();
}

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
  const userInput: IUserProfileInput = {
    name: p.name,
    initials: generateInitials(p.name),
    heightInCm: p.heightInCm,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth
  }

  userService.addNewUser(userInput).then(() => {
    return response.json("User added.");
  }).catch(() => {
    return response.json("Failed to add user.");
  })
});


/**
 * ===========================================================================
 * Dynamic routes
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
r.delete('/:userid', (request, response) => {
  console.log(`Delete user with ID: ${request.params.userid}`);
  userService.deleteUser(request.params.userid);
  return response.json(`Deleted user with ID: ${request.params.userid}`);
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
r.patch('/:userid', (request, response) => {
  const patch = request.body;
  const userId = request.params.userid;
  console.log(`User ID: ${userId}`)
  console.log(request.body)

  // Get current user profile
  const existingUser: IUserProfile = userService.getUserProfileById(userId);
  if (existingUser === undefined) {
    return response.json(`No user found for ID ${userId}`);
  }

  // Create copy of current user to update
  const userProfile: IUserProfile = { ...existingUser };

  // Update current user profile if patch contains entry
  userProfile.name = patch.name || userProfile.name;
  if (patch.name) {
    userProfile.initials = generateInitials(patch.name);
  }
  userProfile.gender = patch.gender || userProfile.gender;
  userProfile.dateOfBirth = patch.dateOfBirth || userProfile.dateOfBirth;
  userProfile.heightInCm = patch.heightInCm || userProfile.heightInCm;

  userService.updateUser(userProfile).then((userProfile) => {
    return response.json(userProfile);
  }).catch(error => {
    console.log(error);
    return response.json('Failed to update user.');
  })
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
r.get('/:userid/measurements', (request, response) => {
  const user: IUser = {
    id: String(request.params.userid)
  }
  if (!user.id) {
    return response.status(500).json("No user id specified");
  }

  measurementService.listMeasurements(user).then((result) => {
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
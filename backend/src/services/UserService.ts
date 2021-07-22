
import { Service, Inject } from 'typedi';
import UserProfileDAO from '../integrations/UserProfileDAO';
import { IUserProfileInput, IUserProfile } from '../interfaces/IUser';
import ScaleService from './ScaleService';
const { v4: uuidv4 } = require('uuid');

@Service()
class UserService {
  userDao: UserProfileDAO;
  @Inject()
  scaleService: ScaleService;
  
  constructor() {
    this.userDao = new UserProfileDAO;
  }

  private generateConsentCode = () => Math.floor(1000 + Math.random() * 9000);

  addNewUser(userInput:IUserProfileInput):Promise<void> {
    var user: IUserProfile = {
      id: uuidv4(),
      ...userInput,
      consentCode: this.generateConsentCode()
    }

    this.userDao.addUser(user);

    return this.scaleService.addUserToScale(user).then(
      userProfile => {
        console.log(`User added to scale with index: ${userProfile.index}`);
        this.userDao.addUser(user);
        return new Promise((resolve) => resolve());
      }
    )
  }

  listUsersProfiles() : IUserProfile[]{
    return this.userDao.getUsers();
  }

  getUserProfile(index:number) : IUserProfile{
    return this.userDao.getUsers().find(u => u.index === index);
  }

  loginUser(user: IUserProfile) {
    return this.scaleService.loginUser(user);
  }

}

export default UserService;
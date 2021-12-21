/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
import { Service, Inject } from 'typedi';
import UserProfileDAO from '../integrations/UserProfileDAO';
import { IUserProfileInput, IUserProfile } from '../interfaces/IUser';
import ScaleService from './ScaleService';
const { v4: uuidv4 } = require('uuid');

/**
 * -----------------------------------------------------------------------------
 * Service class
 * -----------------------------------------------------------------------------
 */
@Service()
class UserService {
  /**
   * ---------------------------------------------------------------------------
   * Attributes
   * ---------------------------------------------------------------------------
   */
  userDao: UserProfileDAO;
  @Inject()
  scaleService: ScaleService;

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public constructor() {
    this.userDao = new UserProfileDAO;
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private generateConsentCode = () => Math.floor(1000 + Math.random() * 9000);

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public addNewUser(userInput: IUserProfileInput): Promise<void> {
    var user: IUserProfile = {
      id: uuidv4(),
      ...userInput,
      consentCode: this.generateConsentCode()
    }

    this.userDao.addUser(user);
    return this.scaleService.addUserToScale(user).then(
      userProfile => {
        console.log(`User added to scale with index: ${userProfile.index}`);
        this.userDao.updateUser(userProfile);
        return Promise.resolve();
      }
    ).catch(() => {
      this.userDao.deleteUserById(user.id);
      return Promise.reject();
    });
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public updateUser(userProfile: IUserProfile): Promise<IUserProfile> {
    return this.scaleService.updateUser(userProfile).then(
      userProfile => {
        console.log(`User with ID ${userProfile.id} was updated.`);
        this.userDao.updateUser(userProfile);
        return Promise.resolve(userProfile);
      });
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public deleteUser(userId: String): void {
    // TODO: Use userControlPoint in scaleDao to delete user on scale?
    this.userDao.deleteUserById(userId);
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public listUsersProfiles(): IUserProfile[] {
    return this.userDao.getUsers();
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public getUserProfile(index: number): IUserProfile {
    return this.userDao.getUsers().find(u => u.index === index);
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public getUserProfileById(userId: string): IUserProfile {
    return this.userDao.getUsers().find(u => u.id === userId);
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public loginUser(user: IUserProfile) {
    return this.scaleService.loginUser(user);
  }

}

export default UserService;
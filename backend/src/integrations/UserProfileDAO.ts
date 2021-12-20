
/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
import fs from 'fs';
import { IUserProfile } from '../interfaces/IUser';

/**
 * -----------------------------------------------------------------------------
 * Defines
 * -----------------------------------------------------------------------------
 */
const USERS_FILE_NAME = 'users.json'
const EMPTY_USERS_OBJECT = [];

/**
 * -----------------------------------------------------------------------------
 * Module class
 * -----------------------------------------------------------------------------
 */
class UserProfileDAO {
  /**
   * ---------------------------------------------------------------------------
   * Attributes
   * ---------------------------------------------------------------------------
   */
  users: IUserProfile[] = [];
  fileLoaded: Boolean = false;

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public constructor() {
    if (!fs.existsSync(USERS_FILE_NAME)) {
      fs.writeFileSync(
        USERS_FILE_NAME,
        JSON.stringify(EMPTY_USERS_OBJECT, null, 2)
      );

      if (fs.existsSync(USERS_FILE_NAME))
        this.fileLoaded = true;

    } else {
      const data = fs.readFileSync(USERS_FILE_NAME, 'utf8');
      this.users = JSON.parse(data);
      console.log(`Users.json loaded. Number of users in file: ${this.users.length}`)
      this.fileLoaded = true;
    }
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public getUsers(): IUserProfile[] {
    return this.users;
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private persistUsers() {
    fs.writeFileSync(
      USERS_FILE_NAME,
      JSON.stringify(this.users, null, 2),
      { encoding: 'utf8', flag: 'w' }
    );
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public addUser(user: IUserProfile) {
    this.users.push(user);
    this.persistUsers();
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public updateUser(user: IUserProfile) {
    var usersWithoutUser = this.users.filter(u => u.id !== user.id);
    usersWithoutUser.push(user);
    this.users = usersWithoutUser;
    this.persistUsers();
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public deleteUser(user: IUserProfile) {
    var usersWithoutUser = this.users.filter(u => u.consentCode !== user.consentCode);
    this.users = usersWithoutUser;
    this.persistUsers();
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public deleteUserById(userId: String) {
    var usersWithoutUser = this.users.filter(u => u.id !== userId);
    this.users = usersWithoutUser;
    this.persistUsers();
  }
}

export default UserProfileDAO;
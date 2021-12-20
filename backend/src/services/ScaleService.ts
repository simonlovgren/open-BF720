/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
import { Service } from 'typedi';

import { IDevice, ISettings, IDeviceInfo } from '../interfaces/IScale';
import BF720DAO from '../integrations/BF720DAO';
import ScaleSettingsDAO from '../integrations/ScaleSettingsDAO';
import { IUserProfile } from '../interfaces/IUser';
import { IMeasurement } from '../interfaces/IMeasurement';

/**
 * -----------------------------------------------------------------------------
 * Service class
 * -----------------------------------------------------------------------------
 */
@Service()
class ScaleService {
  /**
   * ---------------------------------------------------------------------------
   * Attributes
   * ---------------------------------------------------------------------------
   */
  scaleDAO: BF720DAO;
  settingsDAO: ScaleSettingsDAO;

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public constructor() {
    this.scaleDAO = new BF720DAO();
    this.settingsDAO = new ScaleSettingsDAO();

    this.settingsDAO.getSettings().then(
      setting => this.scaleDAO.scaleDiscovery(setting)
    );
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public getAvailableScales(): IDevice[] {
    return this.scaleDAO.getDiscovered();
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public setScaleSettings(settings: ISettings) {
    return this.settingsDAO.updateSettings(settings);
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public getScaleSettings(): Promise<ISettings> {
    return this.settingsDAO.getSettings();
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public getDeviceInformation(): Promise<IDeviceInfo> {
    return this.connect().then(() => this.scaleDAO.getDeviceInformation());
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public registerOnMeasurement(cb: (measurement: IMeasurement) => void) {
    this.scaleDAO.registerOnMeasurement(cb);
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
   private connect(): Promise<void> {
    if (!this.scaleDAO.isScaleConnected()) {
      return this.settingsDAO.getSettings().then(settings => {
        const device: IDevice = { id: settings.id };
        return this.scaleDAO.connect(device);
      });
    } else {
      console.log("Scale already connected..");
      return Promise.resolve();
    }
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public addUserToScale(user: IUserProfile): Promise<IUserProfile> {
    return this.connect().then(
      () => this.scaleDAO.addUser(user)
    );
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
   public updateUser(user: IUserProfile): Promise<IUserProfile> {
    return this.connect().then(
      () => this.scaleDAO.updateUser(user)
    );
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public loginUser(user: IUserProfile): Promise<void> {
    return this.connect()
      .then(() => this.scaleDAO.loginUser(user));
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public disconnect() {
    this.scaleDAO.disconnect();
  }

}

export default ScaleService;
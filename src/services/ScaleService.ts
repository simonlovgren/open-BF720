

import { Service } from 'typedi';

import { IDevice, ISettings } from '../interfaces/IScale';
import BF720DAO from '../integrations/BF720DAO';
import ScaleSettingsDAO from '../integrations/ScaleSettingsDAO';
import { IUserProfile } from '../interfaces/IUser';
import { IMeasurement } from '../interfaces/IMeasurement';

@Service()
class ScaleService {
  scaleDAO:BF720DAO;
  settingsDAO: ScaleSettingsDAO;
  
  constructor() {
    this.scaleDAO = new BF720DAO();
    this.settingsDAO = new ScaleSettingsDAO();

    this.settingsDAO.getSettings().then(
      setting => this.scaleDAO.scaleDiscovery(setting)
    );
  }

  getAvailableScales() : IDevice[]{
    return this.scaleDAO.getDiscovered();
  }

  setScaleSettings(settings:ISettings){
    return this.settingsDAO.updateSettings(settings);
  }

  getScaleSettings():Promise<ISettings>{
    return this.settingsDAO.getSettings();
  }

  registerOnMeasurement(onMeasurement: (measurement:IMeasurement) => void){
    this.scaleDAO.registerOnMeasurement(onMeasurement);
  }

  connect():Promise<void> {
    if (!this.scaleDAO.isScaleConnected()){
      return this.settingsDAO.getSettings().then(settings => {
        const device:IDevice = {id:settings.id};
        return this.scaleDAO.connect(device);
      });
    } else {
      console.log("Scale already connected..");
      return new Promise(resolve => resolve());
    }
  }

  addUserToScale(user: IUserProfile):Promise<IUserProfile>{
    return this.connect().then(
      () => this.scaleDAO.addUser(user)
    );
  }

  loginUser(user: IUserProfile):Promise<void> {
    return this.connect().then(
      () => this.scaleDAO.loginUser(user)
    );
  }

  disconnect () {
    this.scaleDAO.disconnect();
  }

}

export default ScaleService;
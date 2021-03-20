import {IUserProfile} from './IUser';
import { IMeasurement } from '../interfaces/IMeasurement';

export interface IDevice {
  id: string;
  name?: string;
}

export interface IScaleDAO {
  connect(
    device:IDevice, 
  ):Promise<void>;
  registerOnMeasurement(onMeasurement: (measurement:IMeasurement) => void);
  addUser(user: IUserProfile):Promise<IUserProfile>;
  scaleDiscovery(setting:ISettings):void;
}

export interface ISettings {
  id: string;
  name?: string;
}

import { IUserProfile } from './IUser';
import { IMeasurement } from '../interfaces/IMeasurement';

export interface IDevice {
  id: string;
  name?: string;
}

export interface IDeviceInfo {
  systemId?: string;
  modelNumberString?: string;
  serialNumberString?: string;
  firmwareRevisionString?: string;
  hardwareRevisionString?: string;
  softwareRevisionString?: string;
  manufacturerNameString?: string;
  ieeeRegulatoryCertificationDataList?: string;
  pnpId?: number;
  batteryLevelInPct?: number;
}

export interface IScaleDAO {
  connect(
    device: IDevice,
  ): Promise<void>;
  registerOnMeasurement(cb: (measurement: IMeasurement) => void);
  addUser(user: IUserProfile): Promise<IUserProfile>;
  scaleDiscovery(setting: ISettings): void;
}

export interface ISettings {
  id: string;
  name?: string;
}

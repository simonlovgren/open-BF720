import { IUser } from './IUser';


export interface IMeasurement extends IUser {
  weightInKg: number;
  timestamp: string;
}

export interface IMeasurementDAO {
  getMeasurements(user:IUser):Promise<IMeasurement[]>;
  getAllMeasurements():Promise<IMeasurement[]>;
  addMeasurement(measurement:IMeasurement):Promise<void>;
}

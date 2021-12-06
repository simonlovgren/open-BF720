import { IUser } from './IUser';


export interface IMeasurement extends IUser {
  weightInKg?: number;
  timestamp?: string;

  bodyFatInPct?: number;
  bmrInJoule?: number;
  musclesInPct?: number;
  softLeanMassInKg?: number;
  waterMassInKg?: number;
  impedanceInOhm?: number;
}

export interface IMeasurementDAO {
  getMeasurements(user:IUser):Promise<IMeasurement[]>;
  getAllMeasurements():Promise<IMeasurement[]>;
  addMeasurement(measurement:IMeasurement):Promise<void>;
}

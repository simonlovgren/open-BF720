import { IUser } from './IUser';

export interface IWeightMeasurement {
  userIndex: number;
  timestamp: string;
  weightInKg: number;
}

export interface IBodyCompositionMeasurement {
  bodyFatInPct: number;
  bmrInJoule: number;
  musclesInPct: number;
  softLeanMassInKg: number;
  waterMassInKg: number;
  impedanceInOhm: number;
}

export interface IMeasurement extends IWeightMeasurement, IBodyCompositionMeasurement {
  userId?: string
}

export interface IMeasurementDAO {
  getMeasurements(user: IUser): Promise<IMeasurement[]>;
  getAllMeasurements(): Promise<IMeasurement[]>;
  addMeasurement(measurement: IMeasurement): Promise<void>;
}

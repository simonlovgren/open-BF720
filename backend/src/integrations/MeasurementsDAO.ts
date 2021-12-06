

import fs from 'fs';
import { IMeasurementDAO, IMeasurement } from '../interfaces/IMeasurement';
import { IUser } from '../interfaces/IUser';

const MEASUREMENT_FILE = 'measurements.json'

class MeasurementsDAO implements IMeasurementDAO {
  fileLoaded: Boolean = false;
  measurements: IMeasurement[] = [];

  constructor() {
    if(fs.existsSync(MEASUREMENT_FILE)){
      const data = fs.readFileSync(MEASUREMENT_FILE, 'utf8');
      this.measurements = JSON.parse(data);
      console.log(`${MEASUREMENT_FILE} loaded`);
      this.fileLoaded = true;
    }
  }

  private persistMeasurements(){
    fs.writeFileSync(
      MEASUREMENT_FILE,
      JSON.stringify(this.measurements, null, 2),
      {encoding:'utf8',flag:'w'}
    );
  }

  getMeasurements(user:IUser):Promise<IMeasurement[]>{
    return new Promise((resolve, reject) => {
      const userMeasurements = this.measurements.filter(u => u.id === user.id);
      resolve(userMeasurements);
    });
  }

  getAllMeasurements():Promise<IMeasurement[]>{
    return new Promise((resolve, reject) => {
      resolve(this.measurements);
    });
  }

  addMeasurement(measurement:IMeasurement):Promise<void>{
    return new Promise((resolve, reject) => {
      this.measurements.push(measurement);
      this.persistMeasurements();
      resolve();
    });
  }
}

export default MeasurementsDAO;
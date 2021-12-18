

import fs from 'fs';
import { IMeasurementDAO, IMeasurement } from '../interfaces/IMeasurement';
import { IUser } from '../interfaces/IUser';

const MEASUREMENT_FILE = 'measurements.json'

class MeasurementsDAO implements IMeasurementDAO {
  fileLoaded: Boolean = false;
  measurements: IMeasurement[] = [];

  constructor() {
    if (fs.existsSync(MEASUREMENT_FILE)) {
      const data = fs.readFileSync(MEASUREMENT_FILE, 'utf8');
      this.measurements = JSON.parse(data);
      console.log(`${MEASUREMENT_FILE} loaded`);
      this.fileLoaded = true;
    }
  }

  private persistMeasurements() {
    fs.writeFileSync(
      MEASUREMENT_FILE,
      JSON.stringify(this.measurements, null, 2),
      { encoding: 'utf8', flag: 'w' }
    );
  }

  getMeasurements(user: IUser): Promise<IMeasurement[]> {
    const userMeasurements = this.measurements.filter(u => u.userId === user.id);
    return Promise.resolve(userMeasurements);
  }

  getAllMeasurements(): Promise<IMeasurement[]> {
    return Promise.resolve(this.measurements);
  }

  addMeasurement(measurement: IMeasurement): Promise<void> {
    this.measurements.push(measurement);
    this.persistMeasurements();
    return Promise.resolve();
  }
}

export default MeasurementsDAO;
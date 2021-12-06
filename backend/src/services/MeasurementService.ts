
import { Service, Inject, Container} from 'typedi';
import MeasurementsDAO from '../integrations/MeasurementsDAO';
import { IMeasurement } from '../interfaces/IMeasurement';
import ScaleService from './ScaleService';
import UserService from './UserService';
import { IUser } from '../interfaces/IUser';

@Service()
class MeasurementService {
  measurementDAO: MeasurementsDAO;
  scaleService: ScaleService;
  userService: UserService;
  activeMeasurement: IMeasurement = undefined;

  constructor() {
    this.measurementDAO = new MeasurementsDAO();
    this.scaleService = Container.get(ScaleService);
    this.userService = Container.get(UserService);
    this.scaleService.registerOnCreateMeasurement(this.onCreateMeasurement.bind(this));
    this.scaleService.registerOnUpdateMeasurement(this.onUpdateMeasurement.bind(this));
    this.scaleService.registerOnStoreMeasurement(this.onStoreMeasurement.bind(this));
  }

  private onCreateMeasurement(measurement:IMeasurement) {
    if ( this.activeMeasurement !== undefined )
    {
      this.onStoreMeasurement();
    }
    const user = this.userService.getUserProfile(measurement.index);
    measurement.id = user.id;
    this.activeMeasurement = measurement;
  }

  private onUpdateMeasurement(measurement:IMeasurement)
  {
    if ( this.activeMeasurement === undefined )
    {
      return;
    }
    for (let key in measurement)
    {
      this.activeMeasurement[key] = measurement[key];
    }
  }

  private onStoreMeasurement()
  {
    if ( this.activeMeasurement === undefined )
    {
      return;
    }
    this.measurementDAO.addMeasurement(this.activeMeasurement);
    this.activeMeasurement = undefined;
  }

  listAllMeasurments() : Promise<IMeasurement[]>{
    return this.measurementDAO.getAllMeasurements();
  }

  listMeasurements(user:IUser) : Promise<IMeasurement[]>{
    return this.measurementDAO.getMeasurements(user);
  }

}

export default MeasurementService;
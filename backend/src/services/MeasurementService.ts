
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
  
  constructor() {
    this.measurementDAO = new MeasurementsDAO();
    this.scaleService = Container.get(ScaleService);
    this.userService = Container.get(UserService);
    this.scaleService.registerOnMeasurement(this.onMeasurement.bind(this));
  }

  private onMeasurement(measurement:IMeasurement) {
    const user = this.userService.getUserProfile(measurement.index);
    measurement.id = user.id;
    this.measurementDAO.addMeasurement(measurement);
  }

  listAllMeasurments() : Promise<IMeasurement[]>{
    return this.measurementDAO.getAllMeasurements();
  }

  listMeasurements(user:IUser) : Promise<IMeasurement[]>{
    return this.measurementDAO.getMeasurements(user);
  }

}

export default MeasurementService;
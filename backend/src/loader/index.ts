import { Container } from 'typedi';
import ScaleService from '../services/ScaleService';
import UserService from '../services/UserService';
import MeasurementService from '../services/MeasurementService';

export default () => {
  Container.get(UserService);
  Container.get(ScaleService);
  Container.get(MeasurementService);
};
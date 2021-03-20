import { Router } from 'express';
import { Container } from 'typedi';
import { ISettings } from '../interfaces/IScale';
import ScaleService from '../services/ScaleService';

const manageRouter = Router();

const scaleService:ScaleService = Container.get(ScaleService);

manageRouter.get('/', (request, response) => {
  return response.json("OK");
});

manageRouter.get('/availableScales', (request, response) => {
  const peripherals = scaleService.getAvailableScales()
  return response.json(peripherals);
});

manageRouter.get('/settings', (request, response) => {
  scaleService.getScaleSettings().then((settings:ISettings) => {
    return response.json(settings);
  }).catch(error => {
    return response.status(404).json("No settings exist!");
  })
});

manageRouter.post('/settings', (request, response) => {
  const settings:ISettings = {
    id: request.body.id,
    name: request.body.name ? request.body.name : ""
  }
  scaleService.setScaleSettings(settings).then(() => {
    return response.json("Settings updated!");
  }).catch(error => {
    return response.status(404).json("Failed to set setting");
  })
});

manageRouter.get('/disconnect', (request, response) => {
  scaleService.disconnect();
  return response.json("OK");
});

export default manageRouter;
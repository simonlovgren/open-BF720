/**
 * ===========================================================================
 * Imports
 * ===========================================================================
 */
import { Router } from 'express';
import { Container } from 'typedi';
import { IDeviceInfo, ISettings } from '../interfaces/IScale';
import ScaleService from '../services/ScaleService';

/**
 * ===========================================================================
 * Variables
 * ===========================================================================
 */
const manageRouter = Router();
const scaleService:ScaleService = Container.get(ScaleService);

/**
 * ===========================================================================
 * Static routes
 * ===========================================================================
 */
/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
manageRouter.get('/', (request, response) => {
  return response.json("OK");
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
manageRouter.get('/availableScales', (request, response) => {
  const peripherals = scaleService.getAvailableScales()
  return response.json(peripherals);
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
manageRouter.get('/settings', (request, response) => {
  scaleService.getScaleSettings().then((settings:ISettings) => {
    return response.json(settings);
  }).catch(error => {
    return response.status(404).json("No settings exist!");
  })
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
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

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
manageRouter.get('/deviceinfo', (request, response) => {
  scaleService.getDeviceInformation().then((deviceInfo:IDeviceInfo) => {
    return response.json(deviceInfo);
  }).catch(error => {
    return response.status(404).json("No device information available!");
  })
});

/**
 * -------------------------------------
 * Route
 * -------------------------------------
 */
manageRouter.get('/disconnect', (request, response) => {
  scaleService.disconnect();
  return response.json("OK");
});

/**
 * ===========================================================================
 * Exports
 * ===========================================================================
 */
export default manageRouter;
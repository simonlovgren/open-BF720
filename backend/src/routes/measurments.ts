/**
 * ==========================================================================
 * Imports
 * ==========================================================================
 */
import { Router } from 'express';
import { Container } from 'typedi';
import MeasurementService from '../services/MeasurementService';

/**
 * ==========================================================================
 * Variables
 * ==========================================================================
 */
const r = Router();
const service: MeasurementService = Container.get(MeasurementService);

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
r.get('/', (request, response) => {
  service.listAllMeasurments().then((result)=>{
    return response.json(result);
  }).catch(error => {
    console.error(error);
    return response.status(404).json(error);
  })
});

/**
 * ===========================================================================
 * Exports
 * ===========================================================================
 */
export default r;


import fs from 'fs';
import { ISettings } from '../interfaces/IScale';

const SCALE_SETTINGS_FILE = 'scale_settings.json'

class ScaleSettingsDAO {
  settings: ISettings;
  fileLoaded: Boolean = false;

  constructor() {
    if(fs.existsSync(SCALE_SETTINGS_FILE)){
      const data = fs.readFileSync(SCALE_SETTINGS_FILE, 'utf8');
      this.settings = JSON.parse(data);
      console.log(`${SCALE_SETTINGS_FILE} loaded`);
      this.fileLoaded = true;
    }
  }

  getSettings():Promise<ISettings>{
    return new Promise((resolve, reject) => {
      this.settings ? resolve(this.settings) : resolve(null);
    });
  }

  updateSettings(settings:ISettings):Promise<void>{
    return new Promise((resolve, reject) => {
      this.settings = settings;
      fs.writeFile(
        SCALE_SETTINGS_FILE, 
        JSON.stringify(settings, null, 2), 
        {encoding:'utf8',flag:'w'},
        (error) => {error ? reject(error) : resolve()}
      );
    });
  }
}

export default ScaleSettingsDAO;
/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
import noble from '@abandonware/noble';
import { IDevice, IScaleDAO, ISettings, IDeviceInfo } from '../interfaces/IScale';
import { IUserProfile } from '../interfaces/IUser';
import { IBodyCompositionMeasurement, IMeasurement, IWeightMeasurement } from '../interfaces/IMeasurement';

/**
 * -----------------------------------------------------------------------------
 * Interfaces
 * -----------------------------------------------------------------------------
 */
interface ICharacteristic {
  id: string,
  handle?: noble.Characteristic,
}

/**
 * -----------------------------------------------------------------------------
 * Defines
 * -----------------------------------------------------------------------------
 */
const OP_CODE_RESPONSE_CODE = 0x20;
const REQUEST_OP_CODE_REGISTER_NEW_USER = 0x01;
const REQUEST_OP_CODE_LOGIN_USER = 0x02;
const REQUEST_SUCCESS = 0x01;
const GENDER_MALE = 0x00;
const GENDER_FEMALE = 0x01;
const TAKE_MEASUREMENT = 0x00;

/**
 * -----------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------
 */
const intToHex = (value) => value.toString(16).length % 2 != 0 ? '0' + value.toString(16) : value.toString(16)
const to_bytes = (hex) => Buffer.from(hex, 'hex');


/**
 * -----------------------------------------------------------------------------
 * Module class
 * -----------------------------------------------------------------------------
 */
class Bf720DAO implements IScaleDAO {
  /**
   * ---------------------------------------------------------------------------
   * Attributes
   * ---------------------------------------------------------------------------
   */
  bluetoothPowerOn: boolean = false;
  scale: noble.Peripheral;
  discoveredPeripherals: noble.Peripheral[] = [];
  isConnected: boolean = false;
  partialMeasurement: IWeightMeasurement;

  /**
   * ---------------------------------------------------------------------------
   * Callbacks
   * ---------------------------------------------------------------------------
   */
  onMeasurement: (measurement: IMeasurement) => void;
  callbackScaleReady: () => void;

  /**
   * ---------------------------------------------------------------------------
   * Characteristics
   * ---------------------------------------------------------------------------
   */

  // Service UUID: 0x1805 (Current Time Service)
  // ----------------------------------------------------------------
  currentTime: ICharacteristic = { id: '2a2b' }

  // Service UUID: 0xffff (Unknown/Custom)
  // ----------------------------------------------------------------
  userList: ICharacteristic = { id: '1' }
  initials: ICharacteristic = { id: '2' }
  activityLevel: ICharacteristic = { id: '4' }
  takeMeasurement: ICharacteristic = { id: '6' }

  // Service UUID: 0x181c (User Data)
  // ----------------------------------------------------------------
  userControlPoint: ICharacteristic = { id: '2a9f' }
  databaseChangeIncrement: ICharacteristic = { id: '2a99' }
  dateOfBirth: ICharacteristic = { id: '2a85' }
  gender: ICharacteristic = { id: '2a8c' }
  height: ICharacteristic = { id: '2a8e' }

  // Service UUID: 0x181d (Weight Scale)
  // ----------------------------------------------------------------
  weightMeasurement: ICharacteristic = { id: '2a9d' }

  // Service UUID: 0x181b (Body Composition)
  // ----------------------------------------------------------------
  bodyCompositionMeasurement: ICharacteristic = { id: '2a9c' }


  // *****************************************
  // Currently unused but seen characteristics
  // *****************************************

  // Service UUID: 0x1800 (Generic Access Profile)
  // ----------------------------------------------------------------
  deviceName: ICharacteristic = { id: '2a00' }

  // Service UUID: 0x180a (Device Information)
  // ----------------------------------------------------------------
  systemId: ICharacteristic = { id: '2a23' }
  modelNumberString: ICharacteristic = { id: '2a24' }
  serialNumberString: ICharacteristic = { id: '2a25' }
  firmwareRevisionString: ICharacteristic = { id: '2a26' }
  hardwareRevisionString: ICharacteristic = { id: '2a27' }
  softwareRevisionString: ICharacteristic = { id: '2a28' }
  manufacturerNameString: ICharacteristic = { id: '2a29' }
  ieeeRegulatoryCertificationDataList: ICharacteristic = { id: '2a2a' }
  pnpId: ICharacteristic = { id: '2a50' }

  // Service UUID: 0x180f (Battery Service)
  // ----------------------------------------------------------------
  batteryLevel: ICharacteristic = { id: '2a19' }

  // Service UUID: 0x181c (User Data)
  // ----------------------------------------------------------------
  userIndex: ICharacteristic = { id: '2a9a' }

  // Service UUID: 0x181d (Weight Scale)
  // ----------------------------------------------------------------
  weightScaleFeature: ICharacteristic = { id: '2a9e' }

  // Service UUID: 0x181b (Body Composition)
  // ----------------------------------------------------------------
  bodyCompositionFeature: ICharacteristic = { id: '2a9b' }

  // Service UUID: 0xfaa0 (Unknown/Custom)
  // ----------------------------------------------------------------
  unknown_faa0_1: ICharacteristic = { id: 'faa1' }
  unknown_faa0_2: ICharacteristic = { id: 'faa2' }

  // Service UUID: 0xffff (Unknown/Custom)
  // ----------------------------------------------------------------
  unknown_ffff_1: ICharacteristic = { id: '0' }
  // unknown_ffff_2:                   ICharacteristic = { id:    '1' } // User list
  // unknown_ffff_3:                   ICharacteristic = { id:    '2' } // Initials
  // unknown_ffff_4:                   ICharacteristic = { id:    '4' } // Activity level
  unknown_ffff_5: ICharacteristic = { id: '5' }
  // unknown_ffff_6:                   ICharacteristic = { id:    '6' } // Take measurement
  unknown_ffff_7: ICharacteristic = { id: 'b' }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  constructor() {

    noble.on('stateChange', state => {
      if (state === 'poweredOn') {
        console.log(`Power on`)
        this.bluetoothPowerOn = true;
        noble.startScanningAsync();
      } else if (state === 'poweredOff') {
        this.bluetoothPowerOn = false;
        console.log(`Power off`);
        noble.stopScanningAsync();
      }
    });
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public isScaleConnected(): boolean { return this.isConnected };

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public registerOnMeasurement(cb: (measurement: IMeasurement) => void) {
    this.onMeasurement = cb;
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public scaleDiscovery(setting: ISettings = null): void {

    console.log(setting)
    let discoverInterval: NodeJS.Timeout;

    const eventEmitter = noble.on('discover', peripheral => {
      console.log(`peripheral found: ${peripheral.uuid}`);
      if (peripheral.advertisement.localName === "BF720" || (setting && setting.id === peripheral.uuid)) {
        console.log(`scale found: ${peripheral.uuid}`);
        this.discoveredPeripherals.push(peripheral);
        console.log(`scale added: ${peripheral.uuid}`);
      }
    });

    const discoverScales = () => {
      if (this.discoveredPeripherals.length > 0) {
        console.log(`Scales found: ${this.discoveredPeripherals.length}. Discovery finished.`)
        clearInterval(discoverInterval);
        eventEmitter.removeAllListeners('discover');
        noble.stopScanningAsync();
      }
    }

    discoverInterval = setInterval(discoverScales, 20000);
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  public getDiscovered(): IDevice[] {
    return this.discoveredPeripherals.map(p => ({
      id: p.id,
      name: p.advertisement.localName,
    }));
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  connect(
    deviceId: IDevice,
  ): Promise<void> {
    const scale = this.discoveredPeripherals.find(p => p.id === deviceId.id);

    if (scale) {
      this.scale = scale;
      this.scale.once('connect', () => { console.log("Connected"); this.isConnected = true });
      this.scale.once('disconnect', () => { console.log("Disconnect"); this.isConnected = false });
      return this.scale.connectAsync().then(() => this.setupScale(scale));
    } else {
      const error = `Peripheral ${deviceId.id} not found in discovered list.`;
      console.log(error);
      return new Promise((resolve, reject) => reject(error));
    }
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  disconnect() {
    if (this.scale) {
      this.scale.disconnectAsync();
    }
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  addUser(user: IUserProfile): Promise<IUserProfile> {
    const createUserMessage = (): Buffer => {
      console.log(`Prepare consent code: ${user.consentCode}`)
      var head = Buffer.alloc(1);
      head[0] = REQUEST_OP_CODE_REGISTER_NEW_USER;
      return Buffer.concat([head, this.prepareConsentCode(user.consentCode)]);
    }

    return this.userList.handle.writeAsync(
      Buffer.from([0]), false
    ).then(
      () => this.sendCommandWithResponse(createUserMessage(), this.userControlPoint)
    ).then((response: Buffer): Promise<void> => new Promise((resolve, reject) => {
      if (
        response[0] === OP_CODE_RESPONSE_CODE &&
        response[1] === REQUEST_OP_CODE_REGISTER_NEW_USER &&
        response[2] === REQUEST_SUCCESS
      ) {
        console.log(`User succesfully created! User index:${response[3].toString(16)}`)
        user.index = response[3];
        resolve();
      } else {
        reject(`Failed to create user: ${user.name}`);
      }
    })
    ).then(
      () => this.loginUser(user)
    ).then(
      () => this.setUserProfile(user)
    ).then(
      () => this.databaseChangeIncrement.handle.writeAsync(Buffer.from([1, 0, 0, 0]), false)
    ).then(
      () => this.sendCommandWithResponse(Buffer.from([TAKE_MEASUREMENT]), this.takeMeasurement)
    ).then(
      (response: Buffer) => {
        return new Promise((resolve, reject) => {
          if (response[0] === REQUEST_SUCCESS) {
            resolve(user);
          } else {
            reject(`Did not receive measurement acknowledgement: ${user.name}`);
          }
        })
      }
    );
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private setUserProfile(user: IUserProfile): Promise<void> {
    const birth = new Date(user.dateOfBirth);

    return this.dateOfBirth.handle.writeAsync(
      Buffer.concat([
        to_bytes(intToHex(birth.getFullYear())).reverse(),
        Buffer.from([birth.getMonth(), birth.getDate()])
      ]), false
    ).then(() => this.gender.handle.writeAsync(
      Buffer.from([user.gender === 'm' ? GENDER_MALE : GENDER_FEMALE]), false
    )
    ).then(() => this.height.handle.writeAsync(
      to_bytes(intToHex(user.heightInCm)).reverse(), false
    )
    ).then(() => this.activityLevel.handle.writeAsync(
      Buffer.from([3]), false // Hard code Activity level 3
    )
    ).then(() => {
      const payload = [0x20, 0x20, 0x20];
      for (let i = 0; i < user.initials.length; i++) {
        payload[i] = user.initials.charCodeAt(i);
      }
      console.log(`Initials byte payload: ${Buffer.from(payload).toString('hex')}`)
      return this.initials.handle.writeAsync(Buffer.from(payload), false);
    }
    );
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  loginUser(user: IUserProfile): Promise<void> {
    const createLoginUserMessage = (): Buffer => {
      var head = Buffer.alloc(1);
      head[0] = REQUEST_OP_CODE_LOGIN_USER;
      return Buffer.concat([head, Buffer.from([user.index]), this.prepareConsentCode(user.consentCode)]);
    }

    console.log(`Trying to login user: ${user.name}`)

    return this.sendCommandWithResponse(
      createLoginUserMessage(),
      this.userControlPoint
    ).then((response: Buffer) => {
      return new Promise((resolve, reject) => {
        if (
          response[0] === OP_CODE_RESPONSE_CODE &&
          response[1] === REQUEST_OP_CODE_LOGIN_USER &&
          response[2] === REQUEST_SUCCESS
        ) {
          console.log(`User ${user.name} has been successfully logged in`)
          return resolve(undefined);
        } else {
          return reject("Failed to login user");
        }
      })
    })
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private createCurrentTimeMessage(): Buffer {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const dayOfTheWeek = now.getDay();

    const payload = Buffer.concat([
      to_bytes(intToHex(year)).reverse(),
      Buffer.from([month, day, hours, minutes, seconds, dayOfTheWeek, 0, 0])
    ])
    console.log(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`)
    console.log(`Date bytes: ${payload.toString('hex')}`)
    return payload;
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private sendCommandWithResponse(command: Buffer, c: ICharacteristic): Promise<Buffer> {
    return c.handle.writeAsync(command, true).then(() => new Promise((resolve) => {
      console.log(`Waiting for ${c.handle.uuid} data: ${command.toString('hex')}`);
      c.handle.once('data', (data, isNotification) => resolve(data));
    }))
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private setupScale(scale: noble.Peripheral): Promise<void> {
    return scale.discoverSomeServicesAndCharacteristicsAsync(
      [],
      [
        this.weightMeasurement.id,
        this.bodyCompositionMeasurement.id,
        this.userControlPoint.id,
        this.userList.id,
        this.currentTime.id,
        this.takeMeasurement.id,
        this.databaseChangeIncrement.id,
        this.gender.id,
        this.height.id,
        this.activityLevel.id,
        this.initials.id,
        this.dateOfBirth.id,
        this.batteryLevel.id,
        // Device information
        this.systemId.id,
        this.modelNumberString.id,
        this.serialNumberString.id,
        this.firmwareRevisionString.id,
        this.hardwareRevisionString.id,
        this.softwareRevisionString.id,
        this.manufacturerNameString.id,
        this.pnpId.id,
      ]
    ).then(
      result => {
        let promises = [];
        result.characteristics.forEach(characteristic => {
          console.log(`Setup: ${characteristic.uuid}`);
          switch (characteristic.uuid) {
            case this.weightMeasurement.id:
              this.weightMeasurement.handle = characteristic;
              characteristic.on('data', (data, isNotification) => this.onWeightMeasurement(data));
              promises.push(characteristic.subscribeAsync());
              break;
            case this.bodyCompositionMeasurement.id:
              this.bodyCompositionMeasurement.handle = characteristic;
              characteristic.on('data', (data, isNotification) => this.onBodyCompositionMeasurement(data));
              break;
            case this.userList.id:
              this.userList.handle = characteristic;
              promises.push(characteristic.subscribeAsync());
              break;
            case this.userControlPoint.id:
              this.userControlPoint.handle = characteristic;
              promises.push(characteristic.subscribeAsync());
              break;
            case this.currentTime.id:
              this.currentTime.handle = characteristic;
              promises.push(characteristic.subscribeAsync().then(() => {
                characteristic.write(this.createCurrentTimeMessage(), true);
              }));
              break;
            case this.databaseChangeIncrement.id:
              this.databaseChangeIncrement.handle = characteristic;
              characteristic.on('data', (data, isNotification) => {
                console.log(`DataIncrement notification: ${data.toString('hex')} | '${data.toString('ascii')}'`)
              })
              promises.push(
                characteristic.subscribeAsync().then(() => {
                  characteristic.readAsync().then(data => {
                    { console.log(`Data read change Increment: ${data.toString('hex')} | '${data.toString('ascii')}'`) }
                  });
                }));
              break;
            case this.takeMeasurement.id:
              this.takeMeasurement.handle = characteristic;
              promises.push(characteristic.subscribeAsync());
              break;
            case this.height.id:
              this.height.handle = characteristic;
              break;
            case this.gender.id:
              this.gender.handle = characteristic;
              break;
            case this.dateOfBirth.id:
              this.dateOfBirth.handle = characteristic;
              break;
            case this.activityLevel.id:
              this.activityLevel.handle = characteristic;
              break;
            case this.initials.id:
              this.initials.handle = characteristic;
              break;
            case this.batteryLevel.id:
              this.batteryLevel.handle = characteristic;
              characteristic.on('data', (data, isNotification) => { console.log(`[onData] BatteryLevel notification: ${data[0]}%`) })
              break;
            // Device information
            case this.systemId.id:
              this.systemId.handle = characteristic;
              break;
            case this.modelNumberString.id:
              this.modelNumberString.handle = characteristic;
              break;
            case this.serialNumberString.id:
              this.serialNumberString.handle = characteristic;
              break;
            case this.firmwareRevisionString.id:
              this.firmwareRevisionString.handle = characteristic;
              break;
            case this.hardwareRevisionString.id:
              this.hardwareRevisionString.handle = characteristic;
              break;
            case this.softwareRevisionString.id:
              this.softwareRevisionString.handle = characteristic;
              break;
            case this.manufacturerNameString.id:
              this.manufacturerNameString.handle = characteristic;
              break;
            case this.pnpId.id:
              this.pnpId.handle = characteristic;
              break;
            // Default handler
            default:
              console.log(`No set up for characteristic ${characteristic.uuid}`);
          }
        });
        return Promise.all(promises).then(() => new Promise(resolve => { console.log("Everything set up"); resolve() }));
      });
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private prepareConsentCode(consentCode: number): Buffer {
    return to_bytes(intToHex(consentCode)).reverse();
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  getDeviceInformation(): Promise<IDeviceInfo> {
    const systemId: Promise<Buffer> = this.systemId.handle.readAsync();
    const modelNumberString: Promise<Buffer> = this.modelNumberString.handle.readAsync();
    const serialNumberString: Promise<Buffer> = this.serialNumberString.handle.readAsync();
    const firmwareRevisionString: Promise<Buffer> = this.firmwareRevisionString.handle.readAsync();
    const hardwareRevisionString: Promise<Buffer> = this.hardwareRevisionString.handle.readAsync();
    const softwareRevisionString: Promise<Buffer> = this.softwareRevisionString.handle.readAsync();
    const manufacturerNameString: Promise<Buffer> = this.manufacturerNameString.handle.readAsync();
    const pnpId: Promise<Buffer> = this.pnpId.handle.readAsync();
    const batterLevel: Promise<Buffer> = this.batteryLevel.handle.readAsync();

    return Promise.all([
      systemId,
      modelNumberString,
      serialNumberString,
      firmwareRevisionString,
      hardwareRevisionString,
      softwareRevisionString,
      manufacturerNameString,
      pnpId,
      batterLevel
    ]).then((responses: Array<Buffer>) => {
      const deviceInfo: IDeviceInfo = {
        systemId: responses[0].toString('ascii'),
        modelNumberString: responses[1].toString('ascii'),
        serialNumberString: responses[2].toString('ascii'),
        firmwareRevisionString: responses[3].toString('ascii'),
        hardwareRevisionString: responses[4].toString('ascii'),
        softwareRevisionString: responses[5].toString('ascii'),
        manufacturerNameString: responses[6].toString('ascii'),
        pnpId: parseInt(responses[7].toString('hex'), 16),
        batteryLevelInPct: parseInt(responses[8].toString('hex'), 16),
      }
      return deviceInfo;
    }
    )
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private onWeightMeasurement(data) {
    console.log("Weight measurement received!")
    console.log(`Value: ${data.toString('hex')} | '${data.toString('ascii')}'`);

    const weight = parseInt(data.slice(1, 3).reverse().toString('hex'), 16);
    const year = parseInt(data.slice(3, 5).reverse().toString('hex'), 16);
    const month = parseInt(intToHex(data[5]), 16);
    const day = parseInt(intToHex(data[6]), 16);
    const hours = parseInt(intToHex(data[7]), 16);
    const minutes = parseInt(intToHex(data[8]), 16);
    const seconds = parseInt(intToHex(data[9]), 16);

    console.log(`${year}-${month}-${day}-${hours}-${minutes}-${seconds}`);

    const weightMeasurement: IWeightMeasurement = {
      userIndex: parseInt(data[10], 16),
      weightInKg: 5 * weight / 1000.0, // Weight unit is 5 grams.
      timestamp: new Date(year, month - 1, day, hours, minutes, seconds).toISOString()
    }
    console.log(weightMeasurement);
    this.partialMeasurement = weightMeasurement;
  }

  /**
   * ---------------------------------------------------------------------------
   * Method
   * ---------------------------------------------------------------------------
   */
  private onBodyCompositionMeasurement(data) {
    console.log("Body characteristic measurement received!")
    console.log(`Value: ${data.toString('hex')} | '${data.toString('ascii')}'`);

    const bodyFat = parseInt(data.slice(2, 4).reverse().toString('hex'), 16) / 10.0;
    const bmr = Math.round((parseInt(data.slice(4, 6).reverse().toString('hex'), 16) / 4.1868) * 10.0) / 10.0;
    const muscles = parseInt(data.slice(6, 8).reverse().toString('hex'), 16) / 10.0;
    const slm = (parseInt(data.slice(8, 10).reverse().toString('hex'), 16) * 5) / 1000.0;
    const water = (parseInt(data.slice(10, 12).reverse().toString('hex'), 16) * 5) / 1000.0;
    const impedance = parseInt(data.slice(12, 14).reverse().toString('hex'), 16) / 10.0;

    const bodyCompositionMeasurement: IBodyCompositionMeasurement = {
      bodyFatInPct: bodyFat,
      bmrInJoule: bmr,
      musclesInPct: muscles,
      softLeanMassInKg: slm,
      waterMassInKg: water,
      impedanceInOhm: impedance
    }

    console.log(bodyCompositionMeasurement);

    if (this.weightMeasurement) {
      const measurement: IMeasurement = {
        ...this.partialMeasurement,
        ...bodyCompositionMeasurement
      }
      this.onMeasurement(measurement);
    }
  }
}


/**
 * -----------------------------------------------------------------------------
 * Export module
 * -----------------------------------------------------------------------------
 */
export default Bf720DAO;
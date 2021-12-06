
import noble from '@abandonware/noble';
import { IDevice, IScaleDAO, ISettings } from '../interfaces/IScale';
import { IUserProfile } from '../interfaces/IUser';
import { IMeasurement } from '../interfaces/IMeasurement';


interface ICharacteristic {
  id:string,
  handle?:noble.Characteristic,
}

const OP_CODE_RESPONSE_CODE = 0x20;
const REQUEST_OP_CODE_REGISTER_NEW_USER = 0x01;
const REQUEST_OP_CODE_LOGIN_USER = 0x02;
const REQUEST_SUCCESS = 0x01;
const GENDER_MALE = 0x00;
const GENDER_FEMALE = 0x01;
const TAKE_MEASUREMENT = 0x00;


const intToHex = (value) => value.toString(16).length % 2 != 0 ? '0'+ value.toString(16) :  value.toString(16)
const to_bytes = (hex) => Buffer.from(hex, 'hex');

class Bf720DAO implements IScaleDAO {
  bluetoothPowerOn: boolean = false;
  scale: noble.Peripheral;
  discoveredPeripherals: noble.Peripheral[] = [];
  isConnected: boolean = false;
  onMeasurement:(measurement:IMeasurement) => void;

  currentTime: ICharacteristic = {id: '2a2b'}
  userList: ICharacteristic = {id: '1'}
  takeMeasurement: ICharacteristic = {id: '6'}
  activityLevel: ICharacteristic = {id: '4'}
  initials: ICharacteristic = {id: '2'}
  userControlPoint: ICharacteristic = {id: '2a9f'}
  databaseIncrement: ICharacteristic = {id: '2a99'}
  weightMeasurement: ICharacteristic = {id: '2a9d'}
  dateOfBirth: ICharacteristic = {id: '2a85'}
  gender: ICharacteristic = {id: '2a8c'}
  height: ICharacteristic = {id: '2a8e'}

  callbackScaleReady: () => void;

  constructor() {

    noble.on('stateChange', state => {
      if (state === 'poweredOn') {
        console.log(`Power on`)
        this.bluetoothPowerOn = true;
        noble.startScanningAsync();
      } else if(state === 'poweredOff') {
        this.bluetoothPowerOn = false;
        console.log(`Power off`);
        noble.stopScanningAsync();
      }
    });
  }

  isScaleConnected():boolean {return this.isConnected};

  registerOnMeasurement(onMeasurement: (measurement:IMeasurement) => void) {
    this.onMeasurement = onMeasurement;
  }

  scaleDiscovery(setting:ISettings=null):void{

    console.log(setting)
    let discoverInterval;

    const eventEmitter = noble.on('discover', peripheral => {
      console.log(`peripheral found: ${peripheral.uuid}`);
      if (peripheral.advertisement.localName === "BF720" || (setting && setting.id === peripheral.uuid)) {
        console.log(`scale found: ${peripheral.uuid}`);
        this.discoveredPeripherals.push(peripheral);
        console.log(`scale added: ${peripheral.uuid}`);
      }
    });

    const discoverScales = () => {
      if(this.discoveredPeripherals.length > 0){
        console.log(`Scales found: ${this.discoveredPeripherals.length}. Turning of discovery`)
        clearInterval(discoverInterval);
        eventEmitter.removeAllListeners('discover');
        noble.stopScanningAsync();
      }
    }

    discoverInterval = setInterval(discoverScales, 20000);
  }

  getDiscovered() : IDevice[]{
    return this.discoveredPeripherals.map(p => ({
      id:p.id,
      name:p.advertisement.localName,
    }));
  }

  connect(
    deviceId:IDevice,
  ): Promise<void>
  {
    const scale = this.discoveredPeripherals.find(p => p.id === deviceId.id);

    if (scale) {
      this.scale = scale;
      this.scale.once('connect', () => {console.log("Connected"); this.isConnected = true});
      this.scale.once('disconnect', () => {console.log("Disconnect"); this.isConnected = false});
      return this.scale.connectAsync().then(() => this.setupScale(scale));
    } else {
      const error = `Peripheral ${deviceId.id} not found in discovered list.`;
      console.log(error);
      return new Promise((resolve, reject) => reject(error));
    }
  }

  disconnect () {
    if (this.scale){
      this.scale.disconnectAsync();
    }
  }

  addUser(user:IUserProfile):Promise<IUserProfile> {
    const createUserMessage = ():Buffer => {
      console.log(`Prepare consent code: ${user.consentCode}`)
      var head = Buffer.alloc(1);
      head[0] = REQUEST_OP_CODE_REGISTER_NEW_USER;
      return Buffer.concat([head, this.prepareConsentCode(user.consentCode)]);
    }

    return this.userList.handle.writeAsync(
      Buffer.from([0]), false
    ).then(
      () => this.sendCommandWithResponse(createUserMessage(), this.userControlPoint)
    ).then((response:Buffer):Promise<void> => new Promise((resolve, reject) => {
        if(
          response[0] === OP_CODE_RESPONSE_CODE &&
          response[1] === REQUEST_OP_CODE_REGISTER_NEW_USER &&
          response[2] === REQUEST_SUCCESS
        ){
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
      () => this.databaseIncrement.handle.writeAsync(Buffer.from([1,0,0,0]),false)
    ).then(
      () => this.sendCommandWithResponse(Buffer.from([TAKE_MEASUREMENT]), this.takeMeasurement)
    ).then(
      (response:Buffer) => {
        return new Promise((resolve, reject) => {
          if(response[0] === REQUEST_SUCCESS ){
            resolve(user);
          } else {
            reject(`Did not receive measurement acknowledgement: ${user.name}`);
          }
        })
      }
    );
  }

  private setUserProfile(user:IUserProfile):Promise<void>{
    const birth = new Date(user.dateOfBirth);

    return this.dateOfBirth.handle.writeAsync(
      Buffer.concat([
        to_bytes(intToHex(birth.getFullYear())).reverse(),
        Buffer.from([birth.getMonth(), birth.getDate()])
      ]),false
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
        for(let i=0; i < user.initials.length ; i++) {
          payload[i] = user.initials.charCodeAt(i);
        }
        console.log(`Initials byte payload: ${Buffer.from(payload).toString('hex')}`)
        return this.initials.handle.writeAsync(Buffer.from(payload), false);
      }
    );
  }

  loginUser(user:IUserProfile):Promise<void>{
    const createLoginUserMessage = ():Buffer => {
      var head = Buffer.alloc(1);
      head[0] = REQUEST_OP_CODE_LOGIN_USER;
      return Buffer.concat([head, Buffer.from([user.index]), this.prepareConsentCode(user.consentCode)]);
    }

    console.log(`Trying to login user: ${user.name}`)

    return this.sendCommandWithResponse(
      createLoginUserMessage(),
      this.userControlPoint
    ).then((response:Buffer) => {
      return new Promise((resolve, reject) => {
        if(
          response[0] === OP_CODE_RESPONSE_CODE &&
          response[1] === REQUEST_OP_CODE_LOGIN_USER &&
          response[2] === REQUEST_SUCCESS
        ){
          console.log(`User ${user.name} has been successfully logged in`)
          return resolve()
        } else {
          return reject("Failed to login user");
        }
      })
    })
  }

  private createCurrentTimeMessage():Buffer {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth()+1;
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

  private sendCommandWithResponse(command: Buffer, c: ICharacteristic):Promise<Buffer> {
    return c.handle.writeAsync(command, true).then(()=>new Promise((resolve) => {
      console.log(`Waiting for ${c.handle.uuid} data: ${command.toString('hex')}`);
      c.handle.once('data', (data, isNotification) => resolve(data));
    }))
  }

  private setupScale(scale : noble.Peripheral) : Promise<void> {
    return scale.discoverSomeServicesAndCharacteristicsAsync(
      [],
      [
        this.weightMeasurement.id,
        this.userControlPoint.id,
        this.userList.id,
        this.currentTime.id,
        this.takeMeasurement.id,
        this.databaseIncrement.id,
        this.gender.id,
        this.height.id,
        this.activityLevel.id,
        this.initials.id,
        this.dateOfBirth.id,
      ]
    ).then(
      result => {
        let promises = [];
        result.characteristics.forEach(characteristic => {
          console.log(`Setup: ${characteristic.uuid}`);
          switch(characteristic.uuid){
            case this.weightMeasurement.id:
              this.weightMeasurement.handle = characteristic;
              characteristic.on('data', (data, isNotification) => this.onWeightMeasurement(data));
              promises.push(characteristic.subscribeAsync());
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
              promises.push(characteristic.subscribeAsync().then(()=>{
                characteristic.write(this.createCurrentTimeMessage(), true);
              }));
              break;
            case this.databaseIncrement.id:
              this.databaseIncrement.handle = characteristic;
              characteristic.on("data", (data, isNotification) => {console.log(`DataIncrement notification: ${data.toString('hex')} | '${data.toString('ascii')}'`)})
              promises.push(
                characteristic.subscribeAsync().then(()=>{
                  characteristic.readAsync().then(data => {
                    {console.log(`Data read change Increment: ${data.toString('hex')} | '${data.toString('ascii')}'`)}
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
            default:
              console.log(`No set up for characteristic ${characteristic.uuid}`);
          }
        });
        return Promise.all(promises).then(() => new Promise(resolve => {console.log("Everything set up");resolve()}));
    });
  }

  private prepareConsentCode(consentCode:number):Buffer {
    return to_bytes(intToHex(consentCode)).reverse();
  }

  private onWeightMeasurement(data) {
    console.log("Weight measurement received!")
    console.log(`Value: ${data.toString('hex')} | '${data.toString('ascii')}'`);

    const weight = parseInt(data.slice(1,3).reverse().toString('hex'),16);
    const year = parseInt(data.slice(3,5).reverse().toString('hex'),16);
    const month = parseInt(intToHex(data[5]),16);
    const day = parseInt(intToHex(data[6]),16);
    const hours = parseInt(intToHex(data[7]),16);
    const minutes = parseInt(intToHex(data[8]),16);
    const seconds = parseInt(intToHex(data[9]),16);

    console.log(`${year}-${month}-${day}-${hours}-${minutes}-${seconds}`);

    const measurement:IMeasurement = {
      index:parseInt(data[10],16),
      weightInKg: 5*weight/1000.0, // Weight unit is 5 grams.
      timestamp: new Date(year, month-1, day, hours, minutes, seconds).toISOString()
    }
    console.log(measurement);
    this.onMeasurement(measurement);
  }

}

export default Bf720DAO;
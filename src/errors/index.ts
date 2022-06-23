export enum DeviceErrorType {
  NOT_CONNECTED = 'HD_INIT_1001',

  DEVICE_DISCONNECTED_IN_FLOW = 'HD_INIT_1010',
  CONNECTION_CLOSED = 'HD_INIT_1011',
  CONNECTION_NOT_OPEN = 'HD_INIT_1012',

  WRITE_ERROR = 'HD_COM_1007',

  TIMEOUT_ERROR = 'HD_COM_1050',
  WRITE_TIMEOUT = 'HD_COM_1051',
  READ_TIMEOUT = 'HD_COM_1052',

  NO_WORKING_PACKET_VERSION = 'HD_INIT_2006',
  UNKNOWN_ERROR = 'HD_COM_5500'
}


export class DeviceError extends Error {
  public errorType: DeviceErrorType;
  public errorCode: DeviceErrorType;
  constructor(errorType: DeviceErrorType) {
    super();
    this.errorType = errorType;
    this.errorCode = errorType || DeviceErrorType.UNKNOWN_ERROR;
    Object.setPrototypeOf(this, DeviceError.prototype);
  }
}

export enum DeviceErrorType {
  NOT_CONNECTED = 'HD_INIT_1001',

  DEVICE_DISCONNECTED_IN_FLOW = 'HD_INIT_1010',
  CONNECTION_CLOSED = 'HD_INIT_1011',
  CONNECTION_NOT_OPEN = 'HD_INIT_1012',

  WRITE_ERROR = 'HD_COM_1007',

  TIMEOUT_ERROR = 'HD_COM_1050',
  WRITE_TIMEOUT = 'HD_COM_1051',
  READ_TIMEOUT = 'HD_COM_1052',

  FIRMWARE_SIZE_LIMIT_EXCEEDED = 'HD_FIRM_1001',
  WRONG_FIRMWARE_VERSION = 'HD_FIRM_1002',
  WRONG_HARDWARE_VERSION = 'HD_FIRM_1003',
  WRONG_MAGIC_NUMBER = 'HD_FIRM_1004',
  SIGNATURE_NOT_VERIFIED = 'HD_FIRM_1005',
  LOWER_FIRMWARE_VERSION = 'HD_FIRM_1006',

  NO_WORKING_PACKET_VERSION = 'HD_INIT_2006',
  UNKNOWN_COMMUNICATION_ERROR = 'HD_COM_5500'
}

const defaultErrorMessages = {
  [DeviceErrorType.NOT_CONNECTED]: 'No device connected',

  [DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW]: 'Device disconnected in flow',
  [DeviceErrorType.CONNECTION_CLOSED]: 'Connection was closed while in process',
  [DeviceErrorType.CONNECTION_NOT_OPEN]: 'Connection was not open',

  [DeviceErrorType.WRITE_ERROR]: 'Unable to write packet to the device',

  [DeviceErrorType.TIMEOUT_ERROR]: 'Timeout Error due to write/read',
  [DeviceErrorType.WRITE_TIMEOUT]: 'Did not receive ACK of sent packet on time',
  [DeviceErrorType.READ_TIMEOUT]:
    'Did not receive the expected data from device on time',

  [DeviceErrorType.FIRMWARE_SIZE_LIMIT_EXCEEDED]: 'Firmware Size Limit Exceed',
  [DeviceErrorType.WRONG_FIRMWARE_VERSION]: 'Wrong Firmware version',
  [DeviceErrorType.WRONG_HARDWARE_VERSION]: 'Wrong Hardware version',
  [DeviceErrorType.WRONG_MAGIC_NUMBER]: 'Wrong Magic Number',
  [DeviceErrorType.SIGNATURE_NOT_VERIFIED]: 'Signature not verified',
  [DeviceErrorType.LOWER_FIRMWARE_VERSION]: 'Lower Firmware version',

  [DeviceErrorType.NO_WORKING_PACKET_VERSION]: 'No working packet version',
  [DeviceErrorType.UNKNOWN_COMMUNICATION_ERROR]:
    'Unknown Error at communication module'
};

export class DeviceError extends Error {
  // remove below line
  public errorType: DeviceErrorType;
  public code: DeviceErrorType;
  public message: string;
  constructor(errorCode: DeviceErrorType) {
    super();
    this.code = errorCode || DeviceErrorType.UNKNOWN_COMMUNICATION_ERROR;
    // remove below line
    this.errorType = errorCode || DeviceErrorType.UNKNOWN_COMMUNICATION_ERROR;
    this.message = defaultErrorMessages[this.errorType];
    Object.setPrototypeOf(this, DeviceError.prototype);
  }
}

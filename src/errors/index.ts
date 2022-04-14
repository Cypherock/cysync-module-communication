export enum DeviceErrorType {
  NOT_CONNECTED,
  CONNECTION_CLOSED,
  CONNECTION_NOT_OPEN,
  WRITE_ERROR,
  WRITE_TIMEOUT,
  READ_TIMEOUT,
  NO_WORKING_PACKET_VERSION
}

const defaultErrorMessages = {
  [DeviceErrorType.NOT_CONNECTED]: 'No device connected',
  [DeviceErrorType.CONNECTION_CLOSED]: 'Connection was closed while in process',
  [DeviceErrorType.CONNECTION_NOT_OPEN]: 'Connection was not open',
  [DeviceErrorType.WRITE_ERROR]: 'Unable to write packet to the device',
  [DeviceErrorType.WRITE_TIMEOUT]: 'Did not receive ACK of sent packet on time',
  [DeviceErrorType.READ_TIMEOUT]:
    'Did not receive the expected data from device on time',
  [DeviceErrorType.NO_WORKING_PACKET_VERSION]:
    'No packet version is working with this device.'
};

export class DeviceError extends Error {
  public errorType: DeviceErrorType;
  constructor(errorType: DeviceErrorType, msg?: string) {
    let message = msg;

    if (!msg && defaultErrorMessages[errorType]) {
      message = defaultErrorMessages[errorType];
    }

    super(message);
    this.errorType = errorType;

    Object.setPrototypeOf(this, DeviceError.prototype);
  }
}

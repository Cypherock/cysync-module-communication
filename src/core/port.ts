import SerialPort from 'serialport';

import { DeviceError, DeviceErrorType } from '../errors';

import { getAvailableConnectionInfo } from './connection';

/**
 * This method closes the port so it can be used again when required.
 *
 * @example
 * ```typescript
 * import {closePort} from '@cypherock/communication'
 *
 * ...
 *
 * closePort(connection);
 * ```
 *
 * @param connection - instance of the connection with the hardware device.
 * @return
 */
const closePort = (connection: any) => {
  connection.close();
};

/**
 * Helper function: This method creates a connection on the given port
 *
 *
 * @param port - port on which the device is connected
 * @return SerialPort instance
 */
const createPortConnection = (port: any) => {
  return new SerialPort(port, {
    baudRate: 115200,
    autoOpen: false
  });
};

/**
 * This method finds the port on which the hardware wallet is connected
 * and returns a SerialPort connection instance with the hardware wallet
 * or throws an error 'Device not connected'.
 *
 * @example
 * ```typescript
 * import {createPort} from '@cypherock/communication'
 *
 * const connection = await createPort();
 *
 * ```
 */
const createPort = async () => {
  const connectionInfo = await getAvailableConnectionInfo();

  if (!connectionInfo) {
    throw new DeviceError(DeviceErrorType.NOT_CONNECTED);
  } else {
    return {
      connection: createPortConnection(connectionInfo.port.path),
      serial: connectionInfo.serial,
      hardwareVersion: connectionInfo.hardwareVersion,
      inBootloader: connectionInfo.inBootloader,
      // 00: Bootloader, 01: Initial app, 02: Main app
      deviceState: connectionInfo.deviceState
    };
  }
};

export { createPort, closePort };

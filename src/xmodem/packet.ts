import { intToUintByte } from '../bytes';
import { constants, radix } from '../config';
import { crc16 } from '../core';
import { PacketVersion, PacketVersionMap } from '../utils/versions';

export interface DecodedPacketData {
  startOfFrame: string;
  currentPacketNumber: number;
  totalPacketNumber: number;
  protobufDataSize: number;
  protobufData: string;
  rawDataSize: number;
  rawData: string;
  crc: string;
  sequenceNumber: number;
  packetType: number;
  errorList: string[];
  timestamp: number;
}

export enum CmdState {
  CMD_STATUS_NONE = 0,
  CMD_STATUS_RECEIVING = 1,
  CMD_STATUS_RECEIVED = 2,
  CMD_STATUS_EXECUTING = 3,
  CMD_STATUS_DONE = 4,
  CMD_STATUS_REJECTED = 5
}

export enum DeviceWaitOn {
  IDLE = 1,
  USB = 2,
  DEVICE = 3,
}

export enum DeviceIdleState {
  IDLE = 1,
  BUSY_IP_CARD = 2,
  BUSY_IP_KEY = 3,
}

export interface StatusData {
  deviceState: string;
  deviceWaitingOn: DeviceWaitOn;
  deviceIdleState: DeviceIdleState;
  abortDisabled: boolean;
  cardTapDelta: number[];
  currentCmdSeq: number;
  cmdState: CmdState;
  cmdType: number;
  cmdStatus: number;
  isStatus?: boolean;
  isRawData?: boolean;
}

export interface RawData {
  commandType: number;
  data: string;
  isStatus?: boolean;
  isRawData?: boolean;
}

export const encodePacket = ({
  data,
  version,
  sequenceNumber,
  packetType
}: {
  data: string;
  version: PacketVersion;
  sequenceNumber: number;
  packetType: number;
}) => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableConstants = constants.v3;
  const usableRadix = radix.v3;

  const serializedSequenceNumber = intToUintByte(
    sequenceNumber,
    usableRadix.sequenceNumber
  );
  const serializedPacketType = intToUintByte(
    packetType,
    usableRadix.packetType
  );

  const { CHUNK_SIZE, START_OF_FRAME } = usableConstants;

  let rounds = Math.ceil(data.length / CHUNK_SIZE);
  let hasNoData = data.length === 0;
  const packetList: string[] = [];

  if (hasNoData) {
    rounds = 1;
  }

  for (let i = 1; i <= rounds; i += 1) {
    const currentPacketNumber = intToUintByte(
      i,
      usableRadix.currentPacketNumber
    );
    const totalPacketNumber = intToUintByte(rounds, usableRadix.totalPacket);
    const dataChunk = data.slice(
      (i - 1) * CHUNK_SIZE,
      (i - 1) * CHUNK_SIZE + CHUNK_SIZE
    );

    const protobufData = '';
    let payload = '';
    let payloadLength = intToUintByte(0, usableRadix.payloadLength);

    if (!hasNoData) {
      const serializedRawDataLength = intToUintByte(
        dataChunk.length / 2,
        usableRadix.dataSize
      );
      const serializedProtobufDataLength = intToUintByte(
        protobufData.length / 2,
        usableRadix.dataSize
      );
      payload =
        serializedProtobufDataLength +
        serializedRawDataLength +
        protobufData +
        dataChunk;
      payloadLength = intToUintByte(
        payload.length / 2,
        usableRadix.payloadLength
      );
    }

    const serializedTimestamp = intToUintByte(
      new Date()
        .getTime()
        .toString()
        .slice(0, usableRadix.timestampLength / 4),
      usableRadix.timestampLength
    );

    const commData =
      currentPacketNumber +
      totalPacketNumber +
      serializedSequenceNumber +
      serializedPacketType +
      serializedTimestamp +
      payloadLength +
      payload;
    const crc = intToUintByte(
      crc16(Buffer.from(commData, 'hex')),
      usableRadix.crc
    );
    const packet = START_OF_FRAME + crc + commData;

    packetList.push(packet);
  }
  return packetList;
};

export const decodedPacket = (
  param: Buffer,
  version: PacketVersion
): DecodedPacketData[] => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableConstants = constants.v3;
  const usableRadix = radix.v3;

  const { CHUNK_SIZE, START_OF_FRAME } = usableConstants;

  let data = param.toString('hex').toUpperCase();
  const packetList: DecodedPacketData[] = [];
  let offset = data.indexOf(START_OF_FRAME);

  while (data.length > 0) {
    offset = data.indexOf(START_OF_FRAME);

    // Invalid data if no START_OF_FRAME
    if (offset === -1) {
      return packetList;
    }

    const startOfFrame = data.slice(offset, offset + START_OF_FRAME.length);
    offset += START_OF_FRAME.length;

    const crc = data.slice(offset, offset + usableRadix.crc / 4);
    offset += usableRadix.crc / 4;

    const currentPacketNumber = parseInt(
      `0x${data.slice(offset, offset + usableRadix.currentPacketNumber / 4)}`,
      16
    );
    offset += usableRadix.currentPacketNumber / 4;

    const totalPacketNumber = parseInt(
      `0x${data.slice(offset, offset + usableRadix.totalPacket / 4)}`,
      16
    );
    offset += usableRadix.totalPacket / 4;

    const sequenceNumber = parseInt(
      `0x${data.slice(offset, offset + usableRadix.sequenceNumber / 4)}`,
      16
    );
    offset += usableRadix.sequenceNumber / 4;

    const packetType = parseInt(
      `0x${data.slice(offset, offset + usableRadix.packetType / 4)}`,
      16
    );
    offset += usableRadix.packetType / 4;

    const timestamp = parseInt(
      `0x${data.slice(offset, offset + usableRadix.timestampLength / 4)}`,
      16
    );
    offset += usableRadix.timestampLength / 4;

    const payloadLength = parseInt(
      `0x${data.slice(offset, offset + usableRadix.payloadLength / 4)}`,
      16
    );
    offset += usableRadix.payloadLength / 4;

    let payload = '';
    let protobufDataSize = 0;
    let rawDataSize = 0;
    let protobufData = '';
    let rawData = '';
    if (payloadLength !== 0) {
      payload = data.slice(offset, offset + payloadLength * 2);
      offset += payloadLength * 2;

      let payloadOffset = 0;
      protobufDataSize = parseInt(
        `0x${payload.slice(
          payloadOffset,
          payloadOffset + usableRadix.dataSize / 4
        )}`,
        16
      );
      payloadOffset += usableRadix.dataSize / 4;

      rawDataSize = parseInt(
        `0x${payload.slice(
          payloadOffset,
          payloadOffset + usableRadix.dataSize / 4
        )}`,
        16
      );
      payloadOffset += usableRadix.dataSize / 4;

      protobufData = payload.slice(
        payloadOffset,
        payloadOffset + protobufDataSize * 2
      );
      payloadOffset += protobufDataSize * 2;

      rawData = payload.slice(payloadOffset, payloadOffset + rawDataSize * 2);
      payloadOffset += rawDataSize * 2;
    }

    data = data.slice(offset);

    const commData =
      intToUintByte(currentPacketNumber, usableRadix.currentPacketNumber) +
      intToUintByte(totalPacketNumber, usableRadix.totalPacket) +
      intToUintByte(sequenceNumber, usableRadix.sequenceNumber) +
      intToUintByte(packetType, usableRadix.packetType) +
      intToUintByte(timestamp, usableRadix.timestampLength) +
      intToUintByte(payloadLength, usableRadix.payloadLength) +
      payload;
    const actualCRC = intToUintByte(
      crc16(Buffer.from(commData, 'hex')),
      usableRadix.crc
    );

    const errorList = [];
    if (startOfFrame.toUpperCase() !== START_OF_FRAME) {
      errorList.push('Invalid Start of frame');
    }
    if (currentPacketNumber > totalPacketNumber) {
      errorList.push('currentPacketNumber is greater than totalPacketNumber');
    }
    if (rawDataSize + protobufDataSize > CHUNK_SIZE) {
      errorList.push('invalid data size');
    }
    if (actualCRC.toUpperCase() !== crc.toUpperCase()) {
      errorList.push('invalid crc');
    }
    packetList.push({
      startOfFrame,
      currentPacketNumber: currentPacketNumber,
      totalPacketNumber: totalPacketNumber,
      crc: crc,
      protobufData,
      rawData,
      protobufDataSize,
      rawDataSize,
      errorList,
      sequenceNumber,
      packetType,
      timestamp
    });
  }
  return packetList;
};

export const decodeStatus = (
  data: string,
  version: PacketVersion
): StatusData => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableRadix = radix.v3;

  let offset = 0;

  const deviceState = parseInt(
    `0x${data.slice(offset, offset + usableRadix.status.deviceState / 4)}`,
    16
  );
  offset += usableRadix.status.deviceState / 4;

  const num = deviceState & 0xff;
  const deviceIdleState = num & 0xf;
  const deviceWaitingOn = num >> 4;

  const abortDisabled =
    parseInt(
      `0x${data.slice(offset, offset + usableRadix.status.abortDisabled / 4)}`,
      16
    ) === 1;
  offset += usableRadix.status.abortDisabled / 4;

  const cardTapDelta: number[] = [];
  for (let i = 0; i < 4; i++) {
    const cardTap = parseInt(
      `0x${data.slice(offset, offset + usableRadix.status.cardTap / 4)}`,
      16
    );
    offset += usableRadix.status.cardTap / 4;

    cardTapDelta.push(cardTap);
  }

  const currentCmdSeq = parseInt(
    `0x${data.slice(offset, offset + usableRadix.status.currentCmdSeq / 4)}`,
    16
  );
  offset += usableRadix.status.currentCmdSeq / 4;

  const cmdState = parseInt(
    `0x${data.slice(offset, offset + usableRadix.status.cmdState / 4)}`,
    16
  );
  offset += usableRadix.status.cmdState / 4;

  const cmdType = parseInt(
    `0x${data.slice(offset, offset + usableRadix.status.cmdType / 4)}`,
    16
  );
  offset += usableRadix.status.cmdType / 4;

  const cmdStatus = parseInt(
    `0x${data.slice(offset, offset + usableRadix.status.cmdStatus / 4)}`,
    16
  );
  offset += usableRadix.status.cmdStatus / 4;

  return {
    deviceState: deviceState.toString(16),
    deviceIdleState,
    deviceWaitingOn,
    abortDisabled,
    cardTapDelta,
    currentCmdSeq,
    cmdState,
    cmdType,
    cmdStatus,
    isStatus: true
  };
};

export const encodeRawData = (
  params: RawData,
  version: PacketVersion
): string => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableRadix = radix.v3;

  const data =
    intToUintByte(params.commandType, usableRadix.commandType) + params.data;
  return data;
};

export const decodeRawData = (
  params: string,
  version: PacketVersion
): RawData => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableRadix = radix.v3;

  let offset = 0;

  const receivedCommandType = parseInt(
    params.slice(offset, offset + usableRadix.commandType / 4),
    16
  );
  offset += usableRadix.commandType / 4;

  const receivedData = params.slice(offset);

  return {
    commandType: receivedCommandType,
    data: receivedData,
    isRawData: true
  };
};

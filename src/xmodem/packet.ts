// import crypto from 'crypto';
import { intToUintByte } from '../bytes';
import { constants, radix } from '../config';
import { crc16 } from '../core';
import { PacketVersion, PacketVersionMap } from '../utils/versions';

export interface DecodedPacketData {
  startOfFrame: string;
  commandType: number;
  currentPacketNumber: number;
  totalPacket: number;
  dataSize: number;
  dataChunk: string;
  crc: string;
  errorList: string[];
}

export const encodePacket = ({
  data,
  commandType,
  version,
  sequenceNumber,
  packetType
}: {
  data: string;
  commandType: number;
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

  const rounds = Math.ceil(data.length / CHUNK_SIZE);
  const packetList: string[] = [];
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

    const serializedCommandType = intToUintByte(
      commandType,
      usableRadix.commandType
    );
    const protobufData = '';
    const serializedRawDataLength = intToUintByte(
      dataChunk.length / 2,
      usableRadix.dataSize
    );
    const serializedProtobufDataLength = intToUintByte(
      protobufData.length / 2,
      usableRadix.dataSize
    );
    const serializedTotalDataLength = intToUintByte(
      (protobufData.length + dataChunk.length) / 2,
      usableRadix.dataSize
    );
    const payload =
      serializedCommandType +
      serializedProtobufDataLength +
      serializedRawDataLength +
      protobufData +
      dataChunk;
    const payloadLength = intToUintByte(
      payload.length / 2,
      usableRadix.payloadLength
    );
    const commData =
      serializedSequenceNumber +
      serializedTotalDataLength +
      currentPacketNumber +
      totalPacketNumber +
      serializedPacketType +
      payload;
    const crc = intToUintByte(
      crc16(Buffer.from(commData, 'hex')),
      usableRadix.crc
    );
    const packet =
      START_OF_FRAME +
      crc +
      currentPacketNumber +
      totalPacketNumber +
      serializedSequenceNumber +
      serializedPacketType +
      payloadLength +
      payload;

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

    const payloadLength = parseInt(
      `0x${data.slice(offset, offset + usableRadix.payloadLength / 4)}`,
      16
    );
    offset += usableRadix.payloadLength / 4;

    const payload = data.slice(offset, offset + payloadLength * 2);
    offset += payloadLength * 2;

    let payloadOffset = 0;
    const commandType = parseInt(
      `0x${payload.slice(
        payloadOffset,
        payloadOffset + usableRadix.commandType / 4
      )}`,
      16
    );
    payloadOffset += usableRadix.commandType / 4;

    const protobufSize = parseInt(
      `0x${payload.slice(
        payloadOffset,
        payloadOffset + usableRadix.dataSize / 4
      )}`,
      16
    );
    payloadOffset += usableRadix.dataSize / 4;

    const rawSize = parseInt(
      `0x${payload.slice(
        payloadOffset,
        payloadOffset + usableRadix.dataSize / 4
      )}`,
      16
    );
    payloadOffset += usableRadix.dataSize / 4;

    const protobufData = payload.slice(
      payloadOffset,
      payloadOffset + protobufSize * 2
    );
    payloadOffset += protobufSize * 2;

    const rawData = payload.slice(payloadOffset, payloadOffset + rawSize * 2);
    payloadOffset += rawSize * 2;

    data = data.slice(offset);

    const commData =
      intToUintByte(sequenceNumber, usableRadix.sequenceNumber) +
      intToUintByte(rawSize + protobufSize, usableRadix.dataSize) +
      intToUintByte(currentPacketNumber, usableRadix.currentPacketNumber) +
      intToUintByte(totalPacketNumber, usableRadix.totalPacket) +
      intToUintByte(packetType, usableRadix.packetType) +
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
    if (rawSize + protobufSize > CHUNK_SIZE) {
      errorList.push('invalid data size');
    }
    if (actualCRC.toUpperCase() !== crc.toUpperCase()) {
      errorList.push('invalid crc');
    }
    packetList.push({
      startOfFrame,
      commandType,
      currentPacketNumber: Number(`0x${currentPacketNumber}`),
      totalPacket: Number(`0x${totalPacketNumber}`),
      dataSize: payloadLength,
      dataChunk: payload,
      crc: crc,
      actualCRC,
      protobufData,
      rawData,
      protobufSize,
      rawSize,
      errorList,
      sequenceNumber,
      packetType
    } as DecodedPacketData);
  }
  return packetList;
};

// function randomNumber(min: number, max: number) {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// for (let i = 0; i < 200; i += 1) {
//   const data = crypto.randomBytes(randomNumber(0, 100000) * 2).toString('hex');
//   const commandType = randomNumber(0, 100);
//   const packetType = randomNumber(0, 8);
//   const sequenceNumber = randomNumber(0, 100);

//   const packetList = encodePacket({
//     data,
//     commandType,
//     version: PacketVersionMap.v3,
//     packetType,
//     sequenceNumber
//   });
//   console.log({ i, totalPackets: packetList.length, dataLen: data.length / 2 });

//   let totalData: string[] = [];
//   const decodedPacketList = decodedPacket(
//     Buffer.from(packetList.join(''), 'hex'),
//     PacketVersionMap.v3
//   ) as any[];

//   for (const decodedPacket of decodedPacketList) {
//     if (decodedPacket.errorList.length > 0) {
//       throw new Error('Error in decoding packet');
//     }
//     totalData[decodedPacket.currentPacketNumber] = decodedPacket.rawData;

//     if (decodedPacket.sequenceNumber !== sequenceNumber) {
//       console.log(decodedPacket);
//       throw new Error('Invalid sequenceNumber');
//     }

//     if (decodedPacket.packetType !== packetType) {
//       console.log(decodedPacket);
//       throw new Error('Invalid packetType');
//     }
//   }

//   const totalDataStr = totalData.join('');
//   if (totalDataStr.toUpperCase() !== data.toUpperCase()) {
//     console.log(data);
//     console.log(totalData);
//     throw new Error('Invalid decoded data');
//   }
// }

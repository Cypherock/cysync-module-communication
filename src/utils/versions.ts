export type PacketVersion = 'v1' | 'v2';

export const PacketVersionMap = {
  v1: 'v1' as PacketVersion,
  v2: 'v2' as PacketVersion
};

// Order is from older to newer
export const PacketVersionList = Object.values(PacketVersionMap);

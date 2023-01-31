import compareVersions from 'compare-versions';
export enum FeatureName {
  Default = 0,
  TokenNameRestructure,
  GetCoinListFromDevice,
  EvmLongChainId,
  WalletConnectSupport
}

// both from and to are inclusive
const FeatureMap: Record<FeatureName, { from: string; to?: string }> = {
  [FeatureName.Default]: { from: '0.0.0', to: '2.0.0' },
  [FeatureName.TokenNameRestructure]: { from: '2.1.0' },
  [FeatureName.GetCoinListFromDevice]: { from: '2.3.0' },
  [FeatureName.EvmLongChainId]: { from: '2.4.0' },
  [FeatureName.WalletConnectSupport]: { from: '2.6.0' }
};

export const isFeatureEnabled = (
  featureName: FeatureName,
  sdkVersion: string
): boolean => {
  const { from, to } = FeatureMap[featureName];
  let enabled = compareVersions(from, sdkVersion) < 1;
  if (to) enabled = enabled && compareVersions(to, sdkVersion) >= 0;
  return enabled;
};

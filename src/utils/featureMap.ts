export enum FeatureName{
  Default = 0,
  TokenNameRestructure,
}

const FeatureMap:Record<string, FeatureName> ={
  '2.1.0': FeatureName.TokenNameRestructure
};

export const getFeatureNameFromSdkVersion = (sdk:string):FeatureName=>{
  return FeatureMap[sdk] ?? FeatureName.Default;
}
import React from 'react';
import { View, Text } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// ViroReact cannot run inside standard Expo Go. It requires a custom native build.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let ViroARSceneNavigatorMock = (props: any) => (
  <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <Text style={{ color: '#FFF', fontSize: 18, textAlign: 'center' }}>
      AR is not supported inside standard Expo Go.
    </Text>
    <Text style={{ color: '#AAA', fontSize: 14, textAlign: 'center', marginTop: 10 }}>
      You must build a custom Dev Client (npx expo run:android) to view AR.
    </Text>
  </View>
);

let realViro = null;
if (!isExpoGo) {
  try {
    realViro = require('@viro-community/react-viro');
  } catch (e) {
    console.warn("Viro not installed/linked properly.");
  }
}

export const ViroARSceneNavigator = isExpoGo || !realViro ? ViroARSceneNavigatorMock : realViro.ViroARSceneNavigator;
export const ViroARScene = isExpoGo || !realViro ? ({ children }: any) => <>{children}</> : realViro.ViroARScene;
export const Viro3DObject = isExpoGo || !realViro ? () => null : realViro.Viro3DObject;
export const ViroAmbientLight = isExpoGo || !realViro ? () => null : realViro.ViroAmbientLight;
export const ViroSpotLight = isExpoGo || !realViro ? () => null : realViro.ViroSpotLight;
export const ViroNode = isExpoGo || !realViro ? ({ children }: any) => <>{children}</> : realViro.ViroNode;
export const ViroSkyBox = isExpoGo || !realViro ? () => null : realViro.ViroSkyBox;

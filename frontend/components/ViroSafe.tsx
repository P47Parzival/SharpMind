import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Smartphone } from 'lucide-react-native';

const StubComponent = (name: string) => () => {
  console.warn(`Viro component ${name} is not supported on web.`);
  return null;
};

if (typeof window === 'undefined') {
  export const ViroARScene = ({ children }: any) => <>{children}</>;
  export const ViroARSceneNavigator = (props: any) => (
    <View style={styles.container}>
      <Smartphone color="#6C63FF" size={64} style={{ marginBottom: 20 }} />
      <Text style={styles.title}>AR Not Supported on Web</Text>
      <Text style={styles.subtitle}>Please open this app on your Android or iOS device to experience Augmented Reality!</Text>
    </View>
  );
  export const ViroNode = ({ children }: any) => <>{children}</>;
  export const Viro3DObject = () => null;
  export const ViroAmbientLight = () => null;
  export const ViroSpotLight = () => null;
  export const ViroSkyBox = () => null;
} else {
  const viro = require("@viro-community/react-viro");
  export const ViroARScene = viro.ViroARScene;
  export const ViroNode = viro.ViroNode;
  export const Viro3DObject = viro.Viro3DObject;
  export const ViroAmbientLight = viro.ViroAmbientLight;
  export const ViroSpotLight = viro.ViroSpotLight;
  export const ViroARSceneNavigator = viro.ViroARSceneNavigator;
  export const ViroSkyBox = viro.ViroSkyBox;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#AAA', textAlign: 'center', lineHeight: 24 }
});

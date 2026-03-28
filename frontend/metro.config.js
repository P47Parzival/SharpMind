// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add AR 3D model extensions to Metro assets so require() works for them
config.resolver.assetExts.push('glb', 'gltf', 'obj', 'mtl', 'vrx');

module.exports = withNativeWind(config, { input: './global.css' });

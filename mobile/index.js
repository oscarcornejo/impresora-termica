/**
 * @format
 */

// supabase-js necesita la API URL completa, que React Native no trae.
import 'react-native-url-polyfill/auto';
import { AppRegistry } from 'react-native';
import { App } from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

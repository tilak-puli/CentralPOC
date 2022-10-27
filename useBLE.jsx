import {Platform, PermissionsAndroid} from 'react-native';
import {BleManager} from 'react-native-ble-plx';
import {useState} from 'react';

const bleManager = new BleManager();

const isDuplicateDevice = (allDevices, nextDevice) =>
  allDevices.findIndex(device => device.id === nextDevice.id) > -1;

export default function useBLE() {
  const [devices, setDevices] = useState([]);

  const scanDevices = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        alert('Failed to start scan');
        return;
      }

      setDevices(prev => {
        if (!isDuplicateDevice(prev, device)) {
          return [...prev, device];
        }

        return prev;
      });
    });
  };

  const getDeviceDetails = async device => {
    if (!(await bleManager.isDeviceConnected(device.id))) {
      device = await device.connect();
    }

    device = await device.discoverAllServicesAndCharacteristics();
    const services = await device.services();
    const promises = services.map(async service => ({
      characteristics: await service.characteristics(),
      service: service,
    }));

    const details = await Promise.all(promises);

    return {device, details};
  };

  const requestPermissions = async callback => {
    if (Platform.OS === 'android') {
      const grantedSuccess = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Needed for BLE to work',
          buttonNegative: 'Cancel',
          buttonPositive: 'Ok',
          buttonNeutral: 'Maybe later',
        },
      );
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      callback(grantedSuccess === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      callback(true);
    }
  };

  return {
    requestPermissions,
    scanForDevices: scanDevices,
    getDeviceDetails,
    devices,
  };
}

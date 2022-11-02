import {Platform, PermissionsAndroid} from 'react-native';
import BleManager, {retrieveServices} from 'react-native-ble-manager';
import {useState} from 'react';
import Base64 from 'react-native-base64';

const bleManager = {};

export default function useBLE() {
  const [devices, setDevices] = useState([]);

  const scanDevices = async () => {
    console.log('scanning for devices');
    try {
      BleManager.scan(['AB25'], 15, false).then(async e => {
        console.log('scan done');
        const peripherals = await BleManager.getDiscoveredPeripherals();
        console.log(peripherals);

        setDevices(peripherals);
      });
    } catch (error) {
      console.log(error);
      alert('Failed to start scan');
      return;
    }
  };

  const readCharacteristic = async (service, cid) => {
    let device = await bleManager.connectToDevice(service.deviceID);
    console.log('connected to device');
    device = await device.discoverAllServicesAndCharacteristics();
    console.log('discovered');
    let value = await device.readCharacteristicForService(service.uuid, cid);
    console.log('read: ' + JSON.stringify(value));

    await device.cancelConnection();

    return value;
  };

  const writeCharacteristic = async (service, cid, data) => {
    let device = await bleManager.connectToDevice(service.deviceID);
    console.log('connected to device');
    device = await device.discoverAllServicesAndCharacteristics();
    console.log('discovered');
    const value = await device.writeCharacteristicWithResponseForService(
      service.uuid,
      cid,
      Base64.encode(data),
    );
    console.log('wrote and got response: ' + JSON.stringify(value));

    await device.cancelConnection();

    return value;
  };

  const getDeviceDetails = async device => {
    return await retrieveServices(device.id);
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

  const start = async () => {
    BleManager.enableBluetooth()
      .then(() => {
        BleManager.start().then(() => {
          console.log('Module initialized');
        });
      })
      .catch(e => {
        console.error('User rejected: ', e);
        alert(
          'Bluetooth is required to scan. Please enable bluetooth and restart the app',
        );
      });
  };

  return {
    requestPermissions,
    scanForDevices: scanDevices,
    getDeviceDetails,
    readCharacteristic,
    writeCharacteristic,
    devices,
    start,
  };
}

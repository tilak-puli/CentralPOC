import {Platform, PermissionsAndroid} from 'react-native';
import {BleErrorCode, BleManager} from 'react-native-ble-plx';
import {useState} from 'react';
import Base64 from 'react-native-base64';

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

  async function getUniqueServices(device) {
    let services = await device.services();
    const uniqueServiceUUID = {};
    return services.filter(service => {
      if (uniqueServiceUUID[service.uuid] === undefined) {
        uniqueServiceUUID[service.uuid] = 1;
        return true;
      }

      return false;
    });
  }

  const readCharacteristic = async (service, cid) => {
    let device = await bleManager.connectToDevice(service.deviceID);
    console.log('connected to device');
    device = await device.discoverAllServicesAndCharacteristics();
    console.log('discovered');
    console.log(await device.requestMTU(512));
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
    device = await device.requestMTU(512);

    const value = await device.writeCharacteristicWithoutResponseForService(
      service.uuid,
      cid,
      Base64.encode(data),
    );
    console.log('wrote and got response: ' + JSON.stringify(value));

    await device.cancelConnection();

    return value;
  };

  const getDeviceDetails = async device => {
    device = await device.connect();
    device = await device.discoverAllServicesAndCharacteristics();
    let services = await getUniqueServices(device);

    const promises = services.map(async service => ({
      characteristics: await service.characteristics(),
      service: service,
    }));

    const details = await Promise.all(promises);
    await device.cancelConnection();

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
    readCharacteristic,
    writeCharacteristic,
    devices,
  };
}

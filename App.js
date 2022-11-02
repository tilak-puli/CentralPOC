import React, {useEffect, useState} from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import useBLE from './useBLE';
import Base64 from 'react-native-base64';

function DeviceBox(props: {device: any, onDeviceConnect: () => void}) {
  return (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Text style={styles.heading2}>{props.device.name || 'N/A'}</Text>
        <View style={styles.secondaryText}>
          <Text style={styles.secondaryTextName}>Id: </Text>
          <Text style={styles.secondaryTextValue}>{props.device.id}</Text>
        </View>
      </View>
      {props.device.serviceUUIDs?.length > 0 && (
        <View style={styles.listItemAction}>
          <TouchableOpacity
            onPress={() => props.onDeviceConnect(props.device)}
            style={styles.cButton}>
            <Text style={styles.cButtonText}>{'Connect'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function DevicesList(props: {devices: [], onDeviceConnect: () => {}}) {
  console.log(props.devices);
  return (
    <ScrollView style={styles.flexItem}>
      <Text style={styles.titlebar}>{'Available Devices'}</Text>
      <View style={styles.listWrapper}>
        {props.devices?.map(device => (
          <DeviceBox
            key={device.id}
            device={device}
            onDeviceConnect={props.onDeviceConnect}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function CharacteristicBox(props: {
  char: any,
  readValue: () => {},
  writeValue: () => {},
}) {
  const [data, setData] = useState('');
  const canRead = props.char.isReadable;
  const canWrite =
    props.char.isWritableWithResponse || props.char.isWritableWithoutResponse;

  const properties = [canRead && 'READ', canWrite && 'WRITE'].filter(
    v => v !== false,
  );

  return (
    <View style={styles.characteristicBox}>
      <Text style={styles.collapsedItemTitle}>Custom Characteristic</Text>
      <View style={styles.secondaryText}>
        <Text style={styles.secondaryTextName}>Id: </Text>
        <Text style={styles.secondaryTextValue}>{props.char.id}</Text>
      </View>
      <View style={styles.secondaryText}>
        <Text style={styles.secondaryTextName}>UUID: </Text>
        <Text style={styles.secondaryTextValue}>{props.char.uuid}</Text>
      </View>
      <View style={styles.secondaryText}>
        <Text style={styles.secondaryTextName}>Value: </Text>
        <Text style={styles.secondaryTextValue}>
          {Base64.decode(props.char.value || '')}
        </Text>
      </View>
      <View style={styles.secondaryText}>
        <Text style={styles.secondaryTextName}>Properties: </Text>
        <Text style={styles.secondaryTextValue}>{properties.join(', ')}</Text>
      </View>
      <View style={styles.secondaryText}>
        <Text style={styles.secondaryTextName}>Log: </Text>
        <Text style={styles.secondaryTextValue}>{props.char.message}</Text>
      </View>
      {canRead && (
        <TouchableOpacity
          onPress={() => props.readValue(props.char.uuid)}
          style={styles.viewDetailsButton}>
          <Text style={styles.cButtonText}>{'Read'}</Text>
        </TouchableOpacity>
      )}
      {canWrite && (
        <View>
          <TextInput
            style={styles.input}
            onChangeText={t => setData(t)}
            value={data}
            placeholder="Enter text to send"
          />
          <TouchableOpacity
            onPress={() => props.writeValue(props.char.uuid, data)}
            style={styles.viewDetailsButton}>
            <Text style={styles.cButtonText}>{'Write'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ServiceDetail(props: {
  detail: any,
  readValue: () => {},
  writeValue: () => {},
}) {
  const [collapsed, setCollapsed] = useState(true);
  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <View>
      <View style={styles.listItem}>
        <View style={styles.listItemContent}>
          <Text style={styles.heading2}>
            Custom Service: {props.detail.service.id}
          </Text>
          <View style={styles.secondaryText}>
            <Text style={styles.secondaryTextName}>UUID: </Text>
            <Text style={styles.secondaryTextValue}>
              {props.detail.service.uuid}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleCollapsed()}
            style={styles.viewDetailsButton}>
            <Text style={styles.cButtonText}>{'View'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!collapsed && (
        <View style={styles.collapsedView}>
          {props.detail.characteristics.map(char => (
            <CharacteristicBox
              char={char}
              key={char.id}
              readValue={props.readValue.bind(null, props.detail.service)}
              writeValue={props.writeValue.bind(null, props.detail.service)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function DeviceView(props: {
  device: {},
  readValue: () => {},
  writeValue: () => {},
  details: [],
}) {
  return (
    <SafeAreaView>
      <View>
        <Text style={styles.titlebar}>{props.device.name}</Text>
        <ScrollView style={styles.listWrapper}>
          {props.details.map((detail, k) => (
            <ServiceDetail
              detail={detail}
              key={k}
              readValue={props.readValue}
              writeValue={props.writeValue}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function updateCharacteristic(
  selectedDevice,
  serviceUUID,
  cid,
  getUpdatedChar,
) {
  for (let detail of selectedDevice.details) {
    if (detail.service?.uuid === serviceUUID) {
      console.log('found service');
      for (let cKey in detail.characteristics) {
        console.log('found characteristic');
        if (detail.characteristics[cKey]?.uuid === cid) {
          console.log('updating characteristic');
          detail.characteristics[cKey] = getUpdatedChar(
            detail.characteristics[cKey],
          );
          return {...selectedDevice};
        }
      }
    }
  }
}

const App: () => Node = () => {
  const {
    requestPermissions,
    scanForDevices,
    getDeviceDetails,
    readCharacteristic,
    writeCharacteristic,
    start,
    devices,
  } = useBLE();
  const [startedScan, setStartedScan] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // const {openModal, setOpenModal} = useState(false);

  const readValue = async (service, cid) => {
    const characteristic = await readCharacteristic(service, cid);

    const updatedSelectedDevice = updateCharacteristic(
      selectedDevice,
      characteristic.serviceUUID,
      cid,
      () => characteristic,
    );

    setSelectedDevice(updatedSelectedDevice);
  };

  const writeValue = async (service, cid, value) => {
    const characteristic = await writeCharacteristic(service, cid, value);

    const updatedSelectedDevice = updateCharacteristic(
      selectedDevice,
      characteristic.serviceUUID,
      cid,
      prev => {
        prev.message = 'Wrote Value: ' + Base64.decode(characteristic.value);
        return prev;
      },
    );

    setSelectedDevice(updatedSelectedDevice);
  };

  const onStart = () => {
    requestPermissions(granted => {
      if (granted) {
        scanForDevices();
        setStartedScan(true);
      }
    });
  };

  useEffect(() => {
    start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {startedScan ? (
        selectedDevice === null ? (
          <DevicesList
            devices={devices}
            onDeviceConnect={async d => {
              const {device, details} = await getDeviceDetails(d);
              await setSelectedDevice({ble: device, details});
            }}
          />
        ) : (
          <DeviceView
            device={selectedDevice.ble}
            details={selectedDevice.details}
            readValue={readValue}
            writeValue={writeValue}
          />
        )
      ) : (
        <View style={styles.center}>
          <TouchableOpacity onPress={onStart} style={styles.scButton}>
            <Text style={styles.scButtonText}>{'Start Scan'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    color: 'black',
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  flexItem: {
    flex: 1,
  },
  listWrapper: {},
  titlebar: {
    fontSize: 25,
    color: 'white',
    backgroundColor: '#3455d2',
    padding: 10,
  },
  secondaryText: {
    flexDirection: 'row',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 10,
    color: 'black',
    borderBottomColor: 'grey',
    borderBottomWidth: 1,
  },
  collapsedView: {
    paddingHorizontal: 50,
    paddingVertical: 10,
    color: 'black',
    borderBottomColor: 'grey',
    borderBottomWidth: 1,
  },
  listItemContent: {},
  listItemAction: {},
  heading2: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
    marginBottom: 5,
  },
  secondaryTextValue: {
    fontSize: 15,
    color: 'black',
  },
  secondaryTextName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
  },
  collapsedItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
  },
  characteristicBox: {
    marginBottom: 10,
  },
  heartRateText: {
    fontSize: 25,
    marginTop: 15,
  },
  scButton: {
    backgroundColor: 'purple',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  cButton: {
    backgroundColor: 'purple',
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    width: 50,
    borderRadius: 8,
  },
  viewDetailsButton: {
    backgroundColor: 'purple',
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    width: 40,
    borderRadius: 8,
    marginTop: 10,
  },
  scButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cButtonText: {
    fontSize: 10,
    color: 'white',
  },
});

export default App;

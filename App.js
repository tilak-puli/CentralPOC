import React, {useState} from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import useBLE from './useBLE';

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
  return (
    <View style={styles.flexItem}>
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
    </View>
  );
}

function ServiceDetail(props: {detail: any}) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  return (
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
      </View>
      {/*{!collapsed && <View>/!*<Text>{detail.}</Text>*!/</View>}*/}
    </View>
  );
}

function DeviceView(props: {device: {}, details: []}) {
  console.log(props.details);
  return (
    <SafeAreaView>
      <View>
        <Text style={styles.titlebar}>{props.device.name}</Text>
        <View style={styles.listWrapper}>
          {props.details.map(detail => (
            <ServiceDetail detail={detail} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const App: () => Node = () => {
  const {requestPermissions, scanForDevices, getDeviceDetails, devices} =
    useBLE();
  const [startedScan, setStartedScan] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // const {openModal, setOpenModal} = useState(false);

  const onStart = () => {
    requestPermissions(granted => {
      alert('granted: ' + granted);
      if (granted) {
        scanForDevices();
        setStartedScan(true);
      }
    });
  };

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

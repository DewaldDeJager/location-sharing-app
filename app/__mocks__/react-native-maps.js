import React from 'react';
import {View} from 'react-native';

const MapView = props => <View {...props}>{props.children}</View>;
const Marker = props => <View {...props} />;

MapView.Marker = Marker;

export {Marker};
export default MapView;

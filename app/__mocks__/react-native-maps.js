import React from 'react';
import {View} from 'react-native';

const MapView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
  }));
  return <View {...props}>{props.children}</View>;
});
const Marker = props => <View {...props} />;

MapView.Marker = Marker;

export {Marker};
export default MapView;

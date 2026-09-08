import React from 'react';
import { TabNavigator, TabNavigatorProps } from 'expo-router';

const Tab = TabNavigator;

export default function TabsLayout(props: TabNavigatorProps) {
  return (
    <Tab
      {...props}
      tabBar={() => null}
    />
  );
}
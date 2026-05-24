import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { GameScreen } from '../screens/GameScreen';
import { LocalGameScreen } from '../screens/LocalGameScreen';
import { ResultScreen } from '../screens/ResultScreen';

export type RootStackParamList = {
  Home: undefined;
  Lobby: undefined;
  LocalGame: undefined;
  Game: { mode: 'online' | 'local' };
  Result: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#8b7355' },
          headerTintColor: '#f5f0e8',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '天下太平' }} />
        <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Online Game 網上對戰' }} />
        <Stack.Screen name="LocalGame" component={LocalGameScreen} options={{ title: 'Local Game 本地對戰' }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ title: '天下太平' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Result 結果', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

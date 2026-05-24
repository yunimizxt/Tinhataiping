import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Gesture, TURN_TIMEOUT_MS } from '@tinhataiping/shared';
import { useGameStore } from '../store/gameStore';
import { submitGesture, getSocket } from '../socket/socketClient';
import { Fortress } from '../components/Fortress';
import { GesturePanel } from '../components/GesturePanel';
import { RoundReveal } from '../components/RoundReveal';
import { TurnTimer } from '../components/TurnTimer';
import { WeaponDrawingCanvas } from '../components/WeaponDrawingCanvas';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

export function GameScreen({ navigation, route }: Props) {
  const [showDrawing, setShowDrawing] = useState(false);

  const {
    gameState, myPlayerId, roomId, lastRoundResult,
  } = useGameStore();

  useEffect(() => {
    if (gameState?.phase === 'gameover') {
      navigation.replace('Result');
    }
  }, [gameState?.phase]);

  // Show drawing canvas when player just earned a weapon
  useEffect(() => {
    if (!gameState || !myPlayerId) return;
    const myPlayer = gameState.p1.id === myPlayerId ? gameState.p1 : gameState.p2;
    if (myPlayer.hasWeapon && !myPlayer.weaponDrawing) {
      setShowDrawing(true);
    }
  }, [gameState?.p1.hasWeapon, gameState?.p2.hasWeapon]);

  if (!gameState) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  const myPlayer = gameState.p1.id === myPlayerId ? gameState.p1 : gameState.p2;
  const oppPlayer = gameState.p1.id === myPlayerId ? gameState.p2 : gameState.p1;
  const canChoose = gameState.phase === 'choosing' && !myPlayer.hasChosen;

  function handleGestureSelect(g: Gesture) {
    if (!canChoose || !roomId) return;
    submitGesture(roomId, g);
  }

  function handleWeaponDrawn(pathData: string) {
    setShowDrawing(false);
    if (roomId) {
      getSocket().emit('game:weapon_drawing', { roomId, drawingPath: pathData });
    }
  }

  const showReveal = gameState.phase === 'resolving' && lastRoundResult != null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.round}>Round {gameState.round}</Text>

        <View style={styles.fortressArea}>
          <Fortress player={oppPlayer} isOpponent label={oppPlayer.name || 'Opponent'} />
          {oppPlayer.hasChosen && canChoose && (
            <Text style={styles.chosenBadge}>✓ Chosen</Text>
          )}
        </View>

        <View style={styles.center}>
          <TurnTimer durationMs={TURN_TIMEOUT_MS} active={gameState.phase === 'choosing'} />
          {showReveal && (
            <RoundReveal result={lastRoundResult!} myPlayerId={myPlayerId ?? ''} />
          )}
        </View>

        <View style={styles.fortressArea}>
          <Fortress player={myPlayer} label={myPlayer.name || 'You'} />
          {myPlayer.hasChosen && canChoose && (
            <Text style={styles.chosenBadge}>✓ Chosen</Text>
          )}
        </View>

        <GesturePanel
          onSelect={handleGestureSelect}
          selected={myPlayer.gesture}
          disabled={!canChoose}
        />
      </View>

      {showDrawing && (
        <WeaponDrawingCanvas
          playerName={myPlayer.name}
          onDone={handleWeaponDrawn}
          onSkip={() => setShowDrawing(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperBg },
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'space-between' },
  round: { textAlign: 'center', fontSize: 13, color: colors.stoneDark, fontWeight: '600' },
  fortressArea: { alignItems: 'center', gap: 4 },
  center: { alignItems: 'center', gap: 8, minHeight: 80 },
  chosenBadge: { fontSize: 12, color: colors.shieldBlue, fontWeight: '600' },
});

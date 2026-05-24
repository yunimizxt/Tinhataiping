import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/gameStore';
import { createRoom, joinRoom } from '../socket/socketClient';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lobby'>;
};

export function LobbyScreen({ navigation }: Props) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'pick' | 'create' | 'join'>('pick');
  const [waiting, setWaiting] = useState(false);

  const { gameState, roomId, error, setError } = useGameStore();

  useEffect(() => {
    if (gameState?.phase === 'choosing' && gameState.p1.id && gameState.p2.id) {
      navigation.replace('Game', { mode: 'online' });
    }
  }, [gameState]);

  useEffect(() => {
    setError(null);
  }, [mode]);

  function handleCreate() {
    if (!playerName.trim()) return;
    setWaiting(true);
    createRoom(playerName.trim());
  }

  function handleJoin() {
    if (!playerName.trim() || !roomCode.trim()) return;
    setWaiting(true);
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  }

  if (mode === 'pick') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Online Game 網上對戰</Text>
          <View style={styles.nameSection}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => setMode('create')}
              disabled={!playerName.trim()}
            >
              <Text style={styles.btnText}>🏰 Create Room</Text>
              <Text style={styles.btnSub}>建立房間</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => setMode('join')}
              disabled={!playerName.trim()}
            >
              <Text style={styles.btnText}>🔑 Join Room</Text>
              <Text style={styles.btnSub}>加入房間</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'create') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Create Room</Text>
          {!waiting ? (
            <>
              <Text style={styles.info}>Share the room code with a friend after creating.</Text>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleCreate}>
                <Text style={styles.btnText}>🏰 Create Game Room</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('pick')}>
                <Text style={styles.back}>← Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.waiting}>
              <ActivityIndicator size="large" color={colors.buttonWood} />
              {roomId ? (
                <>
                  <Text style={styles.codeLabel}>Room Code 房間號碼</Text>
                  <View style={styles.codeBox}>
                    <Text style={styles.code}>{roomId}</Text>
                  </View>
                  <Text style={styles.info}>Share this code with your opponent!</Text>
                  <Text style={styles.waitText}>Waiting for opponent...</Text>
                </>
              ) : (
                <Text style={styles.waitText}>Creating room...</Text>
              )}
            </View>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  // mode === 'join'
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Join Room</Text>
        <View style={styles.nameSection}>
          <Text style={styles.label}>Room Code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={roomCode}
            onChangeText={(t) => setRoomCode(t.toUpperCase())}
            placeholder="ABCD"
            maxLength={4}
            autoCapitalize="characters"
            autoFocus
          />
        </View>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={handleJoin}
          disabled={!roomCode.trim() || waiting}
        >
          {waiting
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.btnText}>🔑 Join Game</Text>
          }
        </TouchableOpacity>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity onPress={() => { setMode('pick'); setError(null); }}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperBg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.inkBlack },
  label: { fontSize: 13, color: colors.stoneDark, fontWeight: '600' },
  info: { fontSize: 13, color: colors.gray, textAlign: 'center' },
  nameSection: { width: '100%', gap: 6 },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.stoneDark,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  buttons: { width: '100%', gap: 12 },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.stoneDark,
    alignItems: 'center',
    width: '100%',
  },
  btnPrimary: { backgroundColor: colors.buttonWood },
  btnSecondary: { backgroundColor: colors.shieldBlue },
  btnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  btnSub: { fontSize: 12, color: colors.stoneLight },
  back: { fontSize: 14, color: colors.stoneDark, marginTop: 8 },
  waiting: { alignItems: 'center', gap: 12 },
  codeLabel: { fontSize: 14, color: colors.stoneDark },
  codeBox: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.stoneLight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.stoneDark,
  },
  code: { fontSize: 40, fontWeight: 'bold', color: colors.inkBlack, letterSpacing: 8 },
  waitText: { fontSize: 14, color: colors.gray, fontStyle: 'italic' },
  error: { fontSize: 13, color: colors.accentRed, textAlign: 'center' },
});

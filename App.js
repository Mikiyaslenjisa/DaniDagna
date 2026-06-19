import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert
} from 'react-native';

const initialCols = ['A', 'B', 'C', 'D'];
const TOTAL = 120;
const MAX_BALL = 15;

const makeEmptyRow = (cols) => {
  const row = {};
  cols.forEach(c => row[c] = '');
  return row;
};

export default function App() {
  const [title, setTitle] = useState('Dani Dagna');
  const [editingTitle, setEditingTitle] = useState(false);
  const [cols, setCols] = useState([...initialCols]);
  const [rows, setRows] = useState([makeEmptyRow(initialCols)]);
  const [eliminated, setEliminated] = useState([]);
  const [notification, setNotification] = useState('');
  const [winner, setWinner] = useState('');
  const inputRefs = useRef({});
  const jumpTimers = useRef({});

  const getEnteredCounts = (currentRows) => {
    const counts = {};
    (currentRows || rows).forEach(row => {
      cols.forEach(col => {
        const v = parseFloat(row[col]);
        if (!isNaN(v) && v > 0) counts[v] = (counts[v] || 0) + 1;
      });
    });
    return counts;
  };

  const getSum = (col, currentRows) => {
    const r = currentRows || rows;
    return r.reduce((acc, row) => {
      const v = parseFloat(row[col]);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
  };

  const getPositiveSum = (col, currentRows) => {
    const r = currentRows || rows;
    return r.reduce((acc, row) => {
      const v = parseFloat(row[col]);
      return acc + (isNaN(v) || v < 0 ? 0 : v);
    }, 0);
  };

  const totalScored = (currentRows) =>
    cols.reduce((acc, c) => acc + getPositiveSum(c, currentRows), 0);

  const remaining = (currentRows) => TOTAL - totalScored(currentRows);

  useEffect(() => {
    if (winner) return;
    const rem = remaining(rows);
    const activeCols = cols.filter(c => !eliminated.includes(c));
    if (activeCols.length === 0) return;

    const scores = activeCols.map(c => ({ col: c, score: getSum(c, rows) }));
    const maxScore = Math.max(...scores.map(s => s.score));

    const newlyEliminated = scores
      .filter(s => s.score + rem < maxScore)
      .map(s => s.col);

    const allEliminated = [...new Set([...eliminated, ...newlyEliminated])];
    const stillActive = cols.filter(c => !allEliminated.includes(c));

    if (newlyEliminated.length > 0) {
      setEliminated(allEliminated);
      if (stillActive.length === 1) {
        const winScore = getSum(stillActive[0], rows);
        setWinner(stillActive[0]);
        setNotification(`🏆 Player ${stillActive[0]} WINS with ${winScore} pts!`);
        return;
      } else {
        const outNames = newlyEliminated.join(', ');
        const leftNames = stillActive.join(' & ');
        setNotification(`❌ Player ${outNames} ${newlyEliminated.length > 1 ? 'are' : 'is'} out!\n✅ Player ${leftNames} still in the game!`);
      }
    }

    if (rem === 0 && !winner) {
      const activeScores = stillActive.map(c => ({ col: c, score: getSum(c, rows) }));
      const topScore = Math.max(...activeScores.map(s => s.score));
      const topPlayers = activeScores.filter(s => s.score === topScore);
      if (topPlayers.length === 1) {
        setWinner(topPlayers[0].col);
        setNotification(`🏆 Player ${topPlayers[0].col} WINS with ${topScore} pts!`);
      } else {
        setNotification(`🤝 Tie! Players ${topPlayers.map(s => s.col).join(' & ')} with ${topScore} pts!`);
      }
    }
  }, [rows]);

  const focusNextOrCreate = (rowIdx, col) => {
    const nextRowIdx = rowIdx + 1;
    if (nextRowIdx < rows.length) {
      const key = `${nextRowIdx}-${col}`;
      inputRefs.current[key]?.focus();
    } else {
      setRows(prev => {
        const newRows = [...prev, makeEmptyRow(cols)];
        setTimeout(() => {
          const key = `${nextRowIdx}-${col}`;
          inputRefs.current[key]?.focus();
        }, 100);
        return newRows;
      });
    }
  };

  const validateAndJump = (rowIdx, col, num, currentRows) => {
    const oldVal = parseFloat(currentRows[rowIdx][col]);
    const oldPositive = (!isNaN(oldVal) && oldVal > 0) ? oldVal : 0;

    if (num > MAX_BALL) {
      Alert.alert('Invalid!', `Maximum ball number is ${MAX_BALL}`);
      setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [col]: '' } : r));
      return;
    }

    const counts = getEnteredCounts(currentRows);
    const currentCount = counts[num] || 0;
    const countWithoutCurrent = oldPositive === num ? currentCount - 1 : currentCount;
    const maxAllowed = num === 6 ? 2 : 1;
    if (countWithoutCurrent >= maxAllowed) {
      const msg = num === 6 ? `Ball 6 can only be entered twice!` : `Ball ${num} has already been used!`;
      Alert.alert('Duplicate!', msg);
      setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [col]: '' } : r));
      return;
    }

    const newTotal = totalScored(currentRows);
    if (newTotal > TOTAL) {
      const canAdd = TOTAL - totalScored(currentRows) + oldPositive;
      Alert.alert('Exceeds 120!', `Only ${canAdd} point${canAdd === 1 ? '' : 's'} remaining!`);
      setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [col]: '' } : r));
      return;
    }

    setTimeout(() => focusNextOrCreate(rowIdx, col), 50);
  };

  const updateCell = (rowIdx, col, value) => {
    const safe = value.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, '');

    if (safe === '' || safe === '-') {
      setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [col]: safe } : r));
      return;
    }

    const num = parseFloat(safe);
    const updated = rows.map((r, i) => i === rowIdx ? { ...r, [col]: safe } : r);
    setRows(updated);

    if (num > 0) {
      const timerKey = `${rowIdx}-${col}`;
      if (jumpTimers.current[timerKey]) {
        clearTimeout(jumpTimers.current[timerKey]);
      }

      if (num >= 4 && num <= 9 && safe.length === 1) {
        // 4-9: jump immediately
        validateAndJump(rowIdx, col, num, updated);
      } else if (safe.length === 1 && num >= 1 && num <= 3) {
        // 1-3: wait 1500ms in case user types 2nd digit (10-15 start with 1)
        jumpTimers.current[timerKey] = setTimeout(() => {
          setRows(prev => {
            const currentVal = prev[rowIdx]?.[col];
            if (currentVal === safe) {
              validateAndJump(rowIdx, col, num, prev);
            }
            return prev;
          });
        }, 1500);
      } else if (safe.length === 2) {
        // 10-15: jump after 2nd digit
        validateAndJump(rowIdx, col, num, updated);
      }
    }
  };

  const addRow = () => {
    if (remaining(rows) <= 0) {
      Alert.alert('Game Over!', 'All 120 points have been used!');
      return;
    }
    setRows([...rows, makeEmptyRow(cols)]);
  };

  const deleteRow = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const deleteCol = (col) => {
    Alert.alert('Delete column', `Remove column "${col}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          const newCols = cols.filter(c => c !== col);
          const newRows = rows.map(r => { const nr = { ...r }; delete nr[col]; return nr; });
          setCols(newCols);
          setRows(newRows);
          setEliminated(prev => prev.filter(c => c !== col));
          setNotification('');
          setWinner('');
        }
      }
    ]);
  };

  const addCol = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const existing = new Set(cols);
    let newCol = '';
    for (let i = 0; i < letters.length; i++) {
      if (!existing.has(letters[i])) { newCol = letters[i]; break; }
    }
    if (!newCol) return;
    setCols([...cols, newCol]);
    setRows(rows.map(r => ({ ...r, [newCol]: '' })));
  };

  const resetGame = () => {
    Alert.alert('Reset Game', 'Clear all scores and start over?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: () => {
          setRows([makeEmptyRow(cols)]);
          setEliminated([]);
          setNotification('');
          setWinner('');
        }
      }
    ]);
  };

  const COL_W = 78;
  const rem = remaining(rows);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#191919" />

      <View style={styles.header}>
        {editingTitle ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            onBlur={() => setEditingTitle(false)}
            autoFocus selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingTitle(true)}>
            <Text style={styles.title}>{title}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerRow2}>
          <View style={styles.remainingBox}>
            <Text style={styles.remainingLabel}>Remaining: </Text>
            <Text style={[styles.remainingVal, rem < 20 && { color: '#e05c5c' }]}>
              {rem} / {TOTAL} pts
            </Text>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={resetGame} activeOpacity={0.7}>
            <Text style={styles.resetText}>🔄 Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.ruleText}>Balls: 1–15  •  Total: 120 pts  •  No repeats</Text>
      </View>

      {notification ? (
        <View style={[styles.notifBox, winner && styles.winnerBox]}>
          <Text style={[styles.notifText, winner && styles.winnerText]}>{notification}</Text>
          <TouchableOpacity onPress={() => setNotification('')} style={styles.notifCloseBtn}>
            <Text style={styles.notifClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
        <View style={styles.statusRow}>
          {cols.map(col => {
            const score = getSum(col, rows);
            const isOut = eliminated.includes(col);
            const isWin = winner === col;
            return (
              <View key={col} style={[styles.statusCard, isOut && styles.statusCardOut, isWin && styles.statusCardWin]}>
                <Text style={[styles.statusName, isOut && styles.statusNameOut, isWin && styles.statusNameWin]}>
                  {isWin ? '🏆 ' : isOut ? '❌ ' : '🎱 '}Player {col}
                </Text>
                <Text style={[styles.statusScore, isOut && styles.statusScoreOut, isWin && { color: '#f39c12' }]}>
                  {score} pts
                </Text>
                {!isOut && !isWin && rem > 0 && (
                  <Text style={styles.statusMax}>max: {score + rem}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.colHeaderRow}>
              {cols.map(col => (
                <View key={col} style={[styles.colHeaderCell, { width: COL_W }, eliminated.includes(col) && styles.eliminatedCol]}>
                  <Text style={[styles.headerText, eliminated.includes(col) && styles.eliminatedText]}>
                    {eliminated.includes(col) ? '❌' : winner === col ? '🏆' : '#'} {col}
                  </Text>
                  <TouchableOpacity onPress={() => deleteCol(col)} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.colDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[styles.colHeaderCell, { width: 48, justifyContent: 'center', alignItems: 'center' }]} onPress={addCol} activeOpacity={0.7}>
                <Text style={styles.addColText}>＋</Text>
              </TouchableOpacity>
              <View style={[styles.colHeaderCell, { width: 48 }]} />
            </View>

            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.dataRow}>
                {cols.map((col, colIdx) => (
                  <View key={col} style={[styles.cell, { width: COL_W }, eliminated.includes(col) && styles.eliminatedCellBg]}>
                    <TextInput
                      ref={ref => inputRefs.current[`${rowIdx}-${col}`] = ref}
                      style={[
                        styles.cellInput,
                        eliminated.includes(col) && styles.eliminatedCellText,
                        parseFloat(row[col]) < 0 && styles.negativeInput,
                      ]}
                      value={row[col]}
                      onChangeText={v => updateCell(rowIdx, col, v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#333"
                      textAlign="right"
                      selectionColor="#4a90d9"
                      editable={!eliminated.includes(col) && rem > 0 && !winner}
                      maxLength={3}
                      returnKeyType="next"
                      onSubmitEditing={() => focusNextOrCreate(rowIdx, col)}
                    />
                  </View>
                ))}
                <View style={[styles.cell, { width: 48 }]} />
                <TouchableOpacity
                  style={[styles.cell, styles.deleteCell, { width: 48 }]}
                  onPress={() => deleteRow(rowIdx)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.trashIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addRow} onPress={addRow} activeOpacity={0.7}>
              <Text style={styles.addRowText}>＋  Add row</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScrollView>

      <Text style={styles.devText}>Mikeylan 😎</Text>

    </KeyboardAvoidingView>
  );
}

const BG = '#191919';
const SURFACE = '#232323';
const BORDER = '#2e2e2e';
const TEXT = '#e8e8e8';
const MUTED = '#888';
const ACCENT = '#4a90d9';
const NEGATIVE = '#e05c5c';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: BG },
  title: { fontSize: 28, fontWeight: '700', color: TEXT, marginBottom: 8 },
  titleInput: { fontSize: 28, fontWeight: '700', color: TEXT, borderBottomWidth: 1.5, borderBottomColor: ACCENT, paddingBottom: 2, marginBottom: 8 },
  headerRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  remainingBox: { flexDirection: 'row', alignItems: 'center' },
  remainingLabel: { color: MUTED, fontSize: 13 },
  remainingVal: { color: '#2ecc71', fontSize: 16, fontWeight: '700' },
  resetBtn: { backgroundColor: '#2a2a2a', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#3a3a3a' },
  resetText: { color: TEXT, fontSize: 13, fontWeight: '600' },
  ruleText: { color: '#555', fontSize: 10, marginTop: 2 },
  notifBox: { backgroundColor: '#0d1f2b', borderLeftWidth: 4, borderLeftColor: ACCENT, marginHorizontal: 16, marginBottom: 6, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'flex-start' },
  winnerBox: { backgroundColor: '#2b1f00', borderLeftColor: '#f39c12' },
  notifText: { color: ACCENT, fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 22 },
  winnerText: { color: '#f39c12', fontSize: 16 },
  notifCloseBtn: { padding: 4, marginLeft: 8 },
  notifClose: { color: MUTED, fontSize: 16 },
  statusScroll: { maxHeight: 80, marginHorizontal: 16, marginBottom: 6 },
  statusRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  statusCard: { backgroundColor: SURFACE, borderRadius: 10, padding: 8, minWidth: 80, alignItems: 'center', borderWidth: 0.5, borderColor: BORDER },
  statusCardOut: { backgroundColor: '#161616', borderColor: '#2a2a2a', opacity: 0.5 },
  statusCardWin: { backgroundColor: '#2b1f00', borderColor: '#f39c12', borderWidth: 1.5 },
  statusName: { color: TEXT, fontSize: 11, fontWeight: '600' },
  statusNameOut: { color: '#444', textDecorationLine: 'line-through' },
  statusNameWin: { color: '#f39c12' },
  statusScore: { color: ACCENT, fontSize: 14, fontWeight: '700', marginTop: 2 },
  statusScoreOut: { color: '#333' },
  statusMax: { color: '#555', fontSize: 9, marginTop: 1 },
  scrollArea: { flex: 1 },
  colHeaderRow: { flexDirection: 'row', backgroundColor: SURFACE, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  colHeaderCell: { borderRightWidth: 0.5, borderRightColor: BORDER, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  headerText: { color: MUTED, fontSize: 12, fontWeight: '500' },
  colDeleteText: { color: NEGATIVE, fontSize: 14, fontWeight: '700' },
  addColText: { color: ACCENT, fontSize: 18 },
  eliminatedCol: { backgroundColor: '#161616' },
  eliminatedText: { color: '#444', textDecorationLine: 'line-through' },
  cell: { borderRightWidth: 0.5, borderRightColor: BORDER, height: 48, justifyContent: 'center' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  cellInput: { color: TEXT, fontSize: 14, paddingHorizontal: 10, height: '100%' },
  negativeInput: { color: NEGATIVE },
  eliminatedCellBg: { backgroundColor: '#161616' },
  eliminatedCellText: { color: '#333' },
  deleteCell: { alignItems: 'center' },
  trashIcon: { fontSize: 18, color: NEGATIVE },
  addRow: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  addRowText: { color: ACCENT, fontSize: 14, fontWeight: '500' },
  devText: { textAlign: 'center', color: '#2ecc71', fontSize: 11, paddingVertical: 6, fontWeight: '600' },
});

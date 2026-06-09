import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert
} from 'react-native';

const initialCols = ['A', 'B', 'C', 'D'];
const TOTAL = 120;

const makeEmptyRow = (cols) => {
  const row = {};
  cols.forEach(c => row[c] = '');
  return row;
};

export default function App() {
  const [title, setTitle] = useState('Dani Dagna');
  const [editingTitle, setEditingTitle] = useState(false);
  const [cols, setCols] = useState(initialCols);
  const [rows, setRows] = useState([
    { A: '6', B: '7',  C: '', D: '' },
    { A: '4', B: '8',  C: '', D: '' },
    { A: '5', B: '9',  C: '', D: '' },
    { A: '6', B: '10', C: '', D: '' },
    { A: '',  B: '11', C: '', D: '' },
    { A: '',  B: '12', C: '', D: '' },
  ]);
  const [eliminated, setEliminated] = useState([]);
  const [notification, setNotification] = useState('');

  const getSum = (col) => {
    return rows.reduce((acc, r) => {
      const v = parseFloat(r[col]);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
  };

  const totalScored = () => cols.reduce((acc, c) => acc + getSum(c), 0);
  const remaining = () => TOTAL - totalScored();

  // Auto-eliminate logic
  useEffect(() => {
    const rem = remaining();
    const activeCols = cols.filter(c => !eliminated.includes(c));
    if (activeCols.length <= 2) return;

    // Find the highest score among active players
    const scores = activeCols.map(c => ({ col: c, score: getSum(c) }));
    const maxScore = Math.max(...scores.map(s => s.score));

    // A player is eliminated if even getting ALL remaining points
    // still can't beat the current leader
    const newlyEliminated = scores
      .filter(s => s.score + rem < maxScore && !eliminated.includes(s.col))
      .map(s => s.col);

    if (newlyEliminated.length > 0) {
      const allEliminated = [...eliminated, ...newlyEliminated];
      setEliminated(allEliminated);

      const stillActive = cols.filter(c => !allEliminated.includes(c));
      const outNames = newlyEliminated.join(', ');
      const leftNames = stillActive.join(' & ');

      if (stillActive.length === 1) {
        setNotification(`🏆 Player ${leftNames} WINS! All others are out!`);
      } else {
        setNotification(
          `❌ Player${newlyEliminated.length > 1 ? 's' : ''} ${outNames} ${newlyEliminated.length > 1 ? 'are' : 'is'} out of the game!\n✅ Only Player ${leftNames} ${stillActive.length === 1 ? 'wins' : 'remain'}!`
        );
      }
    }
  }, [rows]);

  const updateCell = (rowIdx, col, value) => {
    const safe = value
      .replace(/[^0-9.\-]/g, '')
      .replace(/(?!^)-/g, '')
      .replace(/(\.\d*)\./g, '$1');
    setRows(rows.map((r, i) => i === rowIdx ? { ...r, [col]: safe } : r));
  };

  const addRow = () => {
    setRows([...rows, makeEmptyRow(cols)]);
  };

  const deleteRow = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const deleteCol = (col) => {
    Alert.alert('Delete column', `Remove column "${col}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const newCols = cols.filter(c => c !== col);
        const newRows = rows.map(r => {
          const nr = { ...r };
          delete nr[col];
          return nr;
        });
        setCols(newCols);
        setRows(newRows);
        setEliminated(eliminated.filter(c => c !== col));
        setNotification('');
      }}
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
    Alert.alert('Reset', 'Clear all scores?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => {
        setRows(rows.map(r => makeEmptyRow(cols)));
        setEliminated([]);
        setNotification('');
      }}
    ]);
  };

  const COL_W = 72;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#191919" />

      {/* Header */}
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
            <Text style={styles.remainingLabel}>Remaining</Text>
            <Text style={[styles.remainingVal, remaining() < 20 && { color: '#e05c5c' }]}>
              {remaining()} pts
            </Text>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification banner */}
      {notification ? (
        <View style={styles.notifBox}>
          <Text style={styles.notifText}>{notification}</Text>
          <TouchableOpacity onPress={() => setNotification('')}>
            <Text style={styles.notifClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Table */}
      <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>

            {/* Column headers with delete button */}
            <View style={styles.colHeaderRow}>
              {cols.map(col => (
                <View key={col} style={[
                  styles.colHeaderCell,
                  { width: COL_W },
                  eliminated.includes(col) && styles.eliminatedCol
                ]}>
                  <Text style={[
                    styles.headerText,
                    eliminated.includes(col) && styles.eliminatedText
                  ]}>
                    # {col} {eliminated.includes(col) ? '❌' : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteCol(col)}
                    style={styles.colDeleteBtn}
                  >
                    <Text style={styles.colDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {/* Add column */}
              <TouchableOpacity
                style={[styles.colHeaderCell, { width: 48, justifyContent: 'center', alignItems: 'center' }]}
                onPress={addCol}
              >
                <Text style={styles.addColText}>＋</Text>
              </TouchableOpacity>
              {/* Delete row header spacer */}
              <View style={[styles.colHeaderCell, { width: 48 }]} />
            </View>

            {/* Data rows */}
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.dataRow}>
                {cols.map(col => (
                  <View key={col} style={[
                    styles.cell,
                    { width: COL_W },
                    eliminated.includes(col) && styles.eliminatedCellBg
                  ]}>
                    <TextInput
                      style={[
                        styles.cellInput,
                        parseFloat(row[col]) < 0 && styles.negativeInput,
                        eliminated.includes(col) && styles.eliminatedCellText
                      ]}
                      value={row[col]}
                      onChangeText={v => updateCell(rowIdx, col, v)}
                      keyboardType="default"
                      placeholder="0"
                      placeholderTextColor="#333"
                      textAlign="right"
                      selectionColor="#4a90d9"
                      editable={!eliminated.includes(col)}
                    />
                  </View>
                ))}
                {/* Add col spacer */}
                <View style={[styles.cell, { width: 48 }]} />
                {/* Delete row */}
                <TouchableOpacity
                  style={[styles.cell, styles.deleteCell, { width: 48 }]}
                  onPress={() => deleteRow(rowIdx)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.trashIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add row */}
            <TouchableOpacity style={styles.addRow} onPress={addRow}>
              <Text style={styles.addRowText}>＋  Add row</Text>
            </TouchableOpacity>

            {/* SUM footer */}
            <View style={styles.sumRow}>
              {cols.map(col => {
                const s = getSum(col);
                return (
                  <View key={col} style={[
                    styles.cell, styles.sumCell,
                    { width: COL_W },
                    eliminated.includes(col) && styles.eliminatedCellBg
                  ]}>
                    <Text style={styles.sumLabel}>SUM </Text>
                    <Text style={[
                      styles.sumVal,
                      s < 0 && styles.negativeSum,
                      eliminated.includes(col) && styles.eliminatedCellText
                    ]}>{s}</Text>
                  </View>
                );
              })}
              <View style={[styles.cell, styles.sumCell, { width: 48 }]} />
              <View style={[styles.cell, styles.sumCell, { width: 48 }]} />
            </View>

          </View>
        </ScrollView>
      </ScrollView>

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
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: BG },
  title: { fontSize: 28, fontWeight: '700', color: TEXT, marginBottom: 10 },
  titleInput: {
    fontSize: 28, fontWeight: '700', color: TEXT,
    borderBottomWidth: 1.5, borderBottomColor: ACCENT,
    paddingBottom: 2, marginBottom: 10,
  },
  headerRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remainingBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  remainingLabel: { color: MUTED, fontSize: 13 },
  remainingVal: { color: '#2ecc71', fontSize: 16, fontWeight: '700' },
  resetBtn: { backgroundColor: '#2a2a2a', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  resetText: { color: MUTED, fontSize: 13 },
  notifBox: {
    backgroundColor: '#1a2a1a', borderLeftWidth: 4, borderLeftColor: '#2ecc71',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 8,
    padding: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  notifText: { color: '#2ecc71', fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 22 },
  notifClose: { color: MUTED, fontSize: 16, marginLeft: 8 },
  scrollArea: { flex: 1 },
  colHeaderRow: {
    flexDirection: 'row', backgroundColor: SURFACE,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  colHeaderCell: {
    borderRightWidth: 0.5, borderRightColor: BORDER,
    height: 44, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerText: { color: MUTED, fontSize: 12, fontWeight: '500' },
  colDeleteBtn: { padding: 4 },
  colDeleteText: { color: NEGATIVE, fontSize: 13, fontWeight: '700' },
  addColText: { color: ACCENT, fontSize: 18 },
  eliminatedCol: { backgroundColor: '#1a1a1a' },
  eliminatedText: { color: '#444', textDecorationLine: 'line-through' },
  cell: { borderRightWidth: 0.5, borderRightColor: BORDER, height: 48, justifyContent: 'center' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  cellInput: { color: TEXT, fontSize: 14, paddingHorizontal: 10, height: '100%' },
  negativeInput: { color: NEGATIVE },
  eliminatedCellBg: { backgroundColor: '#161616' },
  eliminatedCellText: { color: '#333' },
  deleteCell: { alignItems: 'center', backgroundColor: 'transparent' },
  trashIcon: { fontSize: 16, color: NEGATIVE },
  addRow: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  addRowText: { color: ACCENT, fontSize: 14, fontWeight: '500' },
  sumRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#3a3a3a', backgroundColor: SURFACE },
  sumCell: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 40 },
  sumLabel: { color: MUTED, fontSize: 11 },
  sumVal: { color: TEXT, fontSize: 12, fontWeight: '700' },
  negativeSum: { color: NEGATIVE },
});

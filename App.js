import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';

const COLS = ['A', 'B', 'C', 'D'];

const initialRows = [
  { A: '5', B: '15', C: '', D: '9' },
  { A: '6', B: '6',  C: '', D: '11' },
  { A: '',  B: '4',  C: '', D: '' },
  { A: '',  B: '10', C: '', D: '' },
  { A: '',  B: '7',  C: '', D: '' },
  { A: '',  B: '8',  C: '', D: '' },
  { A: '-2',B: '',   C: '', D: '' },
];

export default function App() {
  const [title, setTitle] = useState('Dani Dagna');
  const [editingTitle, setEditingTitle] = useState(false);
  const [rows, setRows] = useState(initialRows);

  const updateCell = (rowIdx, col, value) => {
    const safe = value
      .replace(/[^0-9.\-]/g, '')
      .replace(/(?!^)-/g, '')
      .replace(/(\.\d*)\./g, '$1');
    setRows(rows.map((r, i) => i === rowIdx ? { ...r, [col]: safe } : r));
  };

  const addRow = () => {
    setRows([...rows, { A: '', B: '', C: '', D: '' }]);
  };

  const deleteRow = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const getSum = (col) => {
    const total = rows.reduce((acc, r) => {
      const v = parseFloat(r[col]);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
    return parseFloat(total.toFixed(4));
  };

  const COL_W = 72;

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
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingTitle(true)}>
            <Text style={styles.title}>{title}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>

            <View style={styles.headerRow}>
              {COLS.map(col => (
                <View key={col} style={[styles.cell, styles.headerCell, { width: COL_W }]}>
                  <Text style={styles.headerText}># {col}</Text>
                </View>
              ))}
              <View style={[styles.cell, styles.headerCell, { width: 48 }]}>
                <Text style={styles.headerText}> </Text>
              </View>
            </View>

            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.dataRow}>
                {COLS.map(col => (
                  <View key={col} style={[styles.cell, { width: COL_W }]}>
                    <TextInput
                      style={[
                        styles.cellInput,
                        parseFloat(row[col]) < 0 && styles.negativeInput
                      ]}
                      value={row[col]}
                      onChangeText={v => updateCell(rowIdx, col, v)}
                      keyboardType="default"
                      placeholder="0"
                      placeholderTextColor="#444"
                      textAlign="right"
                      selectionColor="#4a90d9"
                    />
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.cell, styles.deleteCell, { width: 48 }]}
                  onPress={() => deleteRow(rowIdx)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.trashIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addRow} onPress={addRow}>
              <Text style={styles.addRowText}>＋  Add row</Text>
            </TouchableOpacity>

            <View style={styles.sumRow}>
              {COLS.map(col => {
                const s = getSum(col);
                return (
                  <View key={col} style={[styles.cell, styles.sumCell, { width: COL_W }]}>
                    <Text style={styles.sumLabel}>SUM </Text>
                    <Text style={[styles.sumVal, s < 0 && styles.negativeSum]}>{s}</Text>
                  </View>
                );
              })}
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
  title: { fontSize: 30, fontWeight: '700', color: TEXT },
  titleInput: {
    fontSize: 30, fontWeight: '700', color: TEXT,
    borderBottomWidth: 1.5, borderBottomColor: ACCENT, paddingBottom: 2,
  },
  scrollArea: { flex: 1 },
  headerRow: {
    flexDirection: 'row', backgroundColor: SURFACE,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  headerCell: { justifyContent: 'center' },
  headerText: { color: MUTED, fontSize: 12, fontWeight: '500', paddingLeft: 10 },
  cell: {
    borderRightWidth: 0.5, borderRightColor: BORDER,
    height: 48, justifyContent: 'center',
  },
  dataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  cellInput: { color: TEXT, fontSize: 14, paddingHorizontal: 10, height: '100%' },
  negativeInput: { color: NEGATIVE },
  deleteCell: { alignItems: 'center', backgroundColor: 'transparent' },
  trashIcon: { fontSize: 20, color: '#e05c5c' },
  addRow: {
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  addRowText: { color: ACCENT, fontSize: 14, fontWeight: '500' },
  sumRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: '#3a3a3a',
    backgroundColor: SURFACE,
  },
  sumCell: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, height: 40,
  },
  sumLabel: { color: MUTED, fontSize: 11 },
  sumVal: { color: TEXT, fontSize: 12, fontWeight: '700' },
  negativeSum: { color: NEGATIVE },
});

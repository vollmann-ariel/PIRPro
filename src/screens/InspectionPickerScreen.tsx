import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ContextMenu, type ContextMenuPosition } from '../components/ContextMenu';
import {
  createInspection,
  deleteInspectionRow,
  findSimilarInspection,
  listAllInspections,
  updateInspectionVin,
} from '../db/inspections-repository';
import { deleteReportCompletely, listReportsByInspection } from '../db/reports-repository';
import { colors, elevation, radius, spacing, typography } from '../theme/tokens';
import { TIPOS_PRUEBA, type Inspection, type TipoPrueba } from '../types/inspection';
import { confirmDestructive } from '../utils/confirm';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionPicker'>;

const TIPO_COLORS: Record<TipoPrueba, string> = {
  PAT: colors.plantAR,
  SD: colors.plantBR,
  PPV: colors.severity6,
  Screening: colors.textSecondary,
};

export function InspectionPickerScreen({ navigation }: Props) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
  const [editingVinText, setEditingVinText] = useState('');
  const [menuPosition, setMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [menuTarget, setMenuTarget] = useState<Inspection | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newVin, setNewVin] = useState('');
  const [newTipo, setNewTipo] = useState<TipoPrueba | null>(null);

  const refresh = useCallback(() => {
    setInspections(listAllInspections());
  }, []);

  useFocusEffect(refresh);

  function openInspection(inspection: Inspection) {
    navigation.navigate('ProblemList', { inspectionId: inspection.id });
  }

  function handleLongPress(inspection: Inspection, event: { nativeEvent: { pageX: number; pageY: number } }) {
    setMenuTarget(inspection);
    setMenuPosition({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
  }

  function handleStartEditVin(inspection: Inspection) {
    setEditingInspectionId(inspection.id);
    setEditingVinText(inspection.vin);
  }

  function handleSaveVinEdit() {
    if (!editingInspectionId) return;
    const trimmed = editingVinText.trim();
    if (trimmed) updateInspectionVin(editingInspectionId, trimmed);
    setEditingInspectionId(null);
    refresh();
  }

  function handleDeleteInspection(inspection: Inspection) {
    const reports = listReportsByInspection(inspection.id);
    confirmDestructive(
      'Eliminar reporte completo',
      `Se van a borrar las ${reports.length} observaciones registradas para este VIN. Esta acción no se puede deshacer.`,
      'Eliminar todo',
      () => {
        for (const report of reports) deleteReportCompletely(report.id);
        deleteInspectionRow(inspection.id);
        refresh();
      }
    );
  }

  function handleOpenCreateModal() {
    setNewVin('');
    setNewTipo(null);
    setIsCreateModalVisible(true);
  }

  function handleCreate() {
    if (!newTipo) return;
    const vin = newVin.trim();
    if (!vin) return;

    const similar = findSimilarInspection(newTipo, vin);
    if (similar) {
      Alert.alert(
        'Reporte parecido encontrado',
        `Ya existe un reporte ${similar.tipoPrueba} con VIN "${similar.vin}". ¿Es el mismo?`,
        [
          { text: 'Usar ese', onPress: () => { setIsCreateModalVisible(false); openInspection(similar); } },
          { text: 'Crear nuevo', style: 'destructive', onPress: () => { setIsCreateModalVisible(false); openInspection(createInspection(newTipo, vin)); } },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }
    setIsCreateModalVisible(false);
    openInspection(createInspection(newTipo, vin));
  }

  const canCreate = newVin.trim().length > 0 && newTipo != null;

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={inspections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) =>
          item.id === editingInspectionId ? (
            <View style={styles.item}>
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editingVinText}
                  onChangeText={setEditingVinText}
                  autoCapitalize="characters"
                  autoFocus
                  onSubmitEditing={handleSaveVinEdit}
                />
                <Pressable accessibilityRole="button" accessibilityLabel="Guardar VIN" style={styles.editButton} onPress={handleSaveVinEdit}>
                  <Text style={styles.editButtonText}>✓</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Cancelar edición" style={styles.editButton} onPress={() => setEditingInspectionId(null)}>
                  <Text style={styles.editButtonText}>✕</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.item}
              onPress={() => openInspection(item)}
              onLongPress={(event) => handleLongPress(item, event)}
            >
              <View style={[styles.tipoBadge, { backgroundColor: TIPO_COLORS[item.tipoPrueba] }]}>
                <Text style={styles.tipoBadgeText}>{item.tipoPrueba}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemVin}>{item.vin}</Text>
                <Text style={styles.itemMeta}>Actualizado {new Date(item.lastActivityAt).toLocaleDateString()}</Text>
              </View>
            </Pressable>
          )
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No hay reportes. Usá + para crear uno.</Text>}
      />

      <Pressable
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Nuevo reporte"
        onPress={handleOpenCreateModal}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsCreateModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Nuevo reporte</Text>

            <Text style={styles.modalLabel}>VIN</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Número de chasis"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              value={newVin}
              onChangeText={setNewVin}
              autoFocus
            />

            <Text style={styles.modalLabel}>Tipo de prueba</Text>
            <View style={styles.chipRow}>
              {TIPOS_PRUEBA.map((tipo) => {
                const selected = tipo === newTipo;
                return (
                  <Pressable
                    key={tipo}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && { backgroundColor: TIPO_COLORS[tipo], borderColor: TIPO_COLORS[tipo] }]}
                    onPress={() => setNewTipo(tipo)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tipo}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setIsCreateModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
                disabled={!canCreate}
                onPress={handleCreate}
              >
                <Text style={styles.createButtonText}>Crear</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ContextMenu
        visible={menuPosition != null}
        position={menuPosition}
        onDismiss={() => setMenuPosition(null)}
        items={
          menuTarget
            ? [
                { label: 'Exportar', onPress: () => navigation.navigate('Export', { inspectionId: menuTarget.id }) },
                { label: 'Editar VIN', onPress: () => handleStartEditVin(menuTarget) },
                { label: 'Eliminar', destructive: true, onPress: () => handleDeleteInspection(menuTarget) },
              ]
            : []
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  listContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 96 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    minWidth: 52,
    alignItems: 'center',
  },
  tipoBadgeText: { ...typography.label, color: colors.textInverse, fontSize: 11 },
  itemInfo: { flex: 1 },
  itemVin: { ...typography.subtitle, color: colors.textPrimary },
  itemMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editInput: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    ...typography.subtitle,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { fontSize: 16, color: colors.textPrimary },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level2,
  },
  fabText: { color: colors.textInverse, fontSize: 28, lineHeight: 28 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.level2,
  },
  modalTitle: { ...typography.subtitle, color: colors.textPrimary },
  modalLabel: { ...typography.label, color: colors.textSecondary },
  modalInput: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: { ...typography.label, color: colors.textPrimary },
  chipTextSelected: { color: colors.textInverse },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center' },
  cancelButtonText: { ...typography.subtitle, color: colors.textPrimary },
  createButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  createButtonDisabled: { opacity: 0.4 },
  createButtonText: { ...typography.subtitle, color: colors.textInverse },
});

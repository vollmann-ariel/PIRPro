import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, spacing, typography } from '../theme/tokens';

export type ContextMenuItem = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export type ContextMenuPosition = { x: number; y: number };

type Props = {
  visible: boolean;
  position: ContextMenuPosition | null;
  items: ContextMenuItem[];
  onDismiss: () => void;
};

const MENU_WIDTH = 200;
const ITEM_HEIGHT = 44;
const SCREEN_MARGIN = 8;

export function ContextMenu({ visible, position, items, onDismiss }: Props) {
  if (!position) return null;

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const menuHeight = items.length * ITEM_HEIGHT;
  const left = Math.min(position.x, screenWidth - MENU_WIDTH - SCREEN_MARGIN);
  const top = Math.min(position.y, screenHeight - menuHeight - SCREEN_MARGIN);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={[styles.menu, { left, top, width: MENU_WIDTH }]}>
          {items.map((item, index) => (
            <Pressable
              key={item.label}
              accessibilityRole="menuitem"
              style={[styles.item, index < items.length - 1 && styles.itemBorder]}
              onPress={() => {
                onDismiss();
                item.onPress();
              }}
            >
              <Text style={[styles.itemText, item.destructive && styles.itemTextDestructive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...elevation.level2,
  },
  item: { height: ITEM_HEIGHT, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemText: { ...typography.body, color: colors.textPrimary },
  itemTextDestructive: { color: colors.danger },
});

import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';

type Category = {
  id: string;
  name: string;
};

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const CategoryChips: React.FC<Props> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  if (categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={{ paddingRight: 16 }}
    >
      <Chip
        label="All"
        active={selectedId === null}
        onPress={() => onSelect(null)}
        color="#0ea5e9"
      />
      {categories.map((c, index) => (
        <Chip
          key={c.id}
          label={c.name}
          active={selectedId === c.id}
          onPress={() => onSelect(c.id)}
          color={index % 2 === 0 ? '#22c55e' : '#f97316'}
        />
      ))}
    </ScrollView>
  );
};

const Chip = ({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      {
        backgroundColor: active ? color : '#e5e7eb',
      },
    ]}
  >
    <Text
      style={[
        styles.chipText,
        { color: active ? '#f9fafb' : '#374151' },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default CategoryChips;
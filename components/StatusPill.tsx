import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  status: string;
};

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: '#fef3c7',
    text: '#92400e',
    label: 'Pending approval',
  },
  approved: {
    bg: '#dbeafe',
    text: '#1d4ed8',
    label: 'Approved – ready to borrow',
  },
  borrowed: {
    bg: '#ede9fe',
    text: '#5b21b6',
    label: 'Currently borrowed',
  },
  returned: {
    bg: '#dcfce7',
    text: '#15803d',
    label: 'Returned – awaiting check',
  },
  completed: {
    bg: '#bbf7d0',
    text: '#166534',
    label: 'Completed',
  },
  cancelled: {
    bg: '#fee2e2',
    text: '#b91c1c',
    label: 'Cancelled',
  },
};

const StatusPill: React.FC<Props> = ({ status }) => {
  const lower = status.toLowerCase();
  const style = STATUS_STYLES[lower] || {
    bg: '#e5e7eb',
    text: '#111827',
    label: status,
  };

  return (
    <View
      style={[styles.pill, { backgroundColor: style.bg }]}
    >
      <Text style={[styles.text, { color: style.text }]}>
        {style.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusPill;
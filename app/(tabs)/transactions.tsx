import {
    addDoc,
    collection,
    doc,
    increment,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import StatusPill from '../../components/StatusPill';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebaseConfig';

type Transaction = {
  id: string;
  userId: string;
  itemId: string;
  status: string;
  requestedAt?: any;
};

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Transaction[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, 'id'>),
        }));
        setTransactions(list);
        setLoading(false);
      },
      (error) => {
        console.error('Transactions onSnapshot error:', error);
        Alert.alert('Error', error.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const changeStatus = async (
    txObj: Transaction,
    newStatus: string
  ) => {
    try {
      const txRef = doc(db, 'transactions', txObj.id);

      const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'approved') {
        updates.approvedAt = serverTimestamp();
      } else if (newStatus === 'borrowed') {
        updates.borrowedAt = serverTimestamp();
      } else if (newStatus === 'returned') {
        updates.returnedAt = serverTimestamp();
      } else if (newStatus === 'cancelled') {
        updates.cancelledAt = serverTimestamp();
      } else if (newStatus === 'completed') {
        updates.completedAt = serverTimestamp();
      }

      await updateDoc(txRef, updates);

      const itemRef = doc(db, 'items', txObj.itemId);
      const itemUpdates: any = {};

      if (newStatus === 'cancelled') {
        itemUpdates.status = 'available';
      } else if (newStatus === 'borrowed') {
        itemUpdates.status = 'reserved';
      } else if (newStatus === 'returned' || newStatus === 'completed') {
        itemUpdates.status = 'available';
      }

      if (Object.keys(itemUpdates).length > 0) {
        itemUpdates.updatedAt = serverTimestamp();
        await updateDoc(itemRef, itemUpdates);
      }

      await Promise.all([
        addDoc(collection(db, 'activityLogs'), {
          type: 'STATUS_CHANGED',
          userId: txObj.userId,
          itemId: txObj.itemId,
          transactionId: txObj.id,
          metadata: { newStatus },
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'notifications'), {
          userId: txObj.userId,
          transactionId: txObj.id,
          title: 'Transaction updated',
          body: `Status changed to ${newStatus}.`,
          read: false,
          createdAt: serverTimestamp(),
        }),
      ]);

      if (newStatus === 'completed') {
        await Promise.all([
          addDoc(collection(db, 'reviews'), {
            userId: txObj.userId,
            itemId: txObj.itemId,
            transactionId: txObj.id,
            rating: 5,
            comment:
              'Auto review: borrow completed successfully.',
            createdAt: serverTimestamp(),
          }),
          updateDoc(doc(db, 'users', txObj.userId), {
            points: increment(10),
            updatedAt: serverTimestamp(),
          }),
        ]);

        Alert.alert(
          'Nice!',
          'Transaction completed. You just earned 10 points.'
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (!user) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>
          Please log in to see your transactions.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
        <Text style={{ color: theme.colors.text }}>
          Loading transactions...
        </Text>
      </View>
    );
  }

  const pending = transactions.filter((t) => t.status === 'pending')
    .length;
  const active = transactions.filter((t) =>
    ['approved', 'borrowed', 'returned'].includes(t.status)
  ).length;
  const completed = transactions.filter(
    (t) => t.status === 'completed'
  ).length;
  const cancelled = transactions.filter(
    (t) => t.status === 'cancelled'
  ).length;

  return (
    <View
      style={[
        styles.outer,
        { backgroundColor: theme.colors.backgroundAlt },
      ]}
    >
      <View style={styles.summaryRow}>
        <SummaryChip
          label="Pending"
          value={pending}
          color="#f97316"
        />
        <SummaryChip
          label="Active"
          value={active}
          color={theme.colors.primary}
        />
        <SummaryChip
          label="Completed"
          value={completed}
          color={theme.colors.accent}
        />
        <SummaryChip
          label="Cancelled"
          value={cancelled}
          color={theme.colors.danger}
        />
      </View>

      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {transactions.length === 0 ? (
          <Text style={{ color: theme.colors.text }}>
            You have no transactions yet. Try borrowing something
            from Home.
          </Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Text
                  style={[
                    styles.idText,
                    { color: theme.colors.text },
                  ]}
                >
                  #{item.id.slice(0, 6)}
                </Text>
                <Text
                  style={[
                    styles.itemId,
                    { color: theme.colors.muted },
                  ]}
                >
                  Item ID: {item.itemId}
                </Text>

                <StatusPill status={item.status} />

                <View style={styles.actionsRow}>
                  {item.status === 'pending' && (
                    <>
                      <Button
                        title="Approve"
                        onPress={() =>
                          changeStatus(item, 'approved')
                        }
                      />
                      <Button
                        title="Cancel"
                        color="#b91c1c"
                        onPress={() =>
                          changeStatus(item, 'cancelled')
                        }
                      />
                    </>
                  )}

                  {item.status === 'approved' && (
                    <Button
                      title="Mark Borrowed"
                      onPress={() =>
                        changeStatus(item, 'borrowed')
                      }
                    />
                  )}

                  {item.status === 'borrowed' && (
                    <Button
                      title="Mark Returned"
                      onPress={() =>
                        changeStatus(item, 'returned')
                      }
                    />
                  )}

                  {item.status === 'returned' && (
                    <Button
                      title="Complete & Earn Points"
                      onPress={() =>
                        changeStatus(item, 'completed')
                      }
                    />
                  )}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const SummaryChip = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View style={[summaryStyles.chip, { backgroundColor: color }]}>
    <Text style={summaryStyles.value}>{value}</Text>
    <Text style={summaryStyles.label}>{label}</Text>
  </View>
);

const summaryStyles = StyleSheet.create({
  chip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  value: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  label: { color: '#e5e7eb', fontSize: 11 },
});

const styles = StyleSheet.create({
  outer: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginTop: 16,
  },
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  idText: { fontWeight: 'bold', marginBottom: 2 },
  itemId: { fontSize: 12, marginBottom: 4 },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
    gap: 8,
  },
});
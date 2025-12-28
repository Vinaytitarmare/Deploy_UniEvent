import { Ionicons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EventCard from '../components/EventCard';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { db } from '../lib/firebaseConfig';
import { theme as staticTheme } from '../lib/theme';

export default function MyEventsScreen({ navigation }) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'events'), 
            where('ownerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            // Sort client-side by date
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setEvents(list);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (eventId) => {
        Alert.alert(
            "Delete Event",
            "Are you sure? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'events', eventId));
                        } catch (e) {
                            Alert.alert("Error", "Could not delete event");
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <View style={[styles.center, {backgroundColor: theme.colors.background}]}><ActivityIndicator color={theme.colors.primary} /></View>;

    return (
        <ScreenWrapper>
             <View style={{ paddingHorizontal: staticTheme.spacing.s, marginBottom: staticTheme.spacing.m }}>
                 <Text style={[styles.brandTitle, { color: theme.colors.primary }]}>UniEvent</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 5}}>
                         <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[theme.typography.h2, { color: theme.colors.text }]}>My Events</Text>
                 </View>
             </View>

             <FlatList
                data={events}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: staticTheme.spacing.m }}
                ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.textSecondary }]}>You haven't created any events.</Text>}
                renderItem={({ item }) => (
                    <View>
                        <EventCard event={item} />
                        <View style={styles.actionRow}>
                             {/* Status Indicator */}
                             <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                                 <View style={[styles.dot, { backgroundColor: item.status === 'suspended' ? theme.colors.error : theme.colors.success }]} />
                                 <Text style={[
                                        styles.status, 
                                        { color: theme.colors.text }
                                    ]}>
                                        {item.status === 'suspended' ? 'SUSPENDED' : 'Active'}
                                 </Text>
                             </View>

                             {/* Action Buttons */}
                             <View style={{flexDirection: 'row', gap: 10}}>
                                <TouchableOpacity 
                                    style={[styles.btn, { backgroundColor: theme.colors.primary }]}
                                    onPress={() => navigation.navigate('EventAnalytics', { eventId: item.id })}
                                >
                                    <Ionicons name="bar-chart" size={16} color="#000" />
                                    <Text style={styles.btnText}>Analytics</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.btn, { backgroundColor: '#ffebee', borderWidth: 1, borderColor: '#ffcdd2' }]}
                                    onPress={() => handleDelete(item.id)}
                                >
                                    <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                                </TouchableOpacity>
                             </View>
                        </View>
                        {item.status === 'suspended' && (
                            <Text style={{ color: theme.colors.error, fontSize: 12, marginLeft: 15, marginBottom: 15, marginTop: -10 }}>
                                ⚠️ This event is not visible to students.
                            </Text>
                        )}
                    </View>
                )}
             />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    brandTitle: {
        fontSize: 32,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        marginBottom: 10,
        letterSpacing: 1,
    },
    header: { 
        // Removed original header style as we refactored the view structure
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 10
    },
    empty: { textAlign: 'center', marginTop: 50 },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 20,
        marginTop: -15, // Pull up closer to card
    },
    status: {
        fontSize: 14,
        fontWeight: '600',
    },
    dot: {
        width: 8, height: 8, borderRadius: 4
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    btnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    }
});

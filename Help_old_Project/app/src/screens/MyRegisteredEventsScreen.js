import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import EventCard from '../components/EventCard';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebaseConfig';
import { useTheme } from '../lib/ThemeContext';

export default function MyRegisteredEventsScreen({ navigation }) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Get all events where user is a participant
        const participatingRef = collection(db, 'users', user.uid, 'participating');
        const unsubParticipating = onSnapshot(participatingRef, async (snapshot) => {
            const eventIds = snapshot.docs.map(doc => doc.data().eventId);

            if (eventIds.length === 0) {
                setEvents([]);
                setLoading(false);
                return;
            }

            // Fetch event details for each registered event
            const eventsRef = collection(db, 'events');
            const q = query(eventsRef, where('__name__', 'in', eventIds));

            const unsubEvents = onSnapshot(q, (eventsSnapshot) => {
                const eventsList = eventsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEvents(eventsList);
                setLoading(false);
            });

            return () => unsubEvents();
        });

        return () => unsubParticipating();
    }, [user]);

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Ionicons name="ticket-outline" size={32} color={theme.colors.primary} />
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Registered Events</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                    {events.length} {events.length === 1 ? 'Event' : 'Events'}
                </Text>
            </View>

            {events.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={80} color={theme.colors.textSecondary} style={{ opacity: 0.3 }} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Registered Events</Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        Browse events and register to see them here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <EventCard
                            event={item}
                            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 12,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
});

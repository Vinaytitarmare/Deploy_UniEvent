import { Ionicons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebaseConfig';
import { useTheme } from '../lib/ThemeContext';

export default function RemindersScreen({ navigation }) {
    const { user } = useAuth();
    const { theme, isDarkMode } = useTheme();
    const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
    
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user) fetchReminders();
    }, [user]);

    const fetchReminders = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'reminders'),
                where('userId', '==', user.uid)
            );
            const snapshot = await getDocs(q);
            const list = [];
            const { getDoc } = require('firebase/firestore');
            
            // Parallel fetch for speed
            await Promise.all(snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                let eventTitle = 'Unknown Event';
                let eventLocation = '';
                try {
                    const eventDoc = await getDoc(doc(db, 'events', data.eventId));
                    if (eventDoc.exists()) {
                        const ed = eventDoc.data();
                        eventTitle = ed.title;
                        eventLocation = ed.location;
                    }
                } catch (e) { console.log(e) }

                list.push({ id: docSnap.id, eventTitle, eventLocation, ...data });
            }));
            
            // Sort by remindAt
            list.sort((a, b) => {
                const da = a.remindAt?.toDate ? a.remindAt.toDate() : new Date(a.remindAt);
                const db = b.remindAt?.toDate ? b.remindAt.toDate() : new Date(b.remindAt);
                return da - db;
            });

            setReminders(list);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert("Remove Reminder", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: async () => {
                try {
                    await deleteDoc(doc(db, 'reminders', id));
                    setReminders(prev => prev.filter(item => item.id !== id));
                } catch (error) {
                    Alert.alert("Error", "Could not delete reminder.");
                }
            }}
        ]);
    };

    const getRelativeTime = (dateStr) => {
        const date = dateStr?.toDate ? dateStr.toDate() : new Date(dateStr);
        const now = new Date();
        const diffMs = date - now;
        const diffMins = Math.round(diffMs / 60000);
        const diffHrs = Math.round(diffMs / 3600000);
        const diffDays = Math.round(diffMs / 86400000);

        if (diffMs < 0) return "Started";
        if (diffMins < 60) return `Starts in ${diffMins} mins`;
        if (diffHrs < 24) return `Starts in ${diffHrs} hours`;
        return `Starts in ${diffDays} days`;
    };

    return (
        <ScreenWrapper>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>My Reminders</Text>
                <TouchableOpacity onPress={fetchReminders} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{marginTop: 50}} />
            ) : (
                <FlatList
                    data={reminders}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReminders(); }} />}
                    renderItem={({ item }) => {
                         const dateObj = item.remindAt?.toDate ? item.remindAt.toDate() : new Date(item.remindAt);
                         return (
                            <TouchableOpacity 
                                style={styles.card} 
                                onPress={() => navigation.navigate('EventDetail', { eventId: item.eventId })}
                            >
                                <View style={styles.cardStripe} />
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.eventTitle} numberOfLines={1}>{item.eventTitle}</Text>
                                        <View style={styles.timeBadge}>
                                            <Text style={styles.timeBadgeText}>{getRelativeTime(item.remindAt)}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.row}>
                                        <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                                        <Text style={styles.dateText}>{dateObj.toLocaleString()}</Text>
                                    </View>
                                    {item.eventLocation ? (
                                        <View style={styles.row}>
                                            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                                            <Text style={styles.locationText}>{item.eventLocation}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alarm-outline" size={60} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>No upcoming reminders</Text>
                            <Text style={styles.emptySubText}>RSVP to events to set reminders automatically.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </ScreenWrapper>
    );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        paddingHorizontal: theme.spacing.s,
    },
    header: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
    refreshBtn: {
        padding: 8,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: theme.spacing.m,
        flexDirection: 'row',
        overflow: 'hidden',
        ...theme.shadows.small,
        elevation: 3, 
    },
    cardStripe: {
        width: 6,
        backgroundColor: theme.colors.primary,
    },
    cardContent: {
        flex: 1,
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        flex: 1,
        marginRight: 10,
    },
    timeBadge: {
        backgroundColor: isDarkMode ? '#333' : '#e3f2fd', 
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    timeBadgeText: {
        fontSize: 10,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    dateText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    locationText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    deleteBtn: {
        justifyContent: 'center',
        paddingHorizontal: 15,
        backgroundColor: isDarkMode ? '#3e2723' : '#fff0f0', 
        borderLeftWidth: 1,
        borderLeftColor: isDarkMode ? '#5d4037' : '#ffcdd2',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginTop: 10,
    },
    emptySubText: {
        color: theme.colors.textSecondary,
        marginTop: 5,
        fontSize: 14,
    }
});

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Removed SafeAreaView as we use native header now
import { useAuth } from '../lib/AuthContext';
import * as CalendarService from '../lib/CalendarService';
import { db } from '../lib/firebaseConfig';
import { scheduleEventReminder } from '../lib/notificationService';
import { useTheme } from '../lib/ThemeContext';
import { EventDetailSkeleton } from '../components/SkeletonLoader';

const { width } = Dimensions.get('window');

export default function EventDetail({ route, navigation }) {
    const { eventId } = route.params;
    const { user, role } = useAuth();
    const { theme } = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rsvpStatus, setRsvpStatus] = useState(null); // 'going', 'not_going'
    const [participantCount, setParticipantCount] = useState(0);

    // Definitions moved to top
    const isOwner = event?.ownerId === user.uid;
    const isAdmin = role === 'admin';

    useEffect(() => {
        const unsubEvent = onSnapshot(doc(db, 'events', eventId), (doc) => {
            if (doc.exists()) {
                setEvent({ id: doc.id, ...doc.data() });
            } else {
                Alert.alert("Error", "Event not found");
                navigation.goBack();
            }
            setLoading(false);
        });

        const unsubParticipants = onSnapshot(collection(db, `events/${eventId}/participants`), (snapshot) => {
            setParticipantCount(snapshot.size);
            const myDoc = snapshot.docs.find(d => d.id === user.uid);
            if (myDoc) setRsvpStatus('going');
            else setRsvpStatus(null);
        });

        return () => {
            unsubEvent();
            unsubParticipants();
        };
    }, [eventId, user.uid]);

    // Set Header Options (Right Button)
    useEffect(() => {
        if (isAdmin || isOwner) {
            navigation.setOptions({
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('EventAnalytics', { eventId, event })}
                        style={{ marginRight: 15 }}
                    >
                        <Ionicons name="stats-chart" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                )
            });
        }
    }, [navigation, isAdmin, isOwner, eventId, event, theme.colors.primary]);

    const toggleRsvp = async () => {
        if (!user) return;
        if (rsvpStatus !== 'going' && event.isPaid) {
            if (event.registrationLink) {
                Alert.alert("Paid Event", "Redirecting to registration page.", [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Proceed", onPress: () => {
                            openLink(event.registrationLink);
                            setTimeout(() => {
                                Alert.alert("Did you register?", "Mark yourself as registered if completed.", [
                                    { text: "No", style: "cancel" },
                                    { text: "Yes", onPress: () => performRsvp() }
                                ]);
                            }, 3000);
                        }
                    }
                ]);
                return;
            } else {
                // Navigate to In-App Payment
                navigation.navigate('Payment', { event, price: event.price || 0 });
                return;
            }
        }
        performRsvp();
    };

    const performRsvp = async () => {
        const ref = doc(db, 'events', eventId, 'participants', user.uid);
        const userRef = doc(db, 'users', user.uid, 'participating', eventId);
        const userProfileRef = doc(db, 'users', user.uid); // Ref for updating points

        try {
            if (rsvpStatus === 'going') {
                await deleteDoc(ref);
                await deleteDoc(userRef);
                // Deduct points
                await updateDoc(userProfileRef, {
                    points: increment(-10)
                });
                Alert.alert("Withdrawn", "You are no longer registered. (-10 Points)");
            } else {
                const userDoc = await getDoc(userProfileRef);
                const userData = userDoc.exists() ? userDoc.data() : {};
                await setDoc(ref, {
                    userId: user.uid,
                    email: user.email,
                    name: user.displayName || 'Anonymous',
                    branch: userData.branch || 'Unknown',
                    year: userData.year || 'Unknown',
                    joinedAt: new Date().toISOString()
                });
                await setDoc(userRef, { eventId: eventId, joinedAt: new Date().toISOString() });

                // Add points
                await updateDoc(userProfileRef, {
                    points: increment(10)
                });

                await addDoc(collection(db, 'users', user.uid, 'notifications'), {
                    title: 'Event Registered',
                    body: `You are going to ${event.title}`,
                    read: false,
                    createdAt: new Date().toISOString(),
                    eventId: eventId
                });

                await scheduleEventReminder(event);
                Alert.alert("Success", "Registered! (+10 Points)");
            }
        } catch (e) {
            console.error("RSVP Error: ", e);
            Alert.alert("Error", "Failed to update RSVP");
        }
    };

    // Google Calendar Integration
    const { request, response, promptAsync } = CalendarService.useCalendarAuth();

    useEffect(() => {
        if (response?.type === 'success') {
            const { access_token } = response.params;
            performAddToCalendar(access_token);
        }
    }, [response]);

    const performAddToCalendar = async (token) => {
        try {
            await CalendarService.addToCalendar(token, event);
            Alert.alert("Success", "Event added to Google Calendar!");
        } catch (e) {
            Alert.alert("Error", "Failed to add to calendar.");
        }
    };

    const openLink = (url) => {
        if (url) Linking.openURL(url).catch(err => Alert.alert("Error", "Invalid URL"));
    };

    if (loading || !event) return <EventDetailSkeleton />;


    const isSuspended = event.status === 'suspended';

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {/* Immersive Header */}
                {/* Immersive Header Image (Behind Glass Header) */}
                <ImageBackground
                    source={{ uri: event.bannerUrl || 'https://via.placeholder.com/800x600' }}
                    style={styles.headerImage}
                />

                {/* Content Sheet */}
                <View style={styles.contentSheet}>
                    {/* Title & Badge */}
                    <View style={styles.headerRow}>
                        <View style={styles.badgeContainer}>
                            <View style={[styles.badge, { backgroundColor: theme.colors.secondary }]}>
                                <Text style={styles.badgeText}>{event.category}</Text>
                            </View>
                            {event.isPaid ? (
                                <View style={[styles.badge, styles.paidBadge]}>
                                    <Text style={styles.badgeText}>₹{event.price}</Text>
                                </View>
                            ) : (
                                <View style={[styles.badge, styles.freeBadge]}>
                                    <Text style={styles.badgeTextFree}>Free</Text>
                                </View>
                            )}
                        </View>
                        {/* Organizer Link */}
                        <TouchableOpacity onPress={() => navigation.navigate('ClubProfile', { clubId: event.ownerId, clubName: event.organizerName || 'Host' })}>
                            <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 }}>
                                Hosted by {event.organizerName || 'Organizer'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.title}>{event.title}</Text>

                    {/* Date & Location Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Date & Time</Text>
                                <Text style={styles.infoValue}>
                                    {new Date(event.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {' • '}
                                    {new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            {/* Add to Calendar Button */}
                            <TouchableOpacity style={styles.calendarBtn} onPress={() => promptAsync()}>
                                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <Ionicons name="location" size={20} color={theme.colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Location</Text>
                                <Text style={styles.infoValue}>{event.location}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Suspended Warning */}
                    {isSuspended && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>⚠️ Event Suspended</Text>
                        </View>
                    )}

                    {/* Target Audience */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Who is it for?</Text>
                        <View style={styles.audienceTags}>
                            {(event.target?.departments || ['All']).map((dept, i) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{dept}</Text>
                                </View>
                            ))}
                            {(event.target?.years || ['All']).map((year, i) => (
                                <View key={i + 100} style={styles.tag}>
                                    <Text style={styles.tagText}>Year: {year}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>{event.description}</Text>
                    </View>

                    {/* Organizer Actions - Check-In System */}
                    {(isOwner || isAdmin) && (
                        <View style={styles.organizerSection}>
                            <View style={styles.organizerHeader}>
                                <View style={styles.headerLeft}>
                                    <View style={[styles.headerIconBox, { backgroundColor: theme.colors.primary + '20' }]}>
                                        <Ionicons name="shield-checkmark" size={18} color={theme.colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.organizerTitle, { color: theme.colors.text }]}>Organizer Tools</Text>
                                        <Text style={[styles.organizerSubtitle, { color: theme.colors.textSecondary }]}>Manage your event</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Check-In Card */}
                            <TouchableOpacity
                                style={styles.toolCard}
                                onPress={() => navigation.navigate('QRScanner', {
                                    eventId: event.id,
                                    eventTitle: event.title
                                })}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#FF9800', '#F57C00', '#E65100']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.cardGradient}
                                >
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardLeft}>
                                            <View style={styles.cardIconBox}>
                                                <Ionicons name="qr-code-outline" size={28} color="#fff" />
                                            </View>
                                            <View style={styles.cardText}>
                                                <Text style={styles.cardTitle}>Check-In Attendees</Text>
                                                <Text style={styles.cardSubtitle}>Scan QR codes at venue</Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Attendance Dashboard Card */}
                            <TouchableOpacity
                                style={styles.toolCard}
                                onPress={() => navigation.navigate('AttendanceDashboard', {
                                    eventId: event.id,
                                    eventTitle: event.title
                                })}
                                activeOpacity={0.9}
                            >
                                <View style={[styles.cardOutline, {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border
                                }]}>
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardLeft}>
                                            <View style={[styles.cardIconBox, {
                                                backgroundColor: theme.colors.primary + '20'
                                            }]}>
                                                <Ionicons name="analytics-outline" size={28} color={theme.colors.primary} />
                                            </View>
                                            <View style={styles.cardText}>
                                                <View style={styles.titleRow}>
                                                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>View Attendance</Text>
                                                    <View style={styles.liveIndicator}>
                                                        <View style={styles.livePulse} />
                                                        <Text style={styles.liveText}>LIVE</Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                                                    Real-time tracking & reports
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Chat & Meet Actions */}
                    <View style={styles.actionStack}>
                        {/* Join Chat Button - Only for attendees/owners */}
                        {(rsvpStatus === 'going' || isOwner || isAdmin) && (
                            <TouchableOpacity
                                style={[styles.actionBtnFull, { backgroundColor: theme.colors.secondary, marginBottom: 10 }]}
                                onPress={() => navigation.navigate('EventChat', { eventId, eventTitle: event.title })}
                            >
                                <Ionicons name="chatbubbles" size={20} color="#000" />
                                <Text style={[styles.actionBtnText, { color: '#000' }]}>Ask Query</Text>
                            </TouchableOpacity>
                        )}

                        {/* Meet Link */}
                        {event.eventMode === 'online' && (rsvpStatus === 'going' || isOwner) && event.meetLink && (
                            <TouchableOpacity style={styles.actionBtnFull} onPress={() => openLink(event.meetLink)}>
                                <Ionicons name="videocam" size={20} color="#fff" />
                                <Text style={styles.actionBtnText}>Join Google Meet</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Floating Action Bar */}
            {!isSuspended && (
                <View style={[styles.fabContainer, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.fabContent}>
                        <View>
                            <Text style={styles.fabSubText}>Attending</Text>
                            <Text style={styles.fabCount}>{participantCount} People</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.primaryBtn, rsvpStatus === 'going' && styles.secondaryBtn]}
                            onPress={toggleRsvp}
                        >
                            <Text style={[styles.primaryBtnText, rsvpStatus === 'going' && styles.secondaryBtnText]}>
                                {rsvpStatus === 'going' ? 'Registered ✓' : (event.isPaid && !event.registrationLink ? `Buy Ticket - ₹${event.price}` : 'RSVP Now')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const getStyles = (theme) => StyleSheet.create({
    loader: { marginTop: 50 },
    headerImage: {
        width: '100%',
        height: 350,
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerSafe: { marginHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between' },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    analyticsBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    contentSheet: {
        marginTop: -40,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 30,
        minHeight: 500,
    },
    badgeContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    paidBadge: { backgroundColor: '#FFECB3' },
    freeBadge: { backgroundColor: '#C8E6C9' },
    badgeText: { fontSize: 12, fontWeight: '700', color: '#000' },
    badgeTextFree: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        lineHeight: 34,
        marginBottom: 20,
    },
    infoCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        ...theme.shadows.small,
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
    calendarBtn: { marginLeft: 'auto', padding: 5 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
    description: { fontSize: 15, lineHeight: 24, color: theme.colors.textSecondary },
    audienceTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: { fontSize: 12, color: theme.colors.textSecondary },
    warningBox: {
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    warningText: { color: '#D32F2F', fontWeight: 'bold' },
    linkText: { color: theme.colors.primary, fontWeight: 'bold', textDecorationLine: 'underline' },
    organizerSection: {
        marginBottom: 24,
        gap: 12,
    },
    organizerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    organizerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    organizerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    toolCard: {
        borderRadius: 16,
        overflow: 'hidden',
        ...theme.shadows.medium,
    },
    cardGradient: {
        padding: 18,
    },
    cardOutline: {
        padding: 18,
        borderWidth: 1.5,
        borderRadius: 16,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    cardIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardText: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    cardSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    livePulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    liveText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    actionStack: { marginBottom: 20 },
    actionBtnFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00796b',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    fabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingBottom: 30,
    },
    fabContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fabSubText: { fontSize: 12, color: theme.colors.textSecondary },
    fabCount: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
    primaryBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    secondaryBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary },
    primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    secondaryBtnText: { color: theme.colors.primary },
});

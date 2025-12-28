import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';

export default function EventCard({ event, onLike, onShare, isLiked = false, isRegistered = false }) {
    const navigation = useNavigation();
    const { theme, isDarkMode } = useTheme();

    if (!event) return null;

    const dateObj = new Date(event.startAt);
    const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
    const day = dateObj.getDate();
    const time = dateObj.toLocaleString('default', { hour: 'numeric', minute: '2-digit', hour12: true });

    const Container = Platform.OS === 'ios' ? BlurView : View;
    const containerProps = Platform.OS === 'ios' ? { intensity: 50, tint: isDarkMode ? 'dark' : 'light' } : {};

    return (
        <TouchableOpacity
            style={styles.cardContainer}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
        >
            <Container
                {...containerProps}
                style={[
                    styles.card,
                    Platform.OS === 'android' && { backgroundColor: theme.colors.surface, opacity: 0.95 },
                    { borderColor: theme.colors.border }
                ]}
            >
                {/* IMAGE CONTAINER */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: event.bannerUrl || 'https://via.placeholder.com/800x400' }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.gradient}
                    />

                    {/* Top Badges */}
                    <View style={styles.topRow}>
                        <BlurView intensity={80} tint="light" style={styles.glassBadge}>
                            <Text style={styles.categoryText}>{event.category}</Text>
                        </BlurView>

                        {event.isPaid ? (
                            <View style={[styles.badge, { backgroundColor: '#FFECB3' }]}>
                                <Text style={styles.badgeText}>₹{event.price}</Text>
                            </View>
                        ) : (
                            <View style={[styles.badge, { backgroundColor: '#C8E6C9' }]}>
                                <Text style={[styles.badgeText, { color: '#2E7D32' }]}>Free</Text>
                            </View>
                        )}
                    </View>

                    {/* Registered Status */}
                    {isRegistered && (
                        <View style={styles.registeredBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#fff" />
                            <Text style={styles.registeredText}>Going</Text>
                        </View>
                    )}
                </View>

                {/* CONTENT */}
                <View style={styles.content}>
                    <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                        {event.title}
                    </Text>

                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                                {month} {day} • {time}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                {event.location}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                        <Text style={[styles.hostText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            By {event.organization || 'Event Organizer'}
                        </Text>
                    </View>
                </View>
            </Container>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 20,
        marginHorizontal: 20,
        borderRadius: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 6 }
        })
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    imageContainer: {
        height: 180,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
    topRow: {
        position: 'absolute',
        top: 15,
        left: 15,
        right: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    glassBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        overflow: 'hidden',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
        textTransform: 'uppercase',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    registeredBadge: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    registeredText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 10,
        lineHeight: 26,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    hostText: {
        fontSize: 12,
        fontStyle: 'italic',
    }
});

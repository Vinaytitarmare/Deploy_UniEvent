import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { theme } from '../lib/theme';

export default function EventCard({ event, onLike, onShare, isLiked = false, isRegistered = false }) {
  const navigation = useNavigation();
  const { theme } = useTheme();

  if (!event) return null;

  const dateObj = new Date(event.startAt);
  
  // Format Date: "OCT 15"
  const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = dateObj.getDate();
  
  // Format Time: "7 PM"
  const time = dateObj.toLocaleString('default', { hour: 'numeric', minute: '2-digit', hour12: true });

  // Fallback for second image if not present in data
  const flyerUrl = event.detailImageUrl || event.bannerUrl || 'https://via.placeholder.com/400x400';

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.surface, ...theme.shadows.default }]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
    >
        {/* 1. MAIN BANNER IMAGE (Top Layer) */}
        <View style={styles.bannerContainer}>
            <Image 
                source={{ uri: event.bannerUrl || 'https://via.placeholder.com/800x400' }} 
                style={styles.bannerImage}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)']}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Category Tag on Banner */}
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.categoryText, { color: theme.colors.text }]}>{event.category}</Text>
            </View>
            
            {/* Online Badge */}
            {event.eventMode === 'online' && (
                <View style={[styles.onlineBadge, { backgroundColor: theme.colors.error }]}>
                     <Ionicons name="videocam" size={12} color="#fff" />
                     <Text style={styles.onlineText}>LIVE</Text>
                </View>
            )}
        </View>

        {/* 2. CONTENT CONTAINER */}
        <View style={styles.contentContainer}>
            
            {/* FLYER IMAGE (Overlapping) */}
            <View style={[styles.flyerContainer, { borderColor: theme.colors.surface, ...theme.shadows.default }]}>
                <Image 
                    source={{ uri: flyerUrl }} 
                    style={styles.flyerImage}
                    resizeMode="cover" 
                />
            </View>

            {/* HEADER INFO (Right of Flyer) */}
            <View style={styles.headerInfo}>
                <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                    {event.title}
                </Text>
                <Text style={[styles.host, { color: theme.colors.secondary }]}>
                    Hosted by {event.organization || 'Club Name'}
                </Text>
            </View>

            {/* DETAILS ROW (Below Flyer) */}
            <View style={styles.detailsRow}>
                {/* Date & Location */}
                <View style={styles.infoBlock}>
                    <View style={styles.infoItem}>
                         <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                         <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            {month} {day} • {time}
                         </Text>
                    </View>
                    <View style={styles.infoItem}>
                         <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
                         <Text style={[styles.infoText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {event.location}
                         </Text>
                    </View>
                </View>

                {/* Price Badge */}
                <View style={[styles.priceBadge, { backgroundColor: theme.colors.secondary }]}>
                     <Text style={styles.priceText}>
                        {event.isPaid ? `₹${event.price}` : 'FREE'}
                     </Text>
                </View>
            </View>

            {/* FOOTER ACTION */}
            {isRegistered ? (
                 <View style={[styles.registerBtn, { backgroundColor: theme.colors.success, ...theme.shadows.default }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" style={{marginRight: 4}}/>
                    <Text style={styles.registerText}>REGISTERED</Text>
                </View>
            ) : (
                <TouchableOpacity 
                    style={[styles.registerBtn, { backgroundColor: theme.colors.primary, ...theme.shadows.default }]}
                    onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                >
                    <Text style={styles.registerText}>REGISTER</Text>
                </TouchableOpacity>
            )}

        </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        marginBottom: 24,
        overflow: 'visible',
        marginHorizontal: 0,
        width: '100%',
        maxWidth: 500, // Limit width on desktop
        alignSelf: 'center', // Center the card on wide screens
    },
    bannerContainer: {
        height: 180, // Even Taller banner for impact
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 10,

    },
    bannerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    categoryBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        ...theme.shadows.small,
    },
    categoryText: {
        fontWeight: '900',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    onlineBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        ...theme.shadows.small,
    },
    onlineText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    contentContainer: {
        paddingHorizontal: 16, // Reduced side padding for content
        paddingBottom: 20,
        paddingTop: 0, 
    },
    flyerContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        borderWidth: 4,
        marginTop: -50, 
        overflow: 'hidden',
    },
    flyerImage: {
        width: '100%',
        height: '100%',
    },
    headerInfo: {
        marginTop: -45, 
        marginLeft: 110, 
        minHeight: 50,
        marginBottom: 4, // Tighter spacing
        justifyContent: 'flex-end',
    },
    title: {
        fontSize: 22, // Larger Title
        fontWeight: '900', 
        lineHeight: 26,
        marginBottom: 2,
        textTransform: 'uppercase', 
    },
    host: {
        fontSize: 13,
        fontWeight: '700',
        opacity: 0.8,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', 
        marginTop: 16,
        marginBottom: 16,
    },
    infoBlock: {
        gap: 6,
        flex: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // New Ribbon Style for Price
    priceBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4, 
        borderWidth: 1, 
        borderColor: 'rgba(0,0,0,0.1)',
    },
    priceText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    registerBtn: {
        flexDirection: 'row', // Added
        gap: 4, // Added
        paddingVertical: 12, // Reduced padding
        paddingHorizontal: 24, // Reduced width
        borderRadius: 8, // Less rounded, more button-like
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start', // Don't stretch full width
    },
    registerText: {
        color: '#fff',
        fontWeight: '800', // Slightly lighter weight
        fontSize: 14, // Smaller font
        letterSpacing: 1,
        textTransform: 'uppercase',
    }
});

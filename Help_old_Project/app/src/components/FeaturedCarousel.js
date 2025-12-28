import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { useNavigation } from '@react-navigation/native';

// Optional import for Carousel
let Carousel;
if (Platform.OS !== 'web') {
    try {
        Carousel = require('react-native-reanimated-carousel').default;
    } catch (e) {
        console.warn("Carousel not found");
    }
}

const { width } = Dimensions.get('window');

export default function FeaturedCarousel({ data = [] }) {
    const { theme } = useTheme();
    const navigation = useNavigation();

    if (!data.length) return null;

    const renderCard = (item) => (
        <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
            style={[styles.cardContainer, { width: Platform.OS === 'web' ? 300 : width - 40 }]}
        >
            <Image
                source={{ uri: item.bannerUrl || 'https://via.placeholder.com/800x400' }}
                style={styles.image}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.badgeText}>Featured</Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.date}>
                        {new Date(item.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    if (Platform.OS === 'web' || !Carousel) {
        return (
            <View style={styles.container}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {data.map(renderCard)}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Carousel
                loop
                width={width}
                height={240}
                autoPlay={true}
                data={data}
                scrollAnimationDuration={1000}
                renderItem={({ item }) => renderCard(item)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    cardContainer: {
        flex: 1,
        marginHorizontal: 20, // Creates spacing if we adjust width, but carousel takes full width usually. 
        // For 'reanimated-carousel', it's better to add padding to item or use 'mode' prop.
        // Let's make it full width minus margin for "card" look
        borderRadius: 24,
        overflow: 'hidden',
        marginRight: 20, // Spacing between items if width < screenWidth
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
        height: '60%',
        justifyContent: 'flex-end',
        padding: 20,
    },
    content: {
        marginBottom: 10,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginBottom: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    date: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    }
});

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';

export const Skeleton = ({ width, height, style, borderRadius = 8 }) => {
    const { theme } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    opacity,
                    backgroundColor: theme.colors.border, // Using border color as base for skeleton grey
                    width,
                    height,
                    borderRadius,
                },
                style,
            ]}
        />
    );
};

export const EventCardSkeleton = () => {
    return (
        <View style={styles.cardContainer}>
            {/* Image Placeholder */}
            <Skeleton width="100%" height={180} borderRadius={16} style={{ marginBottom: 12 }} />

            {/* Title Placeholder */}
            <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />

            {/* Date/Loc Placeholder */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <Skeleton width={80} height={16} />
                <Skeleton width={120} height={16} />
            </View>

            {/* Badges Placeholder */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton width={60} height={20} borderRadius={12} />
                <Skeleton width={60} height={20} borderRadius={12} />
            </View>
        </View>
    );
};

export const EventDetailSkeleton = () => (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Cover Image Skeleton */}
        <Skeleton width="100%" height={350} borderRadius={0} style={{ marginBottom: -30 }} />

        {/* Content Sheet Skeleton */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingTop: 30 }}>
            {/* Badges */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <Skeleton width={80} height={24} borderRadius={20} />
                <Skeleton width={60} height={24} borderRadius={20} />
            </View>

            {/* Title */}
            <Skeleton width="80%" height={32} style={{ marginBottom: 20 }} />

            {/* Info Card */}
            <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 24 }} />

            {/* Description Blocks */}
            <Skeleton width="40%" height={20} style={{ marginBottom: 10 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 5 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 5 }} />
            <Skeleton width="90%" height={16} style={{ marginBottom: 5 }} />
        </View>
    </View>
);

export const EventListSkeleton = () => (
    <View style={{ padding: 20 }}>
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
    </View>
);

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.02)', // Subtle background
        padding: 10,
        borderRadius: 16
    }
});

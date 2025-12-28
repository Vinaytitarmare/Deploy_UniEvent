import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function PaymentSuccessAnimation({ visible, onComplete }) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const checkmarkScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset animations
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
            checkmarkScale.setValue(0);

            // Start animation sequence
            Animated.sequence([
                // Fade in background
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                // Scale up circle
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: true,
                }),
                // Pop in checkmark
                Animated.spring(checkmarkScale, {
                    toValue: 1,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Auto-dismiss after 2 seconds
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 2000);
            });
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                <LinearGradient
                    colors={['rgba(255, 152, 0, 0.1)', 'rgba(255, 152, 0, 0.05)']}
                    style={styles.gradient}
                >
                    {/* Success Circle */}
                    <Animated.View
                        style={[
                            styles.successCircle,
                            {
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={['#FF9800', '#F57C00']}
                            style={styles.circleGradient}
                        >
                            {/* Checkmark Icon */}
                            <Animated.View
                                style={{
                                    transform: [{ scale: checkmarkScale }],
                                }}
                            >
                                <Ionicons name="checkmark" size={80} color="#fff" />
                            </Animated.View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Success Text */}
                    <Animated.View
                        style={[
                            styles.textContainer,
                            {
                                opacity: checkmarkScale,
                                transform: [
                                    {
                                        translateY: checkmarkScale.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Text style={styles.successTitle}>Payment Successful!</Text>
                        <Text style={styles.successSubtitle}>Your ticket has been confirmed</Text>
                    </Animated.View>

                    {/* Confetti particles */}
                    {[...Array(12)].map((_, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.confetti,
                                {
                                    left: `${(i * 8.33) + 5}%`,
                                    backgroundColor: i % 3 === 0 ? '#FF9800' : i % 3 === 1 ? '#FFD700' : '#FF6B6B',
                                    opacity: checkmarkScale,
                                    transform: [
                                        {
                                            translateY: checkmarkScale.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, height * 0.6],
                                            }),
                                        },
                                        {
                                            rotate: checkmarkScale.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', `${i * 30}deg`],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                    ))}
                </LinearGradient>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    circleGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    successSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    confetti: {
        position: 'absolute',
        top: '20%',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});

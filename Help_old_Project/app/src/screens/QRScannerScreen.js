import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import { checkInAttendee, parseQRCode, validateTicket } from '../lib/checkInService';
import { useTheme } from '../lib/ThemeContext';
// Web Scanner Component
import WebQRScanner from '../components/WebQRScanner';

const { width } = Dimensions.get('window');

export default function QRScannerScreen({ route, navigation }) {
    const { eventId, eventTitle } = route.params;
    const { user } = useAuth();
    const { theme } = useTheme();

    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [manualEntry, setManualEntry] = useState(false);
    const [manualTicketId, setManualTicketId] = useState('');
    const [recentScans, setRecentScans] = useState([]);
    const [flashOn, setFlashOn] = useState(false);

    // Request camera permission
    useEffect(() => {
        if (Platform.OS === 'web') {
            setHasPermission(true); // Handled by component
            return;
        }

        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || scanning) return;

        setScanned(true);
        setScanning(true);

        // Parse QR code
        const qrResult = parseQRCode(data);

        if (!qrResult.valid) {
            Alert.alert('Invalid QR Code', qrResult.error);
            setTimeout(() => setScanned(false), 2000);
            setScanning(false);
            return;
        }

        // Validate ticket
        await processCheckIn(qrResult.ticketId, qrResult);
    };

    const processCheckIn = async (ticketId, qrData = null) => {
        try {
            // Validate ticket
            const validation = await validateTicket(ticketId, eventId);

            if (!validation.valid) {
                Alert.alert(
                    validation.error,
                    validation.message,
                    [{ text: 'OK', onPress: () => setTimeout(() => setScanned(false), 500) }]
                );
                setScanning(false);
                return;
            }

            // Check in attendee
            const checkInResult = await checkInAttendee(
                validation.ticketData,
                eventId,
                user.uid,
                user.displayName || 'Organizer'
            );

            if (checkInResult.success) {
                // Add to recent scans
                const newScan = {
                    id: ticketId,
                    name: validation.ticketData.userName,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now()
                };
                setRecentScans(prev => [newScan, ...prev.slice(0, 9)]);

                // Show success
                Alert.alert(
                    '✅ Check-In Successful',
                    `${validation.ticketData.userName} has been checked in!`,
                    [{ text: 'OK', onPress: () => setTimeout(() => setScanned(false), 500) }]
                );
            } else {
                Alert.alert(
                    'Check-In Failed',
                    checkInResult.message,
                    [{ text: 'OK', onPress: () => setTimeout(() => setScanned(false), 500) }]
                );
            }

        } catch (error) {
            console.error('Check-in error:', error);
            Alert.alert(
                'Error',
                'Something went wrong. Please try again.',
                [{ text: 'OK', onPress: () => setTimeout(() => setScanned(false), 500) }]
            );
        } finally {
            setScanning(false);
            setManualTicketId('');
        }
    };

    const handleManualEntry = () => {
        if (!manualTicketId.trim()) {
            Alert.alert('Error', 'Please enter a ticket ID');
            return;
        }
        setScanning(true);
        processCheckIn(manualTicketId.trim());
    };

    if (hasPermission === null) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 10 }}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false && Platform.OS !== 'web') {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Ionicons name="camera-off" size={64} color={theme.colors.textSecondary} />
                <Text style={[styles.noPermissionText, { color: theme.colors.text }]}>
                    Camera permission denied
                </Text>
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
                    Please enable camera access in your device settings to scan QR codes.
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Scan Ticket</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                        {eventTitle}
                    </Text>
                </View>
                {Platform.OS !== 'web' && (
                    <TouchableOpacity onPress={() => setFlashOn(!flashOn)} style={styles.flashBtn}>
                        <Ionicons
                            name={flashOn ? "flash" : "flash-off"}
                            size={24}
                            color={flashOn ? theme.colors.primary : theme.colors.text}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Camera View */}
            {!manualEntry && (
                <View style={styles.cameraContainer}>
                    {Platform.OS === 'web' ? (
                        <View style={{ flex: 1 }}>
                            <WebQRScanner 
                                onScan={(result) => handleBarCodeScanned({ type: 'qr', data: result.data || result })}
                                onError={(err) => console.log("QR Error:", err)}
                            />
                            {/* Web Overlay */}
                            <View style={[styles.overlay, { pointerEvents: 'none' }]}>
                                <View style={styles.unfocusedContainer}></View>
                                <View style={styles.middleContainer}>
                                    <View style={styles.unfocusedContainer}></View>
                                    <View style={styles.focusedContainer}>
                                        <View style={[styles.corner, styles.topLeft, { borderColor: theme.colors.primary }]} />
                                        <View style={[styles.corner, styles.topRight, { borderColor: theme.colors.primary }]} />
                                        <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.colors.primary }]} />
                                        <View style={[styles.corner, styles.bottomRight, { borderColor: theme.colors.primary }]} />
                                        
                                        {/* Animated Scan Line */}
                                        {scanning && <View style={[styles.scanLine, { backgroundColor: theme.colors.primary }]} />}
                                    </View>
                                    <View style={styles.unfocusedContainer}></View>
                                </View>
                                <View style={styles.unfocusedContainer}></View>
                            </View>
                        </View>
                    ) : (
                        <Camera
                            style={styles.camera}
                            type={Camera.Constants.Type.back}
                            flashMode={flashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
                            barCodeScannerSettings={{
                                barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
                            }}
                            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                        >
                            <View style={styles.overlay}>
                                <View style={styles.unfocusedContainer}></View>
                                <View style={styles.middleContainer}>
                                    <View style={styles.unfocusedContainer}></View>
                                    <View style={styles.focusedContainer}>
                                        <View style={[styles.corner, styles.topLeft, { borderColor: theme.colors.primary }]} />
                                        <View style={[styles.corner, styles.topRight, { borderColor: theme.colors.primary }]} />
                                        <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.colors.primary }]} />
                                        <View style={[styles.corner, styles.bottomRight, { borderColor: theme.colors.primary }]} />
                                        
                                        {/* Animated Scan Line */}
                                        {scanning && <View style={[styles.scanLine, { backgroundColor: theme.colors.primary }]} />}
                                    </View>
                                    <View style={styles.unfocusedContainer}></View>
                                </View>
                                <View style={styles.unfocusedContainer}></View>
                            </View>
                        </Camera>
                    )}

                    <View style={styles.instructionContainer}>
                        <Text style={styles.instructionText}>
                            {scanning ? 'Processing...' : 'Align QR code within the frame'}
                        </Text>
                        {scanning && <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
                    </View>
                </View>
            )}

            {/* Manual Entry */}
            {manualEntry && (
                <View style={[styles.manualContainer, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.manualTitle, { color: theme.colors.text }]}>Manual Entry</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.background,
                            color: theme.colors.text,
                            borderColor: theme.colors.border
                        }]}
                        placeholder="Enter Ticket ID"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={manualTicketId}
                        onChangeText={setManualTicketId}
                        autoCapitalize="characters"
                    />
                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={handleManualEntry}
                        disabled={scanning}
                    >
                        {scanning ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Verify & Check In</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Toggle Manual Entry */}
            <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: theme.colors.surface }]}
                onPress={() => setManualEntry(!manualEntry)}
            >
                <Ionicons
                    name={manualEntry ? "camera" : "keypad"}
                    size={20}
                    color={theme.colors.text}
                />
                <Text style={[styles.toggleBtnText, { color: theme.colors.text }]}>
                    {manualEntry ? 'Scan QR Code' : 'Manual Entry'}
                </Text>
            </TouchableOpacity>

            {/* Recent Scans */}
            {recentScans.length > 0 && (
                <View style={[styles.recentContainer, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.recentTitle, { color: theme.colors.text }]}>Recent Check-Ins</Text>
                    {recentScans.slice(0, 3).map((scan) => (
                        <View key={scan.id} style={[styles.recentItem, { borderBottomColor: theme.colors.border }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            <Text style={[styles.recentName, { color: theme.colors.text }]}>{scan.name}</Text>
                            <Text style={[styles.recentTime, { color: theme.colors.textSecondary }]}>{scan.time}</Text>
                        </View>
                    ))}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        gap: 10,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    flashBtn: {
        padding: 5,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    unfocusedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    middleContainer: {
        flexDirection: 'row',
        flex: 1.5,
    },
    focusedContainer: {
        flex: 10,
    },
    scanLine: {
        width: '100%',
        height: 2,
        position: 'absolute',
        top: '50%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    scanFrame: { // Deprecated but kept for reference if needed
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    corner: {
        position: 'absolute',
        width: 30, // Smaller styling
        height: 30,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 10,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 10,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 10,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 10,
    },
    instructionContainer: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        alignItems: 'center',
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    manualContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    manualTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    submitBtn: {
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        margin: 15,
        borderRadius: 12,
    },
    toggleBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    recentContainer: {
        margin: 15,
        marginTop: 0,
        padding: 15,
        borderRadius: 12,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        gap: 10,
    },
    recentName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    recentTime: {
        fontSize: 12,
    },
    noPermissionText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 10,
    },
});

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const WebQRScanner = ({ onScan, onError }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                onScan({ data: decodedText });
                scanner.clear();
            },
            (errorMessage) => {
                if (onError) onError(errorMessage);
            }
        );

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, []);

    return (
        <View style={styles.container}>
            <div id="reader" style={{ width: '100%', maxWidth: '500px' }}></div>
            <Text style={styles.hint}>Allow camera access to scan</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    hint: {
        color: 'white',
        marginTop: 10,
    }
});

export default WebQRScanner;

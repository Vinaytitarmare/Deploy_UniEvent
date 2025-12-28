import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AirbnbRating } from 'react-native-ratings';
import { useTheme } from '../lib/ThemeContext';

export default function FeedbackModal({ visible, feedbackRequest, onClose, onSubmit }) {
    const { theme } = useTheme();
    const [rating, setRating] = useState(3);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!feedbackRequest) return null;

    const handleSubmit = async () => {
        setSubmitting(true);
        await onSubmit({ rating, comment });
        setSubmitting(false);
        setComment('');
        setRating(3);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: theme.colors.text }]}>Rate this Event</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {feedbackRequest.eventTitle}
                    </Text>

                    <AirbnbRating
                        count={5}
                        defaultRating={3}
                        size={30}
                        onFinishRating={setRating}
                        showRating={false}
                    />

                    <TextInput
                        style={[
                            styles.input,
                            { 
                                backgroundColor: theme.colors.background, 
                                color: theme.colors.text,
                                borderColor: theme.colors.border
                            }
                        ]}
                        placeholder="Share your thoughts (optional)"
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                    />

                    <TouchableOpacity 
                        style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Submit Feedback</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    closeBtn: {
        alignSelf: 'flex-end',
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 100,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginTop: 20,
        marginBottom: 20,
        textAlignVertical: 'top',
    },
    submitBtn: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

import { Ionicons } from '@expo/vector-icons';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebaseConfig';
import { useTheme } from '../lib/ThemeContext';

export default function LeaderboardScreen({ navigation }) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch top 50 users sorted by points
        // Ensure you have an index on 'points' descending in Firestore
        const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc, index) => ({
                id: doc.id,
                rank: index + 1,
                ...doc.data()
            }));
            setUsers(list);
            setLoading(false);
        }, (error) => {
            console.error("Leaderboard Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const renderItem = ({ item }) => {
        const isMe = item.id === user?.uid;
        let rankColor = theme.colors.text;
        let rankIcon = null;

        if (item.rank === 1) {
            rankColor = '#FFD700'; // Gold
            rankIcon = "trophy";
        } else if (item.rank === 2) {
            rankColor = '#C0C0C0'; // Silver
            rankIcon = "medal";
        } else if (item.rank === 3) {
            rankColor = '#CD7F32'; // Bronze
            rankIcon = "medal-outline";
        }

        return (
            <View style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: isMe ? theme.colors.primary : 'transparent' },
                isMe && styles.myCard
            ]}>
                <View style={styles.rankContainer}>
                    {rankIcon ? (
                        <Ionicons name={rankIcon} size={24} color={rankColor} />
                    ) : (
                        <Text style={[styles.rankText, { color: theme.colors.textSecondary }]}>#{item.rank}</Text>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>
                        {item.name || 'Anonymous'} {isMe && '(You)'}
                    </Text>
                    <Text style={[styles.branch, { color: theme.colors.textSecondary }]}>
                        {item.branch || 'Unknown Branch'}
                    </Text>
                </View>

                <View style={styles.pointsContainer}>
                    <Text style={[styles.points, { color: theme.colors.primary }]}>{item.points || 0}</Text>
                    <Text style={[styles.pointsLabel, { color: theme.colors.textSecondary }]}>pts</Text>
                </View>
            </View>
        );
    };

    if (loading) return (
        <ScreenWrapper showLogo={true}>
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
        </ScreenWrapper>
    );

    return (
        <ScreenWrapper showLogo={true}>
            <View style={styles.container}>
                <Text style={[styles.title, { color: theme.colors.text, marginBottom: 20 }]}>Leaderboard 🏆</Text>
                <FlatList
                    data={users}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>No players yet.</Text>}
                />
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { fontSize: 24, fontWeight: 'bold' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    myCard: { borderWidth: 2 },
    rankContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
    rankText: { fontSize: 16, fontWeight: 'bold' },
    infoContainer: { flex: 1, marginLeft: 10 },
    name: { fontSize: 16, fontWeight: 'bold' },
    branch: { fontSize: 12 },
    pointsContainer: { alignItems: 'flex-end' },
    points: { fontSize: 18, fontWeight: '900' },
    pointsLabel: { fontSize: 10 },
});

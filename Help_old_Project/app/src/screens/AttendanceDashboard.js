import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import { getAttendanceStats } from '../lib/checkInService';
import { exportAttendanceCSV, exportAttendancePDF } from '../lib/attendanceExportService';
import { db } from '../lib/firebaseConfig';
import { useTheme } from '../lib/ThemeContext';

const { width } = Dimensions.get('window');

export default function AttendanceDashboard({ route, navigation }) {
    const { eventId, eventTitle } = route.params;
    const { user } = useAuth();
    const { theme } = useTheme();

    const [stats, setStats] = useState(null);
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [departmentStats, setDepartmentStats] = useState({});
    const [yearStats, setYearStats] = useState({});
    const [eventData, setEventData] = useState(null);

    // Real-time stats listener
    useEffect(() => {
        const fetchStats = async () => {
            const statsData = await getAttendanceStats(eventId);
            setStats(statsData);
            setLoading(false);
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);

        return () => clearInterval(interval);
    }, [eventId]);

    // Real-time check-ins listener
    useEffect(() => {
        const q = query(
            collection(db, 'events', eventId, 'checkIns'),
            orderBy('checkedInAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const checkInsList = [];
            const deptCount = {};
            const yearCount = {};

            snapshot.forEach(doc => {
                const data = doc.data();
                checkInsList.push({ id: doc.id, ...data });

                const dept = data.userBranch || 'Unknown';
                deptCount[dept] = (deptCount[dept] || 0) + 1;

                const year = data.userYear || 'Unknown';
                yearCount[year] = (yearCount[year] || 0) + 1;
            });

            setCheckIns(checkInsList);
            setDepartmentStats(deptCount);
            setYearStats(yearCount);
        });

        return () => unsubscribe();
    }, [eventId]);

    // Fetch event data for export
    useEffect(() => {
        const fetchEventData = async () => {
            const eventDoc = await getDoc(doc(db, 'events', eventId));
            if (eventDoc.exists()) {
                setEventData(eventDoc.data());
            }
        };
        fetchEventData();
    }, [eventId]);

    const handleExportCSV = async () => {
        if (checkIns.length === 0) {
            Alert.alert('No Data', 'There are no check-ins to export.');
            return;
        }

        setExporting(true);
        const result = await exportAttendanceCSV(eventId, eventTitle);
        setExporting(false);

        if (result.success) {
            Alert.alert('Success', 'CSV file exported successfully!');
        } else {
            Alert.alert('Export Failed', result.error);
        }
    };

    const handleExportPDF = async () => {
        if (checkIns.length === 0) {
            Alert.alert('No Data', 'There are no check-ins to export.');
            return;
        }

        setExporting(true);
        const result = await exportAttendancePDF(eventId, eventTitle, eventData);
        setExporting(false);

        if (result.success) {
            Alert.alert('Success', 'Report exported successfully!');
        } else {
            Alert.alert('Export Failed', result.error);
        }
    };

    const StatCard = ({ icon, label, value, color, subtitle, gradient }) => (
        <View style={styles.statCard}>
            <LinearGradient
                colors={gradient || [color + '20', color + '10']}
                style={styles.statGradient}
            >
                <View style={[styles.statIconBox, { backgroundColor: color + '30' }]}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
                {subtitle && (
                    <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>
                        {subtitle}
                    </Text>
                )}
            </LinearGradient>
        </View>
    );

    const CheckInItem = ({ item }) => {
        const timeAgo = getTimeAgo(item.checkedInAt?.toMillis());

        return (
            <View style={[styles.checkInItem, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.checkInAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                        {item.userName?.[0]?.toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={styles.checkInInfo}>
                    <Text style={[styles.checkInName, { color: theme.colors.text }]}>
                        {item.userName}
                    </Text>
                    <View style={styles.checkInMeta}>
                        <Ionicons name="school-outline" size={12} color={theme.colors.textSecondary} />
                        <Text style={[styles.checkInDetails, { color: theme.colors.textSecondary }]}>
                            {item.userBranch} • Year {item.userYear}
                        </Text>
                    </View>
                </View>
                <View style={styles.checkInTime}>
                    <View style={styles.checkmarkBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    </View>
                    <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                        {timeAgo}
                    </Text>
                </View>
            </View>
        );
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';

        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes === 1) return '1 min ago';
        if (minutes < 60) return `${minutes} mins ago`;

        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return `${hours} hours ago`;

        return new Date(timestamp).toLocaleDateString();
    };

    const AnalyticsSection = ({ title, data, icon }) => {
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);

        return (
            <View style={[styles.analyticsCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.analyticsHeader}>
                    <View style={styles.analyticsHeaderLeft}>
                        <Ionicons name={icon} size={18} color={theme.colors.primary} />
                        <Text style={[styles.analyticsTitle, { color: theme.colors.text }]}>{title}</Text>
                    </View>
                    <Text style={[styles.analyticsTotal, { color: theme.colors.textSecondary }]}>
                        {total} total
                    </Text>
                </View>
                {sortedData.map(([key, value]) => {
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return (
                        <View key={key} style={styles.analyticsItem}>
                            <View style={styles.analyticsItemHeader}>
                                <Text style={[styles.analyticsLabel, { color: theme.colors.text }]}>
                                    {key}
                                </Text>
                                <Text style={[styles.analyticsValue, { color: theme.colors.textSecondary }]}>
                                    {value} ({percentage}%)
                                </Text>
                            </View>
                            <View style={styles.analyticsBarBg}>
                                <LinearGradient
                                    colors={[theme.colors.primary, theme.colors.primary + '80']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.analyticsBarFill, { width: `${percentage}%` }]}
                                />
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Attendance</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                        {eventTitle}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('QRScanner', { eventId, eventTitle })}
                    style={[styles.scanBtn, { backgroundColor: theme.colors.primary }]}
                >
                    <Ionicons name="qr-code" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#2196F320', '#2196F310']}
                            style={styles.statGradient}
                        >
                            <View style={[styles.statIconBox, { backgroundColor: '#2196F330' }]}>
                                <Ionicons name="people" size={22} color="#2196F3" />
                            </View>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                {stats?.totalRegistrations || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                REGISTERED
                            </Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#4CAF5020', '#4CAF5010']}
                            style={styles.statGradient}
                        >
                            <View style={[styles.statIconBox, { backgroundColor: '#4CAF5030' }]}>
                                <Ionicons name="checkmark-done-circle" size={22} color="#4CAF50" />
                            </View>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                {stats?.totalCheckedIn || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                CHECKED IN
                            </Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#FF980020', '#FF980010']}
                            style={styles.statGradient}
                        >
                            <View style={[styles.statIconBox, { backgroundColor: '#FF980030' }]}>
                                <Ionicons name="stats-chart" size={22} color="#FF9800" />
                            </View>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                {stats?.checkInRate || 0}%
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                CHECK-IN RATE
                            </Text>
                            {stats?.pending > 0 && (
                                <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>
                                    {stats.pending} pending
                                </Text>
                            )}
                        </LinearGradient>
                    </View>
                </View>

                {/* Live Check-Ins Feed */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={styles.liveDotContainer}>
                                <View style={styles.liveDot} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Live Check-Ins
                            </Text>
                        </View>
                        <View style={styles.countBadge}>
                            <Text style={[styles.countText, { color: theme.colors.primary }]}>
                                {checkIns.length}
                            </Text>
                        </View>
                    </View>
                    {checkIns.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.background }]}>
                                <Ionicons name="people-outline" size={40} color={theme.colors.textSecondary} />
                            </View>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                No check-ins yet
                            </Text>
                            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                                Attendees will appear here as they check in
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.checkInsList}>
                            {checkIns.slice(0, 10).map((item) => (
                                <CheckInItem key={item.id} item={item} />
                            ))}
                        </View>
                    )}
                </View>

                {/* Analytics */}
                {Object.keys(departmentStats).length > 0 && (
                    <AnalyticsSection
                        title="Department Breakdown"
                        data={departmentStats}
                        icon="school"
                    />
                )}

                {Object.keys(yearStats).length > 0 && (
                    <AnalyticsSection
                        title="Year-wise Distribution"
                        data={yearStats}
                        icon="calendar"
                    />
                )}

                {/* Export Buttons */}
                <View style={styles.exportContainer}>
                    <Text style={[styles.exportTitle, { color: theme.colors.text }]}>Export Reports</Text>
                    <View style={styles.exportButtons}>
                        <TouchableOpacity
                            style={[styles.exportBtn, { backgroundColor: theme.colors.surface }]}
                            onPress={handleExportCSV}
                            disabled={exporting || checkIns.length === 0}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#45a049']}
                                style={styles.exportBtnGradient}
                            >
                                {exporting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="document-text" size={24} color="#fff" />
                                        <Text style={styles.exportBtnText}>Export CSV</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.exportBtn, { backgroundColor: theme.colors.surface }]}
                            onPress={handleExportPDF}
                            disabled={exporting || checkIns.length === 0}
                        >
                            <LinearGradient
                                colors={['#2196F3', '#1976D2']}
                                style={styles.exportBtnGradient}
                            >
                                {exporting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="document" size={24} color="#fff" />
                                        <Text style={styles.exportBtnText}>Export PDF</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        padding: 16,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    scanBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 10,
    },
    statCard: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    statGradient: {
        padding: 14,
        alignItems: 'center',
        gap: 6,
        minHeight: 130,
        justifyContent: 'center',
    },
    statIconBox: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 32,
    },
    statLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        fontWeight: '700',
        textAlign: 'center',
    },
    statSubtitle: {
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        margin: 16,
        marginTop: 0,
        borderRadius: 16,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    liveDotContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF000020',
        alignItems: 'center',
        justifyContent: 'center',
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF0000',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    countBadge: {
        backgroundColor: '#FF980020',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    countText: {
        fontSize: 14,
        fontWeight: '700',
    },
    checkInsList: {
        gap: 10,
    },
    checkInItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    checkInAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
    },
    checkInInfo: {
        flex: 1,
        gap: 4,
    },
    checkInName: {
        fontSize: 15,
        fontWeight: '600',
    },
    checkInMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    checkInDetails: {
        fontSize: 12,
    },
    checkInTime: {
        alignItems: 'flex-end',
        gap: 6,
    },
    checkmarkBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#4CAF5020',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 11,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    emptySubtext: {
        fontSize: 13,
        textAlign: 'center',
    },
    analyticsCard: {
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
    },
    analyticsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    analyticsHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    analyticsTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    analyticsTotal: {
        fontSize: 12,
        fontWeight: '600',
    },
    analyticsItem: {
        marginBottom: 14,
    },
    analyticsItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    analyticsLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    analyticsValue: {
        fontSize: 13,
    },
    analyticsBarBg: {
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.08)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    analyticsBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    exportContainer: {
        margin: 16,
        marginTop: 0,
    },
    exportTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 12,
    },
    exportButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    exportBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    exportBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
    },
    exportBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});

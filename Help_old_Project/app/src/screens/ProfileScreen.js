import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebaseConfig';
import { useTheme } from '../lib/ThemeContext';

// Helper for menu items
const MenuItem = ({ icon, label, onPress, theme, styles }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Ionicons name={icon} size={22} color={theme.colors.text} />
        <Text style={styles.menuText}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
);

const BRANCHES = ['CSE', 'ETC', 'EE', 'ME', 'Civil'];

export default function ProfileScreen({ navigation }) {
    const { user, role, signOut, savedAccounts, switchAccount, removeSavedAccount } = useAuth();
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    const [name, setName] = useState(user?.displayName || '');
    const [year, setYear] = useState('1');
    const [branch, setBranch] = useState('CSE');
    const [points, setPoints] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Social Media URLs (for admins/clubs)
    const [instagram, setInstagram] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [twitter, setTwitter] = useState('');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        if (user?.uid) fetchUserData();
    }, [user]);

    const fetchUserData = async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.year) setYear(String(data.year));
                if (data.displayName) setName(data.displayName);
                if (data.branch) setBranch(data.branch);
                if (data.points) setPoints(data.points);

                // Load social media URLs
                setInstagram(data.socialMedia?.instagram || '');
                setLinkedin(data.socialMedia?.linkedin || '');
                setTwitter(data.socialMedia?.twitter || '');
                setWebsite(data.socialMedia?.website || '');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!name) return Alert.alert("Error", "Name cannot be empty");
        setLoading(true);
        try {
            await updateProfile(user, { displayName: name });

            let finalBranch = branch;
            if (role === 'admin') {
                finalBranch = 'All'; // Force 'All' for admins as requested
            }

            const updateData = {
                displayName: name,
                year: parseInt(year),
                branch: finalBranch
            };

            // Add social media for admins/clubs
            if (role === 'admin' || role === 'club') {
                updateData.socialMedia = {
                    instagram,
                    linkedin,
                    twitter,
                    website
                };
            }

            await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });

            Alert.alert("Success", "Profile updated!");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.brandTitle, { color: theme.colors.primary }]}>UniEvent</Text>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    {!isEditing ? (
                        <>
                            <Text style={[theme.typography.h2, { color: theme.colors.text }]}>{name || 'User'}</Text>
                            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
                            <View style={styles.badgesRow}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {year ? `Year ${year} • ` : ''}{role === 'admin' ? 'ADMIN' : (branch || 'Student')}
                                    </Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                                    <Text style={[styles.badgeText, { color: '#fff' }]}>🏆 {points} pts</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                                <Text style={styles.editButtonText}>Edit Profile</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.editContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.colors.textSecondary}
                            />

                            <Text style={styles.label}>Year of Study</Text>
                            <View style={styles.buttonGroup}>
                                {['1', '2', '3', '4'].map((y) => (
                                    <TouchableOpacity
                                        key={y}
                                        style={[
                                            styles.optionButton,
                                            {
                                                backgroundColor: year === y ? theme.colors.primary : theme.colors.surface,
                                                borderColor: year === y ? theme.colors.primary : theme.colors.border
                                            }
                                        ]}
                                        onPress={() => setYear(y)}
                                    >
                                        <Text style={[
                                            styles.optionButtonText,
                                            { color: year === y ? '#fff' : theme.colors.text }
                                        ]}>
                                            {y}{y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th'} Year
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {role !== 'admin' && (
                                <>
                                    <Text style={styles.label}>Branch</Text>
                                    <View style={styles.buttonGroup}>
                                        {BRANCHES.map((b) => (
                                            <TouchableOpacity
                                                key={b}
                                                style={[
                                                    styles.optionButton,
                                                    {
                                                        backgroundColor: branch === b ? theme.colors.primary : theme.colors.surface,
                                                        borderColor: branch === b ? theme.colors.primary : theme.colors.border
                                                    }
                                                ]}
                                                onPress={() => setBranch(b)}
                                            >
                                                <Text style={[
                                                    styles.optionButtonText,
                                                    { color: branch === b ? '#fff' : theme.colors.text }
                                                ]}>
                                                    {b}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Social Media URLs for Admins/Clubs */}
                            {(role === 'admin' || role === 'club') && (
                                <>
                                    <Text style={[styles.label, { marginTop: 15 }]}>Social Media (Optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={instagram}
                                        onChangeText={setInstagram}
                                        placeholder="Instagram URL"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        autoCapitalize="none"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        value={linkedin}
                                        onChangeText={setLinkedin}
                                        placeholder="LinkedIn URL"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        autoCapitalize="none"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        value={twitter}
                                        onChangeText={setTwitter}
                                        placeholder="Twitter URL"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        autoCapitalize="none"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        value={website}
                                        onChangeText={setWebsite}
                                        placeholder="Website URL"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        autoCapitalize="none"
                                    />
                                </>
                            )}

                            <View style={styles.editActions}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Menu Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <MenuItem
                        icon="wallet-outline"
                        label="My Wallet (Tickets)"
                        onPress={() => navigation.navigate('Wallet')}
                        theme={theme}
                        styles={styles}
                    />
                    <MenuItem
                        icon="trophy-outline"
                        label="Leaderboard"
                        onPress={() => navigation.navigate('Leaderboard')}
                        theme={theme}
                        styles={styles}
                    />
                    {/* Show different menu based on role */}
                    {(role === 'admin' || role === 'club') ? (
                        <MenuItem
                            icon="calendar-outline"
                            label="My Created Events"
                            onPress={() => navigation.navigate('MyEvents')}
                            theme={theme}
                            styles={styles}
                        />
                    ) : (
                        <MenuItem
                            icon="ticket-outline"
                            label="My Registered Events"
                            onPress={() => navigation.navigate('MyRegisteredEvents')}
                            theme={theme}
                            styles={styles}
                        />
                    )}
                </View>

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <MenuItem
                        icon="color-wand-outline"
                        label="Appearance"
                        onPress={() => navigation.navigate('Appearance')}
                        theme={theme}
                        styles={styles}
                    />
                    <View style={styles.menuItem}>
                        <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={theme.colors.text} />
                        <Text style={styles.menuText}>Dark Mode</Text>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: theme.colors.primary }}
                            thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Account Switcher - Simplified */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Accounts</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountList}>
                        {/* Current Account */}
                        <View style={[styles.accountCard, styles.activeAccountCard]}>
                            <View style={styles.accountAvatarSmall}>
                                <Text style={styles.accountAvatarText}>
                                    {name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.accountName} numberOfLines={1}>{name || 'User'}</Text>
                            <View style={styles.activeDot} />
                        </View>

                        {/* Saved Accounts */}
                        {savedAccounts
                            .filter(acc => acc.email !== user?.email)
                            .map((acc, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.accountCard}
                                    onPress={() => switchAccount(acc.email)}
                                    onLongPress={() => {
                                        if (Platform.OS === 'web') {
                                            if (window.confirm(`Remove ${acc.email}?`)) {
                                                removeSavedAccount(acc.email);
                                            }
                                        } else {
                                            Alert.alert("Remove Account", `Remove ${acc.email}?`, [
                                                { text: "Cancel", style: "cancel" },
                                                { text: "Remove", style: "destructive", onPress: () => removeSavedAccount(acc.email) }
                                            ]);
                                        }
                                    }}
                                >
                                    <View style={[styles.accountAvatarSmall, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}>
                                        <Text style={[styles.accountAvatarText, { color: theme.colors.text }]}>
                                            {acc.displayName?.[0]?.toUpperCase() || acc.email?.[0]?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.accountName} numberOfLines={1}>{acc.displayName}</Text>
                                </TouchableOpacity>
                            ))}

                        {/* Add Account */}
                        <TouchableOpacity
                            style={[styles.accountCard, { borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.textSecondary }]}
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    if (window.confirm("Sign out to add a new account?")) {
                                        signOut();
                                    }
                                } else {
                                    Alert.alert("Add Account", "Sign out to add a new account?", [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Continue", onPress: signOut }
                                    ]);
                                }
                            }}
                        >
                            <View style={[styles.accountAvatarSmall, { backgroundColor: 'transparent' }]}>
                                <Ionicons name="add" size={24} color={theme.colors.textSecondary} />
                            </View>
                            <Text style={styles.accountName}>Add</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Sign Out */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                        <Ionicons name="log-out-outline" size={20} color={theme.colors.error} style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const getStyles = (theme) => StyleSheet.create({
    header: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        paddingTop: 40,
        paddingBottom: 30,
    },
    brandTitle: {
        fontSize: 32,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        marginBottom: 20,
        letterSpacing: 1,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    badgesRow: { flexDirection: 'row', gap: 10, marginTop: theme.spacing.s },
    badge: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#000',
        fontWeight: 'bold',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.m,
        padding: 8,
    },
    editButtonText: {
        color: theme.colors.primary,
        fontWeight: '600',
        marginLeft: 4,
    },
    editContainer: {
        width: '100%',
        paddingHorizontal: theme.spacing.m,
        marginTop: theme.spacing.m,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginTop: 10,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 10,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 12,
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    optionButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        minWidth: '48%',
        alignItems: 'center',
    },
    optionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    editActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 8,
        borderColor: theme.colors.border,
        borderWidth: 1,
    },
    saveButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
    },
    cancelText: { color: theme.colors.text },
    saveText: { color: '#fff', fontWeight: 'bold' },

    section: {
        marginTop: 24,
        paddingHorizontal: theme.spacing.m,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: 8,
    },
    menuText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '500',
    },
    logoutButton: {
        marginTop: 8,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.error + '40',
    },
    logoutText: {
        color: theme.colors.error,
        fontWeight: '700',
        fontSize: 16,
    },
    // Account Switching Styles
    accountList: {
        marginTop: 8,
    },
    accountCard: {
        alignItems: 'center',
        marginRight: 16,
        padding: 12,
        borderRadius: 16,
        minWidth: 80,
        backgroundColor: theme.colors.surface,
    },
    activeAccountCard: {
        backgroundColor: theme.colors.primary + '20',
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    accountAvatarSmall: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    accountAvatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    accountName: {
        fontSize: 12,
        color: theme.colors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginTop: 4,
    }
});

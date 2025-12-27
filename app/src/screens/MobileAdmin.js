import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebaseConfig';
import { useTheme } from '../lib/ThemeContext';

import ScreenWrapper from '../components/ScreenWrapper';

export default function MobileAdmin() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('clubs'); // 'clubs' or 'appeals'
  const [clubs, setClubs] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'clubs') {
          const q = query(collection(db, 'clubs'), where('approved', '==', false));
          const snapshot = await getDocs(q);
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          setClubs(list);
      } else {
          // Fetch events with pending appeals
         const q = query(collection(db, 'events'), where('appealStatus', '==', 'pending'));
         const snapshot = await getDocs(q);
         const list = [];
         snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
         setAppeals(list);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveClub = async (clubId) => {
    try {
      await updateDoc(doc(db, 'clubs', clubId), { approved: true });
      Alert.alert('Success', 'Club approved');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve club');
    }
  };

  const handleRejectClub = async (clubId) => {
    try {
      await deleteDoc(doc(db, 'clubs', clubId));
      Alert.alert('Rejected', 'Club request removed');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject club');
    }
  };

  // --- APPEAL HANDLERS ---
  const handleAcceptAppeal = async (eventId) => {
      try {
          await updateDoc(doc(db, 'events', eventId), { 
              status: 'active', 
              appealStatus: 'resolved' 
          });
          Alert.alert("Restored", "Event is active again.");
          fetchData();
      } catch (e) {
          Alert.alert("Error", "Failed to restore event");
      }
  };

  const handleRejectAppeal = async (eventId) => {
      try {
           await updateDoc(doc(db, 'events', eventId), { 
              appealStatus: 'rejected' 
          });
          Alert.alert("Rejected", "Appeal rejected. Event remains suspended.");
          fetchData();
      } catch (e) {
          Alert.alert("Error", "Failed to update");
      }
  };

  const onRefresh = () => {
      setRefreshing(true);
      fetchData();
  };

 const seedData = async () => {
  if (!user) return Alert.alert("Error", "User not found");
  setLoading(true);
  try {
    const sampleEvents = [
      {
        title: 'Hackathon 2024',
        description: 'Annual university hackathon. Join us for 24 hours of coding!',
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 86400000 + 86400000).toISOString(),
        location: 'Main Auditorium',
        category: 'Tech',
        bannerUrl: 'https://media.istockphoto.com/id/1484758991/photo/hackathon-concept-the-meeting-at-the-white-office-table.jpg?s=1024x1024&w=is&k=20&c=l62tt_4blBi7q1DZKcA-F97WBhFp-ya2RUw65ylsaWw=',
        createdAt: new Date().toISOString(),
        status: 'active',
        ownerId: user.uid,
        ownerEmail: user.email,
        isPaid: false,
        price: '0',
        target: { departments: ['CSE', 'ETC'], years: [1, 2, 3, 4] }
      },
      {
        title: 'Cultural Fest Night',
        description: 'Music, Dance, and Drama. Open to all departments.',
        startAt: new Date(Date.now() + 172800000).toISOString(),
        endAt: new Date(Date.now() + 172800000 + 18000000).toISOString(),
        location: 'Open Air Theatre',
        category: 'Cultural',
        bannerUrl: 'https://media.istockphoto.com/id/2150388165/photo/fans-raise-hands-in-excitement-at-vibrant-outdoor-music-fest-lights-illuminate-stage-dynamic.jpg?s=1024x1024&w=is&k=20&c=rE2gPGLrIqqFbIw5My9Up-Yx4DwmDx4A0MZft8Uwttk=',
        createdAt: new Date().toISOString(),
        status: 'active',
        ownerId: user.uid,
        ownerEmail: user.email,
        isPaid: true,
        price: '500',
        target: { departments: ['All'], years: [1, 2, 3, 4] }
      },
      {
        title: 'Tech Symposium 2025',
        description: 'Latest trends in AI, Cloud Computing, and Full-stack Development.',
        startAt: new Date(Date.now() + 259200000).toISOString(),
        endAt: new Date(Date.now() + 259200000 + 28800000).toISOString(),
        location: 'Main Auditorium',
        category: 'Technical',
        bannerUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80',
        createdAt: new Date().toISOString(),
        status: 'active',
        ownerId: user.uid,
        ownerEmail: user.email,
        isPaid: false,
        price: '0',
        target: { departments: ['CSE', 'IT', 'ECE'], years: [2, 3, 4] }
      },
      {
        title: 'Annual Sports Day',
        description: 'Cricket, Football, Volleyball, and Athletics competitions.',
        startAt: new Date(Date.now() + 432000000).toISOString(),
        endAt: new Date(Date.now() + 432000000 + 36000000).toISOString(),
        location: 'Sports Ground',
        category: 'Sports',
        bannerUrl: 'https://media.istockphoto.com/id/470755388/photo/fans-at-stadium.jpg?s=612x612&w=0&k=20&c=sBX29xUllKFdvV3LkHAiHDNp9oDxMW40zfXxOIqU-Tg=',
        createdAt: new Date().toISOString(),
        status: 'active',
        ownerId: user.uid,
        ownerEmail: user.email,
        isPaid: false,
        price: '0',
        target: { departments: ['All'], years: [1, 2, 3, 4] }
      },
      {
        title: 'CodeRush Hackathon',
        description: '24-hour coding challenge with AI/ML themes. Prizes worth ₹50,000.',
        startAt: new Date(Date.now() + 518400000).toISOString(),
        endAt: new Date(Date.now() + 518400000 + 86400000).toISOString(),
        location: 'Computer Lab Block',
        category: 'Technical',
        bannerUrl: 'https://media.istockphoto.com/id/1125107251/vector/hackathon-background-hack-marathon-coding-event-glitch-poster-and-saturated-binary-data-code.jpg?s=612x612&w=0&k=20&c=aqnvlYk_4_8qIQi8bUbg6LQeNBBl8c-FyuSPyXCNgro=',
        createdAt: new Date().toISOString(),
        status: 'active',
        ownerId: user.uid,
        ownerEmail: user.email,
        isPaid: true,
        price: '200',
        target: { departments: ['CSE', 'IT'], years: [2, 3, 4] }
      },
      {
        title: 'AI/ML Workshop',
        description: 'Hands-on GenAI, LLMs, and Python implementation. Limited seats.',
        startAt: new Date(Date.now() + 691200000).toISOString(),
        endAt: new Date(Date.now() + 691200000 + 14400000).toISOString(),
        location: 'Seminar Hall B',
        category: 'Workshop',
        bannerUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80',
        createdAt: new Date().toISOString(),
        status: 'active',
        ownerId: user.uid,
        ownerEmail: user.email,
        isPaid: true,
        price: '300',
        target: { departments: ['CSE'], years: [3, 4] }
      },
      {
        title: 'Startup Pitch Fest',
        description: 'Student entrepreneurs pitch ideas to VCs and alumni.',
        startAt: new Date(Date.now() + 864000000).toISOString(),
        endAt: new Date(Date.now() + 864000000 + 21600000).toISOString(),
        location: 'Innovation Hub',
        category: 'Entrepreneurship',
        bannerUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80',
        createdAt: new Date().toISOString(),
        status: 'active',
        ownerId: user.uid,
        ownerEmail: user.email,
        isPaid: false,
        price: '0',
        target: { departments: ['All'], years: [3, 4] }
      }
    ];

    for (const ev of sampleEvents) {
      await addDoc(collection(db, 'events'), ev);
    }
    Alert.alert('Success', 'Sample events added! Refresh the User Feed.');
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'Failed to seed data');
  } finally {
    setLoading(false);
  }
};


  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>Admin Dashboard</Text>
        <TouchableOpacity style={[styles.seedBtn, { backgroundColor: theme.colors.secondary }]} onPress={seedData}>
             <Text style={styles.seedText}>+ Seed Sample Data</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'clubs' && { borderBottomColor: theme.colors.primary }]} 
            onPress={() => setActiveTab('clubs')}
          >
              <Text style={[styles.tabText, activeTab === 'clubs' ? { color: theme.colors.primary } : { color: theme.colors.textSecondary }]}>Club Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'appeals' && { borderBottomColor: theme.colors.primary }]} 
            onPress={() => setActiveTab('appeals')}
          >
              <Text style={[styles.tabText, activeTab === 'appeals' ? { color: theme.colors.primary } : { color: theme.colors.textSecondary }]}>Event Appeals</Text>
          </TouchableOpacity>
      </View>

      {activeTab === 'clubs' ? (
        <FlatList
            data={clubs}
            keyExtractor={item => item.id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardContent}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>{item.ownerEmail}</Text>
                    <Text style={[styles.desc, { color: theme.colors.text }]} numberOfLines={2}>{item.description}</Text>
                </View>
                <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectClub(item.id)}>
                        <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveClub(item.id)}>
                        <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                </View>
            </View>
            )}
            ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.textSecondary }]}>No pending club requests</Text>}
        />
      ) : (
        <FlatList
            data={appeals}
            keyExtractor={item => item.id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardContent}>
                    <Text style={[styles.name, {color: theme.colors.error}]}>SUSPENDED: {item.title}</Text>
                    <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>Appeal Status: Pending Review</Text>
                    <Text style={[styles.desc, { color: theme.colors.text }]}>To Admin: "We have fixed the guidelines issue."</Text>
                </View>
                <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectAppeal(item.id)}>
                        <Text style={styles.rejectText}>Reject Appeal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleAcceptAppeal(item.id)}>
                        <Text style={styles.approveText}>Restore Event</Text>
                    </TouchableOpacity>
                </View>
            </View>
            )}
            ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.textSecondary }]}>No pending appeals</Text>}
        />
      )}
    </ScreenWrapper>
  );
}

const getStyles = (theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  seedBtn: {
      padding: 8,
      borderRadius: 4,
  },
  seedText: { fontWeight: 'bold', fontSize: 12 },
  
  tabRow: {
      flexDirection: 'row',
      marginBottom: theme.spacing.m,
      paddingHorizontal: theme.spacing.s,
  },
  tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
  },
  tabText: { fontWeight: 'bold' },

  card: {
    marginHorizontal: theme.spacing.s,
    marginBottom: theme.spacing.m,
    borderRadius: 8,
    ...theme.shadows.small,
    overflow: 'hidden',
  },
  cardContent: { padding: theme.spacing.m },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtext: { fontSize: 12, marginBottom: 8 },
  desc: { fontSize: 14 },
  
  actions: { flexDirection: 'row', borderTopWidth: 1 },
  // Keeping these specific colors as they are semantic (action) colors, but ensuring they are visible
  rejectBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#ffebee' },
  approveBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#e8f5e9' },
  rejectText: { color: theme.colors.error, fontWeight: 'bold' },
  approveText: { color: theme.colors.success, fontWeight: 'bold' },
  
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

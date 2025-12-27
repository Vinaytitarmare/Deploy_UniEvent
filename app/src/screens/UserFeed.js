import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EventCard from '../components/EventCard';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebaseConfig';
import { useTheme } from '../lib/ThemeContext';

const FILTERS = ['Upcoming', 'Past', 'Cultural', 'Sports', 'Tech', 'Workshop', 'Seminar'];

export default function UserFeed({ navigation, headerContent }) {
  const { user, userData, role } = useAuth();
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [participatingIds, setParticipatingIds] = useState([]); // Track joined events
  const [activeFilter, setActiveFilter] = useState('Upcoming');
  const [loading, setLoading] = useState(true);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  // Listen for my registrations
  useEffect(() => {
      if (!user) return;
      const q = collection(db, 'users', user.uid, 'participating');
      const unsub = onSnapshot(q, (snap) => {
          setParticipatingIds(snap.docs.map(d => d.id));
      });
      return unsub;
  }, [user]);

  useEffect(() => {
    // Fetching events. Ideally, we should have two queries (Past vs Upcoming) to save bandwidth.
    // For MVP, we fetch generally and filter client-side to avoid complex Index management for the user right now.
    const q = query(collection(db, 'events'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      const now = new Date();

      snapshot.forEach(doc => {
          const data = doc.data();
          
          // --- FILTER SUSPENDED EVENTS ---
          if (data.status === 'suspended') {
              const isOwner = data.ownerId === user.uid;
              const isAdmin = role === 'admin';
              if (!isOwner && !isAdmin) return;
          }

          list.push({ id: doc.id, ...data });
      });

      setEvents(list);
      setLoading(false);
    }, (error) => {
        console.log("Error fetching events: ", error); 
        setLoading(false);
    });

    return () => unsubscribe();
  }, [role, user.uid]);

  const getFilteredEvents = () => {
    const now = new Date();
    let filtered = events;

    // 1. Strict Profile Filtering (Department & Year)
    if (role === 'student' && userData) { // Admins/Clubs see all
         filtered = filtered.filter(e => {
             // Check Department
             const targetDepts = e.target?.departments || [];
             const userDept = userData.branch || 'All'; // Fallback
             const deptMatch = targetDepts.includes('All') || targetDepts.includes(userDept);
             
             // Check Year
             const targetYears = e.target?.years || [];
             const userYear = parseInt(userData.year || 0);
             // If targetYears is empty/undefined, assume open to all. If present, strict check.
             const yearMatch = targetYears.length === 0 || targetYears.includes(userYear);

             return deptMatch && yearMatch;
         });
    }

    // 2. Tab/Category Filtering
    if (activeFilter === 'Upcoming') {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filtered = filtered.filter(e => new Date(e.startAt) >= yesterday);
        // Sort: Closest upcoming first
        filtered.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    } else if (activeFilter === 'Past') {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filtered = filtered.filter(e => new Date(e.startAt) < yesterday);
        // Sort: Most recent past first
        filtered.sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
    } else {
        // Category filters
        filtered = filtered.filter(e => e.category === activeFilter);
        // Sort: Closest upcoming first for categories too
        filtered.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    }

    return filtered;
  };

  const displayList = getFilteredEvents();
  
  const StickyHeader = () => (
      <View style={{ backgroundColor: theme.colors.background, paddingBottom: 10 }}>
          <View style={styles.headerContainer}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Explore Events</Text>
          </View>
          <View style={styles.filterWrapper}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.filterContent}
            >
                {FILTERS.map(f => (
                    <TouchableOpacity 
                        key={f} 
                        style={[
                            styles.chip, 
                            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                            activeFilter === f && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                        ]}
                        onPress={() => setActiveFilter(f)}
                    >
                        <Text style={[
                            styles.chipText, 
                            { color: theme.colors.text }, 
                            activeFilter === f && { color: '#000', fontWeight: 'bold' } 
                        ]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
      </View>
  );

  const renderEvent = ({ item }) => (
      <EventCard 
        event={item}
        isRegistered={participatingIds.includes(item.id)}
        onLike={() => {}}
        onShare={async () => {
            try {
                await Share.share({
                    message: `Check out this event: ${item.title} at ${item.location}!`,
                });
            } catch (e) { console.log(e); }
        }}
      />
  );

  const headerTranslateY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -50],
      extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
      inputRange: [0, 80],
      outputRange: [1, 0],
      extrapolate: 'clamp'
  });

  const renderHeader = () => (
      <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }}>
          {headerContent}
      </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{marginTop: 50}} />
      ) : (
        <Animated.SectionList
            sections={[{ data: displayList }]}
            keyExtractor={item => item.id}
            renderItem={renderEvent}
            renderSectionHeader={StickyHeader}
            ListHeaderComponent={renderHeader}
            stickySectionHeadersEnabled={true}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
            )}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }} 
            ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50, color: theme.colors.textSecondary}}>No events found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
  },
  welcomeText: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
  },
  headerTitle: {
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.5,
  },
  filterWrapper: {
      height: 60,
  },
  filterContent: {
      paddingHorizontal: 20, // Align with header
      paddingVertical: 10,
      alignItems: 'center', 
  },
  chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8, // Square-ish chips
      borderWidth: 1,
      marginRight: 8,
      justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});

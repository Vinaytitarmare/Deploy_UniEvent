import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export const onEventCreate = functions.firestore
  .document("events/{eventId}")
  .onCreate(async (snapshot, context) => {
    const eventId = context.params.eventId;
    const eventData = snapshot.data();

    if (!eventData) return;

    console.log(`New event created: ${eventId}`, eventData.title);

    const db = admin.firestore();

    // Initialize metrics
    await snapshot.ref.update({
      metrics: {
        views: 0,
        remindersSet: 0,
        registrations: 0,
        attendance: 0,
      },
    });

    // Notification Logic: targeting
    // For MVP, we'll notify users who match the department
    // In a real app, we'd use a Collection Group query or iterate users (expensive)
    // Here we'll just query users in that department to demonstrate flow
    
    const targetDepts = eventData.target?.departments || [];
    
    if (targetDepts.length > 0 && !targetDepts.includes('All')) {
        const usersRef = db.collection('users');
        // Note: 'in' query allows up to 10 values
        const q = usersRef.where('dept', 'in', targetDepts);
        
        const userSnap = await q.get();
        
        const batch = db.batch();
        
        userSnap.forEach(userDoc => {
            const notifRef = userDoc.ref.collection('notifications').doc();
            batch.set(notifRef, {
                title: 'New Event Alert!',
                body: `New event "${eventData.title}" in your department.`,
                eventId: eventId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false
            });
        });
        
        await batch.commit();
        console.log(`Sent notifications to ${userSnap.size} users.`);
    } else {
         // Notify everyone or handle 'All' case - skipping for brevity/perf in demo
         console.log('Skipping mass notification for All departments in demo.');
    }
  });

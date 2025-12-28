"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredFeedbackRequests = exports.checkCompletedEvents = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Scheduled function that runs every hour to check for completed events
 * and create feedback requests for participants
 */
exports.checkCompletedEvents = functions.pubsub
    .schedule('every 1 hours')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
    console.log('Starting checkCompletedEvents function...');
    try {
        const now = admin.firestore.Timestamp.now();
        // Query events that have ended but haven't had feedback requested yet
        const completedEventsSnapshot = await db.collection('events')
            .where('endAt', '<', now)
            .where('feedbackRequested', '!=', true)
            .limit(50) // Process 50 events at a time
            .get();
        console.log(`Found ${completedEventsSnapshot.size} completed events`);
        if (completedEventsSnapshot.empty) {
            console.log('No completed events found');
            return null;
        }
        // Process each completed event
        for (const eventDoc of completedEventsSnapshot.docs) {
            const eventData = eventDoc.data();
            const eventId = eventDoc.id;
            console.log(`Processing event: ${eventId} - ${eventData.title}`);
            // Get all participants for this event
            const participantsSnapshot = await eventDoc.ref
                .collection('participants')
                .get();
            if (participantsSnapshot.empty) {
                console.log(`No participants found for event ${eventId}`);
                // Still mark as feedback requested
                await eventDoc.ref.update({ feedbackRequested: true });
                continue;
            }
            console.log(`Found ${participantsSnapshot.size} participants for event ${eventId}`);
            // Create feedback requests in batches
            const batch = db.batch();
            let batchCount = 0;
            for (const participantDoc of participantsSnapshot.docs) {
                const participantData = participantDoc.data();
                const userId = participantDoc.id;
                // Create feedback request
                const feedbackRequestRef = db.collection('feedbackRequests').doc();
                batch.set(feedbackRequestRef, {
                    userId: userId,
                    userName: participantData.userName || 'User',
                    eventId: eventId,
                    eventTitle: eventData.title || 'Event',
                    clubId: eventData.ownerId,
                    clubName: eventData.organization || 'Organizer',
                    eventEndAt: eventData.endAt,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'pending',
                    expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
                    )
                });
                batchCount++;
                // Commit batch every 500 operations (Firestore limit)
                if (batchCount >= 500) {
                    await batch.commit();
                    console.log(`Committed batch of ${batchCount} feedback requests`);
                    batchCount = 0;
                }
            }
            // Mark event as feedback requested
            batch.update(eventDoc.ref, {
                feedbackRequested: true,
                feedbackRequestedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Commit remaining operations
            if (batchCount > 0) {
                await batch.commit();
                console.log(`Committed final batch of ${batchCount + 1} operations for event ${eventId}`);
            }
            console.log(`Successfully created feedback requests for event ${eventId}`);
        }
        console.log('checkCompletedEvents function completed successfully');
        return null;
    }
    catch (error) {
        console.error('Error in checkCompletedEvents:', error);
        throw error;
    }
});
/**
 * Cleanup function to remove expired feedback requests
 * Runs daily at 2 AM IST
 */
exports.cleanupExpiredFeedbackRequests = functions.pubsub
    .schedule('0 2 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
    console.log('Starting cleanupExpiredFeedbackRequests function...');
    try {
        const now = admin.firestore.Timestamp.now();
        // Query expired feedback requests
        const expiredRequestsSnapshot = await db.collection('feedbackRequests')
            .where('expiresAt', '<', now)
            .where('status', '==', 'pending')
            .limit(500)
            .get();
        console.log(`Found ${expiredRequestsSnapshot.size} expired feedback requests`);
        if (expiredRequestsSnapshot.empty) {
            console.log('No expired feedback requests found');
            return null;
        }
        // Delete expired requests in batch
        const batch = db.batch();
        expiredRequestsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { status: 'expired' });
        });
        await batch.commit();
        console.log(`Marked ${expiredRequestsSnapshot.size} feedback requests as expired`);
        return null;
    }
    catch (error) {
        console.error('Error in cleanupExpiredFeedbackRequests:', error);
        throw error;
    }
});
//# sourceMappingURL=feedbackSystem.js.map
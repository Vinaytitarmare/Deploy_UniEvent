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
exports.onEventCreate = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
exports.onEventCreate = functions.firestore
    .document("events/{eventId}")
    .onCreate(async (snapshot, context) => {
    var _a;
    const eventId = context.params.eventId;
    const eventData = snapshot.data();
    if (!eventData)
        return;
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
    const targetDepts = ((_a = eventData.target) === null || _a === void 0 ? void 0 : _a.departments) || [];
    if (targetDepts.length > 0 && !targetDepts.includes('All')) {
        const usersRef = db.collection('users');
        // Note: 'in' query allows up to 10 values
        const q = usersRef.where('dept', 'in', targetDepts);
        const userSnap = await q.get();
        const batch = db.batch();
        userSnap.forEach((userDoc) => {
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
    }
    else {
        // Notify everyone or handle 'All' case - skipping for brevity/perf in demo
        console.log('Skipping mass notification for All departments in demo.');
    }
});
//# sourceMappingURL=onEventCreate.js.map
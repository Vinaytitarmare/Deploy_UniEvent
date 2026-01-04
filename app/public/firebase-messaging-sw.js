importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyDu0QZ4St-qmDznGLXtBnmsNJWOZrsuIeA',
  authDomain: 'eventloop-c3310.firebaseapp.com',
  projectId: 'eventloop-c3310',
  storageBucket: 'eventloop-c3310.firebasestorage.app',
  messagingSenderId: '447974687688',
  appId: '1:447974687688:web:1d1027b103959888c6f6fd',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/UniEvent.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

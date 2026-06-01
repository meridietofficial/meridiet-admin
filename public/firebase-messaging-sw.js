// eslint-disable-next-line no-undef
importScripts("https://www.gstatic.com/firebasejs/8.8.0/firebase-app.js");
// eslint-disable-next-line no-undef
importScripts("https://www.gstatic.com/firebasejs/8.8.0/firebase-messaging.js");

const firebaseConfig = {
  apiKey: "AIzaSyCcf1l5cB1C7uszfDoCPWz26f-hre_JMaw",
  authDomain: "astropuraan-web.firebaseapp.com",
  databaseURL: "https://astropuraan-web-default-rtdb.firebaseio.com",
  projectId: "astropuraan-web",
  storageBucket: "astropuraan-web.appspot.com",
  messagingSenderId: "1082739821536",
  appId: "1:1082739821536:web:12a928d6cdd590e3173985",
  measurementId: "G-DE7VN86NMX",
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "./images/logo.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);

  if (payload.data.NotificationType === "1") {
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow("/user-chat");
      }
    });
  } else if (payload.data.NotificationType === "2") {
    self.clients.openWindow("/");
  }
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === "open-type-2-route" && self.notificationType2Route) {
    event.waitUntil(clients.openWindow(self.notificationType2Route));
  } else {
  }
  notification.close();
});

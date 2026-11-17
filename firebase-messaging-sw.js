// Firebase Cloud Messaging Service Worker
// This file is required for Firebase Cloud Messaging to work properly
//
// Configuration is shared with frontend via auto-generated firebase-config.js
// To update Firebase config, edit src/config/firebase-config.ts and run npm run prebuild

// @ts-nocheck
// @ts-ignore
/* eslint-env serviceworker */
/* eslint-disable no-undef */
/* global firebase, clients, importScripts, self, firebaseConfig */

// Import Firebase scripts for service worker
importScripts(
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js',
);

// Load Firebase configuration from shared source
importScripts('/js/firebase-config.js');

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(async (payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload,
  );

  // Update app badge when notification arrives (even if app is closed)
  if ('setAppBadge' in navigator) {
    try {
      // Use a valid count from the payload, otherwise show an indicator.
      const rawCount = payload?.data?.unreadCount;
      const badgeCount =
        typeof rawCount === 'string' && /^\d+$/.test(rawCount)
          ? Number(rawCount)
          : undefined;

      if (Number.isSafeInteger(badgeCount) && badgeCount >= 0) {
        await navigator.setAppBadge(badgeCount);
      } else {
        // Fallback: just show a badge indicator (no specific count)
        await navigator.setAppBadge();
      }
    } catch (error) {
      console.debug('[firebase-messaging-sw.js] Badge update failed:', error);
    }
  }
});

// Handle notification click.
//
// Navigation is owned by the Firebase SDK's own `notificationclick` handler,
// which routes to `webpush.fcmOptions.link` (set by the backend from
// `data.click_action` — see BIYD-890). We must NOT navigate here as well:
// this custom handler used to read `event.notification.data?.click_action`,
// but for SDK-displayed notifications that value is nested under `FCM_MSG`, so
// it resolved to `undefined` and fell back to '/', competing with the SDK's
// correct navigation (the "double handler" bug, BIYD-902).
//
// We keep only what the SDK does not do: clear the app badge.
self.addEventListener('notificationclick', (event) => {
  // @ts-ignore - Service worker notification event
  event.notification.close();

  // Clear badge when the user interacts with the notification
  // (the app re-syncs the correct count when it opens).
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch(() => {});
  }
});

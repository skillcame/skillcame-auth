// Proxy file forwards config legacy references to our clean core/firebase implementation
export {
  default,
  auth,
  database,
  storage,
  messaging,
  initializeMessaging,
  requestNotificationPermission,
  onMessageListener
} from '../core/firebase';

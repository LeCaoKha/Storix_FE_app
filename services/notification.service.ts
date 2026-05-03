import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (isRunningInExpoGo()) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    try {
      // Get Expo push token
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn('EAS Project ID is missing. Push notifications might not work. Please check app.json or run "eas project:init"');
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;

      console.log('Expo Push Token:', token);
    } catch (e) {
      console.error('Error getting push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
};

export const setupNotificationListeners = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) => {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification Received:', notification);
    if (onNotificationReceived) onNotificationReceived(notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification Response:', response);
    if (onNotificationResponse) onNotificationResponse(response);
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
};

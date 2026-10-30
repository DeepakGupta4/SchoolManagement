import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { sendLocation } from "@/api/transport";

export const BUS_TASK = "schooldeck-bus-location";

// Registered at app start (imported from app/_layout). The OS wakes this with the
// latest coords — even when the app is backgrounded — and we forward the newest one.
// Best-effort: a dropped ping is fine, the next one replaces it.
TaskManager.defineTask(BUS_TASK, async ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: Location.LocationObject[] })?.locations ?? [];
  const loc = locations[locations.length - 1];
  if (!loc) return;
  try {
    await sendLocation({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      speed: Math.max(0, loc.coords.speed ?? 0),
      heading: loc.coords.heading ?? 0,
    });
  } catch {
    /* next ping retries */
  }
});

// Foreground-only fallback subscription (used inside Expo Go, which has no
// background location); null when the real background service is running instead.
let fgSub: Location.LocationSubscription | null = null;

/**
 * Start sharing location. Returns "background" when the real background service
 * started (a dev / standalone build — survives lock + minimize) or "foreground"
 * when it fell back to a watch that only runs while the app is open (Expo Go).
 */
export async function startTracking(): Promise<"background" | "foreground"> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    throw new Error("Location permission is needed to share your bus location.");
  }
  try {
    await Location.requestBackgroundPermissionsAsync();
  } catch {
    /* background permission is optional — the foreground path still works */
  }

  try {
    const already = await Location.hasStartedLocationUpdatesAsync(BUS_TASK);
    if (!already) {
      await Location.startLocationUpdatesAsync(BUS_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 20,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "SchoolDeck — sharing bus location",
          notificationBody: "Your route is live for parents. Open the app to stop.",
          notificationColor: "#2563eb",
        },
      });
    }
    return "background";
  } catch {
    // Expo Go: no background location — watch position while the app is open.
    if (!fgSub) {
      fgSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
        (loc) => {
          void sendLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            speed: Math.max(0, loc.coords.speed ?? 0),
            heading: loc.coords.heading ?? 0,
          });
        }
      );
    }
    return "foreground";
  }
}

/** Stop sharing — both the background service and any foreground watch. */
export async function stopTracking(): Promise<void> {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(BUS_TASK)) {
      await Location.stopLocationUpdatesAsync(BUS_TASK);
    }
  } catch {
    /* ignore */
  }
  if (fgSub) {
    fgSub.remove();
    fgSub = null;
  }
}

/** Whether location is currently being shared (background service or foreground watch). */
export async function isTracking(): Promise<boolean> {
  if (fgSub) return true;
  try {
    return await Location.hasStartedLocationUpdatesAsync(BUS_TASK);
  } catch {
    return false;
  }
}

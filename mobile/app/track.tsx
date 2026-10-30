import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components";
import { listLiveBuses, type DriverRoute } from "@/api/transport";
import { timeAgo } from "@/lib/time";
import { colors, spacing } from "@/theme";

// A self-contained Leaflet + OpenStreetMap page. We feed it live bus positions
// from React Native via window.updateBuses(). Leaflet + OSM = free, no API key.
const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;width:100%;margin:0;padding:0;background:#eaf2ff}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map',{zoomControl:true}).setView([20.5937,78.9629],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
  var markers = {}, fitted = false;
  function busIcon(){return L.divIcon({html:'<div style="font-size:28px;line-height:28px">🚌</div>',className:'',iconSize:[30,30],iconAnchor:[15,26]});}
  window.updateBuses = function(list){
    try{
      var bounds=[];
      list.forEach(function(b){
        if(b.lat==null||b.lng==null)return;
        var ll=[b.lat,b.lng]; bounds.push(ll);
        if(markers[b.id]){markers[b.id].setLatLng(ll);}
        else{markers[b.id]=L.marker(ll,{icon:busIcon()}).addTo(map).bindPopup(b.name);}
      });
      Object.keys(markers).forEach(function(id){
        if(!list.some(function(b){return String(b.id)===String(id);})){map.removeLayer(markers[id]);delete markers[id];}
      });
      if(!fitted&&bounds.length){map.fitBounds(bounds,{padding:[50,50],maxZoom:15});fitted=true;}
    }catch(e){}
  };
  if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage('ready');}
</script>
</body>
</html>`;

/** Live OSM map of every bus currently sharing its location. Polls every 10s. */
export default function TrackBus() {
  const router = useRouter();
  const web = useRef<WebView>(null);
  const [buses, setBuses] = useState<DriverRoute[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inject = useCallback((list: DriverRoute[]) => {
    const withPos = list.filter((b) => b.lat != null && b.lng != null);
    web.current?.injectJavaScript(`window.updateBuses(${JSON.stringify(withPos)}); true;`);
  }, []);

  const load = useCallback(async () => {
    try {
      const list = await listLiveBuses();
      setBuses(list);
      setError(null);
      if (ready) inject(list);
    } catch {
      setError("Couldn't refresh bus locations.");
    }
  }, [ready, inject]);

  // Poll only while the screen is focused.
  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, 10000);
      return () => clearInterval(id);
    }, [load])
  );

  // Draw whatever we have as soon as the map says it's ready.
  useEffect(() => {
    if (ready) inject(buses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const withPos = buses.filter((b) => b.lat != null && b.lng != null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.flex}>
          <AppText variant="heading">Live bus tracking</AppText>
          <AppText variant="muted">
            {withPos.length === 0
              ? "No buses sharing right now"
              : `${withPos.length} bus${withPos.length > 1 ? "es" : ""} live`}
          </AppText>
        </View>
        <Pressable onPress={load} hitSlop={10}>
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <WebView
        ref={web}
        source={{ html: MAP_HTML }}
        style={styles.map}
        originWhitelist={["*"]}
        onMessage={(e) => {
          if (e.nativeEvent.data === "ready") setReady(true);
        }}
      />

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}
        {withPos.length === 0 ? (
          <AppText variant="muted">Buses appear here the moment a driver turns on sharing.</AppText>
        ) : (
          withPos.map((b) => (
            <View key={b.id} style={styles.row}>
              <View style={styles.dot} />
              <View style={styles.flex}>
                <AppText variant="heading" style={styles.rowTitle}>
                  {b.name}
                </AppText>
                <AppText variant="small">
                  Route {b.code}
                  {b.lastPingAt ? ` · updated ${timeAgo(b.lastPingAt)}` : ""}
                </AppText>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  flex: { flex: 1 },
  map: { flex: 1 },
  list: { maxHeight: 200, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 },
  listContent: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  rowTitle: { fontSize: 15 },
});

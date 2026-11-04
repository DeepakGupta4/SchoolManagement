"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Bus } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { listLiveBuses, type LiveBus } from "@/lib/api/transport";

/**
 * A self-contained Leaflet + OpenStreetMap page (no API key, no npm dependency).
 * It renders inside an iframe; the parent posts live bus positions in via
 * postMessage and the page draws/moves one marker per bus. Mirrors the mobile
 * tracker's map so the two are consistent.
 */
const MAP_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;width:100%;margin:0;padding:0;background:#eaf2ff}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map',{zoomControl:true}).setView([20.5937,78.9629],5);
  map.attributionControl.setPrefix(false);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
  var markers={}, fitted=false;
  function busIcon(){return L.divIcon({html:'<div style="font-size:28px;line-height:28px">🚌</div>',className:'',iconSize:[30,30],iconAnchor:[15,26]});}
  function updateBuses(list){
    try{
      var bounds=[];
      list.forEach(function(b){
        if(b.lat==null||b.lng==null)return;
        var ll=[b.lat,b.lng]; bounds.push(ll);
        var label=(b.name||'Bus')+(b.bus?(' &middot; '+b.bus):'');
        if(markers[b.id]){markers[b.id].setLatLng(ll).setPopupContent(label);}
        else{markers[b.id]=L.marker(ll,{icon:busIcon()}).addTo(map).bindPopup(label);}
      });
      Object.keys(markers).forEach(function(id){
        if(!list.some(function(b){return String(b.id)===String(id);})){map.removeLayer(markers[id]);delete markers[id];}
      });
      if(!fitted&&bounds.length){map.fitBounds(bounds,{padding:[40,40],maxZoom:15});fitted=true;}
    }catch(e){}
  }
  window.addEventListener('message',function(e){var d=e.data; if(d&&d.type==='buses'){updateBuses(d.buses||[]);}});
  if(window.parent){window.parent.postMessage({type:'mapReady'},'*');}
</script>
</body></html>`;

function ago(iso: string): string {
  if (!iso) return "";
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
}

/** Admin live map: every bus currently sharing its location, refreshed every 8s. */
export function LiveBusMap() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const inject = useCallback((list: LiveBus[]) => {
    const withPos = list.filter((b) => b.lat != null && b.lng != null);
    iframeRef.current?.contentWindow?.postMessage({ type: "buses", buses: withPos }, "*");
  }, []);

  const load = useCallback(async () => {
    try {
      const list = await listLiveBuses();
      setBuses(list);
      setError(null);
      inject(list);
    } catch {
      setError("Couldn't refresh bus locations.");
    } finally {
      setLoading(false);
    }
  }, [inject]);

  // Poll every 8s while mounted.
  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  // The iframe tells us when Leaflet is ready; draw whatever we already have.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === "mapReady") setReady(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  useEffect(() => {
    if (ready) inject(buses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const live = useMemo(() => buses.filter((b) => b.lat != null && b.lng != null), [buses]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", live.length ? "animate-pulse bg-success" : "bg-subtle")} />
          <p className="text-sm font-semibold text-text">Live bus tracking</p>
          <span className="text-xs text-muted">
            {loading && buses.length === 0
              ? "Loading…"
              : live.length
                ? `${live.length} bus${live.length === 1 ? "" : "es"} sharing`
                : "No buses sharing right now"}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="px-2" onClick={load} aria-label="Refresh">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <iframe ref={iframeRef} srcDoc={MAP_HTML} title="Live bus map" className="h-[440px] w-full border-0" />

      <CardContent>
        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : live.length === 0 ? (
          <p className="text-xs text-muted">
            Buses appear here the moment a driver turns on location sharing in the app.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {live.map((b) => {
              const stale = !b.lastPingAt || Date.now() - Date.parse(b.lastPingAt) > 60000;
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-md bg-surface-sunken px-3 py-2">
                  <span className={cn("size-2 shrink-0 rounded-full", stale ? "bg-warning" : "bg-success")} />
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                    <Bus className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{b.name}</p>
                    <p className="truncate text-xs text-subtle">
                      {b.code}
                      {b.bus ? ` · ${b.bus}` : ""}
                      {b.lastPingAt ? ` · ${stale ? "last seen " : "updated "}${ago(b.lastPingAt)}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

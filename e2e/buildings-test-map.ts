// Explicit TEST adapter: exercises the real canvas contract, not a map or vendor proof.
export const buildingsTestMap = `
export {escapeMapText,normalizeLongdoStyle,subscribeMapReady} from './src/features/buildings/map/longdo-map-adapter.ts';
class Marker {constructor(location,options){this.location=location;this.options=options}}
class Layer {}
class TestMap {
 constructor(options){
  this.host=options.placeholder;this.events={};this.level=6;this.center={lat:13.7563,lon:100.5018};this.markers=[];
  this.host.innerHTML='<div class="TEST-map-label">TEST ตัวจำลองสัญญาแผนที่ · ไม่มีแผนที่จริง · ผู้ให้บริการจริงยังไม่ยืนยัน</div><div class="TEST-map-markers"></div>';
  this.stage=this.host.querySelector('.TEST-map-markers');
  this.host.onclick=e=>{if(e.target===this.host||e.target===this.stage)this.emit('click')};
  this.Event={bind:(name,fn)=>{(this.events[name]??=[]).push(fn)},unbind:(name,fn)=>{this.events[name]=(this.events[name]||[]).filter(f=>f!==fn)}};
  this.Overlays={add:marker=>{this.markers.push(marker);const node=document.createElement('div');node.className='TEST-map-overlay';node.innerHTML=marker.options?.icon?.html||'<span>TEST GPS</span>';node.onclick=e=>{e.stopPropagation();this.emit('overlayClick',marker)};marker.node=node;this.stage.append(node)},remove:marker=>{marker.node?.remove();this.markers=this.markers.filter(m=>m!==marker)},clear:()=>{this.stage.innerHTML='';this.markers=[]}};
  this.sources={};this.layers={};this.Renderer={isStyleLoaded:()=>true,getLayer:id=>this.layers[id],getSource:id=>this.sources[id],addSource:(id,value)=>{this.sources[id]=value;window.TESTmapCalls.push(['source',id,value])},addLayer:value=>{this.layers[value.id]=value;window.TESTmapCalls.push(['layer',value])},removeLayer:id=>delete this.layers[id],removeSource:id=>delete this.sources[id],once:(_,fn)=>fn(),off:()=>{},remove:()=>{}};
  window.TESTmaps.push(this);setTimeout(()=>this.emit('ready'),0);
 }
 emit(name,event){for(const fn of this.events[name]||[])fn(event)}
 location(value){if(value==='TEST_POINTER')return {lat:14.123456,lon:100.123456};if(value){this.center=value;window.TESTmapCalls.push(['location',value])}return this.center}
 zoom(value){if(value!==undefined&&value!==this.level){this.level=value;this.emit('zoom');window.TESTmapCalls.push(['zoom',value])}return this.level}
 bound(value){window.TESTmapCalls.push(['bound',value]);return this}
 resize(){} destroy(){this.host.innerHTML='';this.events={}}
}
export async function loadLongdoMap(){window.TESTmapAttempts=(window.TESTmapAttempts||0)+1;if(window.TESTstate==='map-error')throw Error('TEST provider unavailable');if(window.TESTstate==='map-loading')return new Promise(()=>{});return {Map:TestMap,Layer,Marker,Layers:{NORMAL:{style:{}}},LocationMode:{Pointer:'TEST_POINTER'},EventName:{Ready:'ready'}}}
`;

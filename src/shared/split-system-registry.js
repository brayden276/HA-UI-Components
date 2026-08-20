/** Shared split-system registry backed by the split_state_registry integration. */
const SPLIT_REGISTRY_ENTITY="sensor.split_state_registry";
const splitV4Room=(roomId,room)=>room&&room.climate?{
  room_id:roomId,
  registry_entity:SPLIT_REGISTRY_ENTITY,
  climate:room.climate,
  controller_entity:room.controller,
  vertical_vane_entity:room.vertical_vane,
  horizontal_vane_entity:room.horizontal_vane,
  area_id:roomId,
  minimum_target:room.minimum_target,
  maximum_target:room.maximum_target,
  fan_ceiling:room.fan_ceiling,
  last_mode:room.last_mode,
  deadline:room.deadline,
  profiles:Array.isArray(room.profiles)?room.profiles:[]
}:null;
const buildSplitV4Registry=hass=>{
  const source=hass?.states?.[SPLIT_REGISTRY_ENTITY],rooms=source?.attributes?.rooms,systems=new Map,claimed=new Set;
  source?.entity_id&&claimed.add(source.entity_id);
  if(!rooms||typeof rooms!=="object")return{systems,claimed,error:null};
  for(const[roomId,room]of Object.entries(rooms)){
    const entry=splitV4Room(roomId,room);
    if(!entry)continue;
    systems.set(entry.climate,entry);
    for(const entityId of[entry.climate,entry.controller_entity,entry.vertical_vane_entity,entry.horizontal_vane_entity].filter(Boolean))claimed.add(entityId);
  }
  return{systems,claimed,error:null};
};
const splitV4RegistrySignature=registry=>JSON.stringify([[...registry.systems].sort(([left],[right])=>left.localeCompare(right)),[...registry.claimed].sort()]);
globalThis.__componentSplitRegistryV4??={
  result:{systems:new Map,claimed:new Set,error:null},
  subscribers:new Set,
  eventSubscription:null,
  load(hass,force=false){
    const previous=this.result,next=buildSplitV4Registry(hass);
    this.result=next;
    if(force||splitV4RegistrySignature(previous)!==splitV4RegistrySignature(next))for(const subscriber of[...this.subscribers])try{subscriber(next)}catch{}
    return Promise.resolve(next);
  },
  refresh(hass){return this.load(hass,true)},
  ensureEvents(hass){
    if(this.eventSubscription||!hass?.connection?.subscribeEvents)return;
    this.eventSubscription=hass.connection.subscribeEvents(event=>{
      event?.data?.entity_id===SPLIT_REGISTRY_ENTITY&&this.refresh(hass);
    },"state_changed").catch(()=>{this.eventSubscription=null});
  },
  subscribe(hass,subscriber){
    this.subscribers.add(subscriber),this.ensureEvents(hass),this.refresh(hass);
    return()=>{this.subscribers.delete(subscriber)};
  }
};

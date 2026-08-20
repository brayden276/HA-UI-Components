/** Shared split-system registry backed by the HA Component Backend integration. */
const SPLIT_REGISTRY_ENTITY="sensor.ha_component_backend";
const splitV4ObjectId=entityId=>String(entityId||"").split(".")[1]||"";
const splitV4RoomId=identity=>{
  const parts=identity.split("_");
  for(let index=1;index<parts.length;index++){
    const candidate=parts.slice(0,index).join("_");
    if(`${candidate}_${candidate}`===identity)return candidate;
  }
  return identity;
};
const splitV4IdentityFromClimate=entityId=>{
  const objectId=splitV4ObjectId(entityId);
  return objectId.endsWith("_split_climate")?objectId.slice(0,-"_split_climate".length):null;
};
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
const splitV4HardwareRoom=entityId=>{
  const identity=splitV4IdentityFromClimate(entityId);
  if(!identity)return null;
  const roomId=splitV4RoomId(identity);
  const controllerBase=`${identity}_split`;
  return{
    room_id:roomId,
    registry_entity:SPLIT_REGISTRY_ENTITY,
    climate:entityId,
    controller_entity:`binary_sensor.${controllerBase}_controller_status`,
    vertical_vane_entity:`select.${controllerBase}_vertical_vane`,
    horizontal_vane_entity:`select.${controllerBase}_horizontal_vane`,
    minimum_target:null,
    maximum_target:null,
    fan_ceiling:null,
    last_mode:null,
    deadline:null,
    profiles:[]
  };
};
const splitV4ClaimsRoomEntity=(entityId,entry)=>{
  if(String(entityId).split(".")[0]==="climate")return false;
  const objectId=splitV4ObjectId(entityId),identity=splitV4IdentityFromClimate(entry.climate);
  return[entry.room_id,identity].filter(Boolean).some(prefix=>objectId.startsWith(`${prefix}_split_`));
};
const buildSplitV4Registry=hass=>{
  const source=hass?.states?.[SPLIT_REGISTRY_ENTITY],rooms=source?.attributes?.rooms,systems=new Map,claimed=new Set;
  source?.entity_id&&claimed.add(source.entity_id);
  if(rooms&&typeof rooms==="object")for(const[roomId,room]of Object.entries(rooms)){
    const entry=splitV4Room(roomId,room);
    if(entry)systems.set(entry.climate,entry);
  }
  for(const entityId of Object.keys(hass?.states??{})){
    if(systems.has(entityId))continue;
    const entry=splitV4HardwareRoom(entityId);
    if(!entry)continue;
    systems.set(entry.climate,entry);
  }
  for(const entry of systems.values()){
    for(const entityId of[entry.climate,entry.controller_entity,entry.vertical_vane_entity,entry.horizontal_vane_entity].filter(Boolean))claimed.add(entityId);
  }
  for(const entityId of Object.keys(hass?.states??{})){
    for(const entry of systems.values())if(splitV4ClaimsRoomEntity(entityId,entry)){claimed.add(entityId);break;}
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
  refresh(hass){return this.load(hass)},
  ensureEvents(hass){
    if(this.eventSubscription||!hass?.connection?.subscribeEvents)return;
    this.eventSubscription=hass.connection.subscribeEvents(event=>{
      event?.data?.entity_id===SPLIT_REGISTRY_ENTITY&&this.refresh(hass);
    },"state_changed").catch(()=>{this.eventSubscription=null});
  },
  subscribe(hass,subscriber){
    const signature=splitV4RegistrySignature(this.result);
    this.subscribers.add(subscriber),this.ensureEvents(hass),this.load(hass).then(result=>{
      this.subscribers.has(subscriber)&&signature===splitV4RegistrySignature(result)&&subscriber(result);
    });
    return()=>{this.subscribers.delete(subscriber)};
  }
};

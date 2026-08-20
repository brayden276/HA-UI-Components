/** Prevent the Room hash update from opening the same drawer twice. */
customElements.whenDefined("component-room-directory-v4").then(()=>{
  const RoomDirectory=customElements.get("component-room-directory-v4");
  const prototype=RoomDirectory?.prototype;
  if(!prototype||prototype.__roomOpenGuardV1)return;
  prototype.__roomOpenGuardV1=true;
  const originalOpenRoom=prototype.openRoom;
  prototype.openRoom=async function(area,writeHash=true){
    const areaId=area?.area_id;
    if(!areaId||this._roomOpenInFlightV1===areaId)return;
    this._roomOpenInFlightV1=areaId;
    try{return await originalOpenRoom.call(this,area,writeHash)}finally{
      if(this._roomOpenInFlightV1===areaId)this._roomOpenInFlightV1=null;
    }
  };
});

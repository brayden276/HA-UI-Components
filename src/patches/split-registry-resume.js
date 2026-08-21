/** Resume an off split from durable registry state instead of reopening mode selection. */
customElements.whenDefined("component-split-controller-v4").then(()=>{
  const Controller=customElements.get("component-split-controller-v4");
  const prototype=Controller?.prototype;
  if(!prototype||prototype.__splitRegistryResumeV1)return;
  prototype.__splitRegistryResumeV1=true;
  const originalPower=prototype.G;
  prototype.G=function(){
    const split=this.Z();
    if(split.uv||split.state?.state!=="off")return originalPower.call(this);
    const mode=this.gt();
    if(!mode||!this.config.room_id)return originalPower.call(this);
    this.Rt("hvac",{
      requested:mode,
      label:this.tt(mode),
      call:()=>this.P.callService("ha_component_backend","resume_room",{room_id:this.config.room_id}),
      matches:()=>this.X(this.config.entity)?.state===mode,
      closePanel:true,
      timeout:10000
    },true);
  };
});

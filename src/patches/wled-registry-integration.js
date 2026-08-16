/** Registers WLED as a dynamic dashboard control without changing its UI. */
const { WLED_HD, WLED_DOMAIN, WLED_NAME } =
  globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

if(!WLED_HD.__wledComponentPatchV1){
  WLED_HD.__wledComponentPatchV1=true;
  const oldUi=WLED_HD.uiEntry;
  WLED_HD.uiEntry=e=>{if(!oldUi?.(e))return false;if(e?.platform!=='wled')return true;if(WLED_DOMAIN(e.entity_id)!=='light')return false;const n=WLED_NAME(e),u=String(e.unique_id||'');return n==='main'||!/_\d+$/.test(u)};
  const oldControl=WLED_HD.controlConfig;
  WLED_HD.controlConfig=(e,s,d,h,split)=>e?.platform==='wled'&&WLED_DOMAIN(e.entity_id)==='light'?{type:'custom:component-wled-controller-v1',entity:e.entity_id,device_id:e.device_id}:oldControl?.(e,s,d,h,split)||null;
  WLED_HD.REG?.refresh?.();
}

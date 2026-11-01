export const touch={x:0,y:0,dig:false};
export function releaseDig(){touch.dig=false;window.dispatchEvent(new Event('treasure:release-dig'));}

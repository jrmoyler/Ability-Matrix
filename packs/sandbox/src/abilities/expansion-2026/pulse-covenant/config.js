export default {
  id:'pulseCovenant',
  meta:{label:'Pulse Covenant',accent:'#ff3a55',element:'blood',cast:'zone',hint:'Blood — land consecutive strikes in rhythm to send a pulse through nearby enemies',glyph:'<path d="M50 80C22 61 20 33 34 27C42 23 48 27 50 33C52 27 58 23 66 27C80 33 78 61 50 80Z"/><path d="M10 53H30L37 43L44 62L51 50H89"/>'},
  settings:{range:8,minRange:.5,speed:100,cooldown:7,castAnim:'cast3',zoneRadius:3.2,lifetime:8,
    life:8, beatSeconds:.6, tolerance:.18, pulseRadius:3.2, damage:.45, maxTargets:5,
    lightColor:'#ff3a55',impactShake:.12,impactFlash:.08,lightIntensity:4,lightRadius:9,heartColor:'#750a22',arteryColor:'#d91f47',bloodGlow:'#ff8290'}
};

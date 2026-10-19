'use client';
import {useEffect,useRef,useState} from 'react';
import {Pause,Play} from 'lucide-react';

/** Decorative scene: lazy-loaded, bounded DPR, paused offscreen, fully disposable. */
export function MaximalScene(){
 const host=useRef<HTMLDivElement>(null);
 const [paused,setPaused]=useState(false);
 const [available,setAvailable]=useState(false);
 useEffect(()=>{
  const element=host.current;if(!element)return;
  let cancelled=false;let cleanup=()=>{};
  import('three').then(THREE=>{
   if(cancelled)return;
   let renderer:InstanceType<typeof THREE.WebGLRenderer>;
   try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
   renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
   element.appendChild(renderer.domElement);
   const scene=new THREE.Scene();
   const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.z=10;
   const group=new THREE.Group();scene.add(group);
   scene.add(new THREE.AmbientLight(0xffffff,2.4));
   const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(4,5,7);scene.add(light);
   const geometries=[new THREE.TorusGeometry(1.15,.36,16,48),new THREE.IcosahedronGeometry(.68,0),new THREE.OctahedronGeometry(.61),new THREE.TorusGeometry(.47,.15,12,32)];
   const colors=[0xdbff63,0xff65b8,0x68d8ff,0xffffff];
   const positions=[[.05,.05,0],[-1.8,1.05,.4],[1.65,-1,.5],[1.7,1.3,-.3]];
   const meshes=geometries.map((geometry,i)=>{const material=new THREE.MeshStandardMaterial({color:colors[i],roughness:.24,metalness:.18});const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...positions[i] as [number,number,number]);mesh.rotation.set(.5+i*.2,.4,.35);group.add(mesh);return mesh;});
   const reduced=matchMedia('(prefers-reduced-motion: reduce)');
   let visible=true;let pointer={x:0,y:0};let t=0;let previous=0;
   const render=(now=0)=>{const delta=previous?Math.min((now-previous)/1000,.05):0;previous=now;if(!paused&&!reduced.matches){t+=delta;group.rotation.y+=(pointer.x*.22-group.rotation.y)*.04;group.rotation.x+=(-pointer.y*.15-group.rotation.x)*.04;meshes.forEach((m,i)=>{m.rotation.y+=delta*(.22+i*.05);m.rotation.z+=delta*.08;m.position.y=positions[i][1]+Math.sin(t*.7+i)*.12;});}renderer.render(scene,camera);};
   const sync=()=>{renderer.setAnimationLoop(null);previous=0;render();if(!paused&&!reduced.matches&&!document.hidden&&visible)renderer.setAnimationLoop(render);};
   const resize=()=>{const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();};
   const observer=new ResizeObserver(resize);observer.observe(element);
   const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()});intersection.observe(element);
   const move=(e:PointerEvent)=>{if(e.pointerType==='touch')return;const box=element.getBoundingClientRect();pointer={x:Math.max(-1,Math.min(1,(e.clientX-box.left)/box.width*2-1)),y:Math.max(-1,Math.min(1,(e.clientY-box.top)/box.height*2-1))};};
   const lost=(e:Event)=>{e.preventDefault();renderer.setAnimationLoop(null);setAvailable(false);};
   window.addEventListener('pointermove',move,{passive:true});document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);renderer.domElement.addEventListener('webglcontextlost',lost);
   setAvailable(true);resize();sync();
   cleanup=()=>{renderer.setAnimationLoop(null);observer.disconnect();intersection.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);renderer.domElement.removeEventListener('webglcontextlost',lost);meshes.forEach(m=>{m.geometry.dispose();m.material.dispose()});renderer.dispose();renderer.domElement.remove();};
  }).catch(()=>{/* The CSS sculpture remains visible without WebGL. */});
  return()=>{cancelled=true;cleanup();};
 },[paused]);
 return <div className="maximal-art"><div className="art-grid" aria-hidden="true"/><div className={'scene-fallback '+(available?'scene-ready':'')} aria-hidden="true"><span/><i/></div><div ref={host} className="three-scene" aria-hidden="true"/><span className="art-sticker" aria-hidden="true">GOOD ENERGY.<br/>GREAT SUPPORT.</span>{available&&<button className="motion-toggle" aria-label={paused?'Play decorative animation':'Pause decorative animation'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={12}/>:<Pause size={12}/>}<span>{paused?'Play motion':'Pause motion'}</span></button>}</div>;
}

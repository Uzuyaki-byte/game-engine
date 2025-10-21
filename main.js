// -------------------- Three.js + Controls --------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import Matter from 'matter-js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// -------------------- Core Systems --------------------
// Entity Registry
export class EntityRegistry {
  constructor() { this.entities = new Map(); this._nextId = 1; }
  register({name='Entity', type='mesh', object3D}) {
    const id = `ent_${this._nextId++}`;
    this.entities.set(id, {id,name,type,object3D,scripts:[],animations:[]});
    object3D.userData.entityId = id;
    return this.entities.get(id);
  }
  all(){ return Array.from(this.entities.values()); }
  get(id){ return this.entities.get(id); }
  serialize(){ return this.all().map(e=>({
    id:e.id,name:e.name,type:e.type,
    transform:{position:e.object3D.position.toArray(),
               rotation:e.object3D.rotation.toArray(),
               scale:e.object3D.scale.toArray()},
    scripts:e.scripts, animations:e.animations
  })); }
  deserialize(data,scene){
    data.forEach(d=>{
      const obj = scene.getObjectByName(d.name) || new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xff0000}));
      obj.position.fromArray(d.transform.position);
      obj.rotation.fromArray(d.transform.rotation);
      obj.scale.fromArray(d.transform.scale);
      scene.add(obj);
      const entry = this.register({name:d.name,type:d.type,object3D:obj});
      entry.scripts = d.scripts; entry.animations = d.animations;
    });
  }
}

// Model Loader (GLB/FBX + procedural)
export class ModelLoader {
  constructor({scene}){ this.scene=scene; this.imported=[]; this._id=1; this.animMixers=[]; }
  createBox({name='Box', width=1,height=1,depth=1,color='#00ff00'}){
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),
                                new THREE.MeshStandardMaterial({color}));
    mesh.name=name; this.scene.add(mesh);
    const id=this._id++;
    this.imported.push({id,obj:mesh,params:{name,width,height,depth,color},source:'procedural'});
    return {id,obj:mesh};
  }
  async importFile(file){
    const ext = file.name.split('.').pop().toLowerCase();
    let obj=null;
    if(ext==='glb'||ext==='gltf'){
      obj = await new Promise(res=>{
        new GLTFLoader().parse(await file.arrayBuffer(), '', gltf => res(gltf.scene));
      });
    } else if(ext==='fbx'){
      obj = new FBXLoader().parse(await file.arrayBuffer());
    }
    if(obj){ this.scene.add(obj); const id=this._id++; this.imported.push({id,obj,source:'file',fileName:file.name}); return {id,obj}; }
  }
  playAnimation(obj,clipIndex=0){
    if(!obj.animations || obj.animations.length===0) return;
    const mixer = new THREE.AnimationMixer(obj);
    mixer.clipAction(obj.animations[clipIndex]).play();
    this.animMixers.push(mixer);
  }
  update(dt){ this.animMixers.forEach(m=>m.update(dt)); }
}

// Box Maker UI
export class BoxMaker {
  constructor({container,modelLoader}){ this.container=container; this.modelLoader=modelLoader; this.onCreate=null;
    const panel=document.createElement('div'); panel.className='palette'; panel.innerHTML='<b>Box Maker</b><br>';
    const btn=document.createElement('button'); btn.textContent='Create Box'; btn.onclick=()=>{
      const box=this.modelLoader.createBox({});
      if(this.onCreate) this.onCreate(box);
    };
    panel.appendChild(btn); container.appendChild(panel);
  }
}

// -------------------- Blueprint Editor --------------------
export class BlueprintEditor {
  constructor(){ this.nodes=[]; }
  serialize(){ return {nodes:this.nodes}; }
  deserialize(data){ this.nodes=data.nodes||[]; }
}

// -------------------- Scripting System --------------------
export class ScriptingSystem {
  constructor({scene,registry}){ this.scene=scene; this.registry=registry; this.scripts=[]; }
  attachScript(entityId,fn){ this.scripts.push({entityId,fn}); }
  update(dt){ this.scripts.forEach(s=>{ const ent=this.registry.get(s.entityId); if(ent) s.fn(ent,dt); }); }
  getScriptFilesForExport(){ return this.scripts.map((s,i)=>({name:`script_${i}.js`,file:`// script for ${s.entityId}`})); }
}

// -------------------- Panels --------------------
export class EntityPanel {
  constructor({container,registry,scene,camera,controls}){ this.registry=registry; this.scene=scene; this.camera=camera; this.controls=controls; this.container=container; this.onSelect=null; this.refresh(); }
  refresh(){
    this.container.querySelectorAll('.entity-list').forEach(el=>el.remove());
    const list=document.createElement('div'); list.className='entity-list';
    this.registry.all().forEach(e=>{
      const item=document.createElement('div'); item.textContent=e.name; item.style.cursor='pointer';
      item.onclick=()=>{ this.controls.target.copy(e.object3D.position); this.controls.update(); if(this.onSelect)this.onSelect(e); };
      list.appendChild(item);
    });
    this.container.appendChild(list);
  }
}

export class Inspector {
  constructor({container,registry,scripting}){ this.container=container; this.registry=registry; this.scripting=scripting; this.current=null; }
  showEntity(entity){ this.current=entity; console.log('Selected entity:',entity.name); }
}

export class AnimationPanel {
  constructor({container,registry}){ this.container=container; this.registry=registry; this.onPlayClip=null; }
}

export class CutscenePanel {
  constructor({container,registry}){ this.container=container; this.registry=registry; this.cutscenes=[]; }
  serialize(){ return this.cutscenes; }
  deserialize(data){ this.cutscenes=data||[]; }
}

export class QuestPanel {
  constructor({container}){ this.container=container; this.quests=[]; }
  serialize(){ return this.quests; }
  deserialize(data){ this.quests=data||[]; }
}

// -------------------- Exporter --------------------
export async function exportProject({blueprint,modelLoader,scripting,registry,cutscenePanel,questPanel}){
  const zip = new JSZip();
  const gameJson = blueprint.serialize();
  gameJson.extra = gameJson.extra||{};
  gameJson.extra.entities = registry.serialize();
  gameJson.extra.proceduralAssets = modelLoader.imported;
  gameJson.extra.scripts = scripting.getScriptFilesForExport();
  gameJson.extra.cutscenes = cutscenePanel.serialize();
  gameJson.extra.quests = questPanel.serialize();
  zip.file('game.json',JSON.stringify(gameJson,null,2));
  const blob = await zip.generateAsync({type:'blob'});
  saveAs(blob,'project_export.zip');
}

// -------------------- Load Project from ZIP --------------------
export async function loadProjectFromZip(file,scene,registry,modelLoader,blueprint,scripting,cutscenePanel,questPanel){
  const zip = await JSZip.loadAsync(file);
  const gameFile = zip.file('game.json');
  if(!gameFile) throw new Error('game.json not found in ZIP');
  const gameJson = JSON.parse(await gameFile.async('string'));
  blueprint.deserialize(gameJson);
  registry.deserialize(gameJson.extra.entities||[],scene);
  cutscenePanel.deserialize(gameJson.extra.cutscenes);
  questPanel.deserialize(gameJson.extra.quests);
  modelLoader.imported = gameJson.extra.proceduralAssets||[];
  return gameJson;
}

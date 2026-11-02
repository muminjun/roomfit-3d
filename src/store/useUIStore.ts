import { create } from 'zustand';
import type { PointMm } from '../types/model';
type Tool = 'select'|'wallMove'|'indent'|'protrude';
type UIStore = {
 selected: {kind:'room'|'wall'|'furniture';id:string}|null; setSelected:(selected:UIStore['selected'])=>void;
 tool:Tool; setTool:(tool:Tool)=>void;
 preview: {polygon:PointMm[];valid:boolean;message:string}|null; setPreview:(preview:UIStore['preview'])=>void;
 saveStatus:'clean'|'pending'|'saved'|'failed'|'conflict'; setSaveStatus:(status:UIStore['saveStatus'])=>void;
};
export const useUIStore = create<UIStore>((set)=>({selected:null,setSelected:selected=>set({selected,preview:null}),tool:'select',setTool:tool=>set({tool,preview:null}),preview:null,setPreview:preview=>set({preview}),saveStatus:'clean',setSaveStatus:saveStatus=>set({saveStatus})}));

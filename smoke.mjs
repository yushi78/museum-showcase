import { THREE, M, box, cyl, group, exportGLB, triCount } from './tools/lib/kit.mjs';
const g = group(box(1,1,1,M.bronzePatina(),[0,0.5,0]), cyl(0.3,0.4,0.6,M.gold(),[0,1.3,0]));
const size = await exportGLB(g, './site/models/_smoke.glb');
console.log('OK bytes=', size, 'tris=', triCount(g));

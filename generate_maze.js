/**
 * 迷宮地城生成器 v6 (final)
 * 3-tile buffer: entry → corridor → wall separator → maze
 * Guarantees no shortcuts from corridor to maze
 */
const FW=40, FH=26, IW=34, IH=20;

let seed=2026;
function rng(){seed=(seed*1664525+1013904223)&0x7FFFFFFF;return seed/0x7FFFFFFF;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

const grid=[];
for(let r=0;r<FH;r++)grid[r]=new Array(FW).fill('W');
function set(c,r,t){if(r>=0&&r<FH&&c>=0&&c<FW)grid[r][c]=t;}
function si(ix,iy,t){set(ix+3,iy+3,t);}
function gi(ix,iy){return(ix>=0&&ix<IW&&iy>=0&&iy<IH)?grid[iy+3][ix+3]:'X';}

// Outer ring O + Breakable wall B
for(let r=0;r<2;r++)for(let c=0;c<FW;c++)set(c,r,'O');
for(let r=24;r<26;r++)for(let c=0;c<FW;c++)set(c,r,'O');
for(let r=2;r<=23;r++){set(0,r,'O');set(1,r,'O');set(38,r,'O');set(39,r,'O');}
for(let c=3;c<=36;c++){set(c,2,'B');set(c,23,'B');}
set(2,2,'W');set(37,2,'W');set(2,23,'W');set(37,23,'W');
for(let r=3;r<=22;r++){set(2,r,'B');set(37,r,'B');}

// 3-tile buffer (all stay W from init):
//   Top:    y=0(entry), y=1(corridor), y=2(wall sep)
//   Bottom: y=19(entry), y=18(corridor), y=17(wall sep)
//   Left:   x=0(entry), x=1(corridor), x=2(wall sep)
//   Right:  x=33(entry), x=32(corridor), x=31(wall sep)

// Inner maze zone: x=3..30, y=3..16 → 28×14
// Cell (cx,cy) → interior (cx*2+3, cy*2+3)
// cx: 0..13, cy: 0..6 → 14×7 = 98 cells
const MCW=14,MCH=7;
function c2i(cx,cy){return[cx*2+3,cy*2+3];}

// Rooms (interior coords, within inner zone x=3..30, y=3..16)
const rooms=[
  {n:'water',x1:5,y1:4,x2:8,y2:6},      // 4×3 P
  {n:'lava',x1:24,y1:4,x2:27,y2:6},     // 4×3 .+A
  {n:'guard',x1:13,y1:8,x2:18,y2:10},    // 6×3 .+W
  {n:'core',x1:14,y1:11,x2:17,y2:14},    // 4×4 shell
  {n:'court',x1:5,y1:12,x2:9,y2:15},     // 5×4 G
  {n:'abyss',x1:10,y1:13,x2:17,y2:15},   // bridge zone
  {n:'treasury',x1:24,y1:12,x2:26,y2:14},// 3×3 .
];
function inRoom(ix,iy){return rooms.some(z=>ix>=z.x1&&ix<=z.x2&&iy>=z.y1&&iy<=z.y2);}
function cellInRoom(cx,cy){const[ix,iy]=c2i(cx,cy);return inRoom(ix,iy);}

// Open cell positions
for(let cy=0;cy<MCH;cy++)
  for(let cx=0;cx<MCW;cx++)
    if(!cellInRoom(cx,cy)){const[ix,iy]=c2i(cx,cy);si(ix,iy,'.');}

// Recursive backtracker
const vis=new Set();
function ck(a,b){return`${a},${b}`;}
function nb(cx,cy){
  return shuffle([[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[cx+dx,cy+dy]))
    .filter(([nx,ny])=>nx>=0&&nx<MCW&&ny>=0&&ny<MCH&&!vis.has(ck(nx,ny))&&!cellInRoom(nx,ny));
}

// Start near center (cell 6,3 → interior 15,9)
vis.add(ck(6,3));
const stk=[[6,3]];
while(stk.length>0){
  const[cx,cy]=stk[stk.length-1];
  const n=nb(cx,cy);
  if(!n.length)stk.pop();
  else{
    const[nx,ny]=n[0];
    vis.add(ck(nx,ny));
    const[ix,iy]=c2i(cx,cy);
    si(ix+(nx-cx),iy+(ny-cy),'.'); // carve wall between
    stk.push([nx,ny]);
  }
}

// === Place rooms ===
function clr(x1,y1,x2,y2,t){for(let iy=y1;iy<=y2;iy++)for(let ix=x1;ix<=x2;ix++)si(ix,iy,t);}

// Water Dungeon 4×3
clr(5,4,8,6,'P');
si(4,5,'.'); si(9,5,'.'); si(10,5,'.'); // L/R entries

// Lava Altar 4×3
clr(24,4,27,6,'.');
si(25,5,'A');si(26,5,'A');si(25,4,'A');si(26,4,'A');
si(23,5,'.'); si(28,5,'.'); si(22,5,'.');

// Guard Hall 6×3
clr(13,8,18,10,'.');
si(15,9,'W');si(17,9,'W'); // pillars
si(12,9,'.'); si(11,9,'.'); // left
si(19,9,'.'); si(20,9,'.'); // right
si(15,7,'.'); si(15,6,'.'); // top
si(16,11,'.'); // bottom to core

// Heart Core 4×4 shell
clr(14,11,17,14,'W');
si(15,12,'H');si(16,12,'H');si(15,13,'H');si(16,13,'H');
si(16,11,'.'); // north from guard
si(15,14,'.'); // south exit

// Court 5×4
clr(5,12,9,15,'G');
si(4,13,'.'); si(10,13,'.'); si(7,11,'.'); si(7,10,'.');
si(10,12,'.');

// Abyss Bridge: 1-wide at y=14, A flanking at y=13 and y=15
for(let ix=10;ix<=17;ix++){si(ix,13,'A');si(ix,14,'.');si(ix,15,'A');}
si(9,14,'.'); si(8,14,'.'); // west connect to court area
si(15,14,'.'); // east connects to heart south (already open)

// Treasury 3×3
clr(24,12,26,14,'.');
si(23,13,'.'); si(22,13,'.'); // single entry

// Re-assert Heart tiles (abyss at y=13 may have overwritten)
si(15,12,'H');si(16,12,'H');si(15,13,'H');si(16,13,'H');

// Extra connections
si(26,7,'.'); si(26,8,'.');

// === 4 snaking entry corridors ===
// Each: 1 tile on perimeter → long corridor in buffer → connection through separator

// NORTH: enter (8,0) → go RIGHT along y=1 to (29,1) → connect (29,2)→(29,3) into maze
si(8,0,'.'); // entry (only path tile on y=0)
for(let x=8;x<=29;x++) si(x,1,'.'); // 22-tile corridor
si(29,2,'.'); // open separator
// (29,3) should be maze cell (13,0) → already open

// SOUTH: enter (22,19) → go LEFT along y=18 to (3,18) → connect (3,17)→(3,16)→(3,15) into maze
si(22,19,'.'); // entry (only path tile on y=19)
for(let x=3;x<=22;x++) si(x,18,'.'); // 20-tile corridor
si(3,17,'.'); si(3,16,'.'); // open separator + connect to maze row
// (3,15) should be near maze cell (0,6) at interior (3,15) → check: inRoom(3,15)? No. ✓

// WEST: enter (0,6) → go DOWN along x=1 to (1,13) → connect (2,13)→(3,13) into maze
si(0,6,'.'); // entry (only path tile on x=0)
for(let y=6;y<=13;y++) si(1,y,'.'); // 8-tile corridor
si(2,13,'.'); // open separator
// (3,13) should be maze cell (0,5) at interior (3,13) → open

// EAST: enter (33,6) → go DOWN along x=32 to (32,13) → connect (31,13)→(30,13)→(29,13) into maze
si(33,6,'.'); // entry (only path tile on x=33)
for(let y=6;y<=13;y++) si(32,y,'.'); // 8-tile corridor
si(31,13,'.'); si(30,13,'.'); // open separator + approach
// (29,13) = maze cell (13,5) at interior (29,13) → open

// === BFS ===
function bfs(sc,sr){
  const ok=(c,r)=>{if(r<0||r>=FH||c<0||c>=FW)return false;const t=grid[r][c];return t==='.'||t==='P'||t==='G'||t==='H';};
  const v=new Set();const q=[{c:sc,r:sr}];v.add(`${sc},${sr}`);let h=0;
  while(h<q.length){const cur=q[h++];for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const nc=cur.c+dc,nr=cur.r+dr,k=`${nc},${nr}`;if(!v.has(k)&&ok(nc,nr)){v.add(k);q.push({c:nc,r:nr});}}}
  return v;
}

let hC=-1,hR=-1;
for(let r=0;r<FH;r++)for(let c=0;c<FW;c++)if(grid[r][c]==='H'&&hC<0){hC=c;hR=r;}

let reach=bfs(hC,hR);

// Fix unreachable
for(let pass=0;pass<20;pass++){
  let fixed=0;
  for(let r=3;r<=22;r++)for(let c=3;c<=36;c++){
    const t=grid[r][c];
    if((t==='.'||t==='P'||t==='G')&&!reach.has(`${c},${r}`)){
      for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){
        const wc=c+dc,wr=r+dr,nc=c+dc*2,nr=r+dr*2;
        if(wr>=3&&wr<=22&&wc>=3&&wc<=36&&grid[wr][wc]==='W'&&reach.has(`${nc},${nr}`)){
          grid[wr][wc]='.';fixed++;break;
        }
      }
    }
  }
  if(!fixed)break;
  reach=bfs(hC,hR);
}

// Distance check
function bfsDist(sc,sr){
  const ok=(c,r)=>{if(r<0||r>=FH||c<0||c>=FW)return false;const t=grid[r][c];return t==='.'||t==='P'||t==='G'||t==='H';};
  const d={};d[`${sc},${sr}`]=0;const q=[{c:sc,r:sr,d:0}];let h=0;
  while(h<q.length){const cur=q[h++];for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const nc=cur.c+dc,nr=cur.r+dr,k=`${nc},${nr}`;if(!(k in d)&&ok(nc,nr)){d[k]=cur.d+1;q.push({c:nc,r:nr,d:cur.d+1});}}}
  return d;
}

const hDist=bfsDist(hC,hR);
let minE=Infinity,maxE=0,entryN=0;
const eList=[];
for(let r=3;r<=22;r++)for(let c=3;c<=36;c++){
  let adjB=false;
  for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]])if(grid[r+dr]?.[c+dc]==='B')adjB=true;
  if(adjB&&(grid[r][c]==='.'||grid[r][c]==='P'||grid[r][c]==='G')){
    const d=hDist[`${c},${r}`];
    if(d!==undefined){entryN++;if(d<minE)minE=d;if(d>maxE)maxE=d;eList.push({c,r,d});}
  }
}

// Validation
let errs=[];
for(let r=0;r<FH;r++)if(grid[r].length!==40)errs.push(`R${r}:${grid[r].length}`);
let hCnt=0;for(let r=0;r<FH;r++)for(let c=0;c<FW;c++)if(grid[r][c]==='H')hCnt++;
const fr=bfs(hC,hR);
let tp=0,ur=0;
for(let r=0;r<FH;r++)for(let c=0;c<FW;c++){const t=grid[r][c];if(t==='.'||t==='P'||t==='G'||t==='H'){tp++;if(!fr.has(`${c},${r}`))ur++;}}

console.log('=== Validation ===');
console.log(`40c:${errs.length===0?'Y':'N'} H:${hCnt} Path:${tp} Ur:${ur} Entry:${entryN}`);
console.log(`min=${minE} max=${maxE} ${minE>=25?'✅ PASS':'⚠️ FAIL'}`);
eList.sort((a,b)=>a.d-b.d).forEach(e=>console.log(`  (${e.c},${e.r}) d=${e.d}`));

console.log('\n=== Layout ===');
for(let r=0;r<FH;r++)console.log(`    '${grid[r].join('')}',`);

console.log('\n=== Visual ===');
const S={'O':'░','B':'▓','W':'█','.':'·','P':'≈','G':'♣','A':'▼','H':'♥'};
for(let r=0;r<FH;r++)console.log(grid[r].map(t=>S[t]||t).join(''));

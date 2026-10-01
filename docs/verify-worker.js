self.onmessage=({data})=>{
  try{
    const {rows,deadlines,initial}=data;
    if(JSON.stringify(deadlines)!=='[3,4,5,20,22,32]'||!Array.isArray(rows))throw Error('Nieprawidłowa instancja.');
    const index=new Map();let edges=0;
    const key=s=>s.slice(0,6).join(',');
    rows.forEach((r,i)=>{if(r.length!==13||!r.every(Number.isInteger)||r.slice(0,7).some(x=>x<0)||r.slice(0,6).some((a,j)=>a>=deadlines[j]))throw Error('Nieprawidłowy stan.');const k=key(r);if(index.has(k))throw Error('Powtórzony stan.');index.set(k,i);});
    if(!rows[initial]||key(rows[initial])!=='0,0,0,0,0,0')throw Error('Brak stanu początkowego.');
    rows.forEach((r,i)=>{let max=-1;for(let t=0;t<6;t++){const next=r.slice(0,6).map((a,j)=>j===t?0:a+1);const legal=next.every((a,j)=>a<deadlines[j]);if(!legal){if(r[7+t]!==-1)throw Error('Nielegalny ruch dopuszczony.');continue;}const n=index.get(key(next));if(n===undefined||r[7+t]!==n)throw Error('Pominięto dozwolony ruch.');if(rows[n][6]>=r[6])throw Error('Ranga nie maleje.');max=Math.max(max,rows[n][6]);edges++;}if(r[6]!==max+1)throw Error('Niepoprawna ranga.');if(i%5000===0)self.postMessage({progress:Math.round(100*i/rows.length)});});
    self.postMessage({ok:true,states:rows.length,edges,rank:rows[initial][6]});
  }catch(e){self.postMessage({ok:false,error:e.message});}
};

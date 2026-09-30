import { createRoot } from 'react-dom/client'
import './src/theme.css'
import { PersonRow } from './src/components/PersonRow.jsx'
import { RoleBadge } from './src/components/RoleBadge.jsx'
const combos=[['sage','light'],['sage','dark'],['dawn','light'],['dawn','dark']]
function App(){return <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>{combos.map(([d,m])=>
 <div key={d+m} data-dir={d} data-mode={m} style={{background:'var(--bg)',padding:16,fontFamily:'var(--font-body)'}}>
  <div style={{background:'var(--surface)',borderRadius:16,padding:8}}>
   <PersonRow person={{username:'noharm',role:'official',streak:12,hue:150}} />
   <PersonRow person={{username:'leogotardo',role:'admin',online:true,hue:30}} />
   <PersonRow person={{username:'someone',hue:200,online:false}} />
  </div>
  <div style={{textAlign:'center',marginTop:10,color:'var(--ink)',fontSize:22,fontWeight:700}}>noharm<div style={{marginTop:6}}><RoleBadge role="official" size="md"/> <RoleBadge role="admin" size="md"/></div></div>
 </div>)}</div>}
createRoot(document.getElementById('root')).render(<App/>)

import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:620}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5191/.preview.html'); await p.waitForTimeout(1500);
await p.screenshot({path:'/tmp/claude-1000/-home-leog-Documentos-noharm/c3e9ce21-8ce4-4e19-90bb-a69a0eada137/scratchpad/roles.png'}); console.log(errs); await b.close();

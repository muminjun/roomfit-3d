import { readFileSync } from 'node:fs';
const repo=process.env.GITHUB_REPOSITORY?.split('/')[1];
const requested=process.env.VITE_BASE_PATH ?? (repo && !repo.endsWith('.github.io') ? repo : '');
const normalized=requested.replace(/^\/+|\/+$/g,'');
const base=`/${normalized}${normalized?'/':''}`;
const html=readFileSync('dist/index.html','utf8');
for(const value of html.matchAll(/(?:src|href)="([^"]+)"/g)){const path=value[1];if(path.startsWith('/')&&!path.startsWith(base))throw new Error(`Unexpected asset path ${path}; expected ${base}`);}
if(!html.includes(`${base}assets/`)) throw new Error(`Missing assets with base ${base}`);
console.log(`dist paths use ${base}`);

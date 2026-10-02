import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loader, renderToStaticMarkup} from './runtime-harness.mjs';
const dictionary = JSON.parse(readFileSync('lib/dictionaries/en.json','utf8'));
const load=loader(undefined, {
  '@/lib/content/blog-feed':{listHubArticleEntries:async()=>[{slug:'published-fixture',updatedAt:'2026-09-01T00:00:00Z'}]},
  '@/lib/dictionary':{getDictionary:async()=>dictionary},
});
const {STYLES}=load('lib/styles.ts');
const {toStyleSlug,findPortraitStyle}=load('lib/seo/styles.ts');
const {default:StylePage,generateMetadata,generateStaticParams}=load('app/[lang]/styles/[style]/page.tsx');
const {extractFaqFromHtml}=load('lib/seo/faq.ts');
const {default:sitemap}=load('app/sitemap.ts');
const schemas=markup=>[...markup.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
const visible=markup=>markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');

for(const style of STYLES) {
 test(`${style.label}: rendered FAQ and steps match JSON-LD and canonical sitemap route`,async()=>{
  const slug=toStyleSlug(style.id),props={params:Promise.resolve({lang:'en',style:slug})};
  const markup=renderToStaticMarkup(await StylePage(props));
  const faq=schemas(markup).find(x=>x['@type']==='FAQPage');
  const expected=faq.mainEntity.map(x=>({question:x.name,answer:x.acceptedAnswer.text}));
  assert.equal(expected.length,4);
  assert.deepEqual(extractFaqFromHtml(visible(markup)),expected);
  const howTo=schemas(markup).find(x=>x['@type']==='HowTo');
  const plain=visible(markup).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  for(const step of howTo.step)assert.ok(plain.includes(step.text));
  assert.equal((markup.match(/<h1\b/g)||[]).length,1);
  assert.match(markup,/href="\/en\/pricing\/?"/);
  const meta=await generateMetadata(props);
  const canonical=`https://pixpawai.com/en/styles/${slug}/`;
  assert.equal(meta.alternates.canonical,canonical);
  assert.equal(meta.openGraph.url,canonical);
  assert.ok((await sitemap()).some(x=>x.url===canonical));
 });
}
test('display-label aliases consolidate metadata and breadcrumb on ID URLs; invalid styles stay missing',async()=>{
 const style=STYLES.find(x=>toStyleSlug(x.label)!==toStyleSlug(x.id));assert.ok(style);
 const alias=toStyleSlug(style.label),canonical=toStyleSlug(style.id);
 assert.equal(findPortraitStyle(alias),style);
 const props={params:Promise.resolve({lang:'en',style:alias})};
 assert.equal((await generateMetadata(props)).alternates.canonical,`https://pixpawai.com/en/styles/${canonical}/`);
 const markup=renderToStaticMarkup(await StylePage(props));
 const trail=schemas(markup).find(x=>x['@type']==='BreadcrumbList');
 assert.equal(trail.itemListElement.at(-1).item,`/en/styles/${canonical}/`);
 assert.equal(findPortraitStyle('definitely-not-a-style'),undefined);
 await assert.rejects(()=>StylePage({params:Promise.resolve({lang:'en',style:'definitely-not-a-style'})}),/NEXT_HTTP_ERROR_FALLBACK;404/);
});
test('FAQ directory links every active style to one canonical URL and sitemap never exposes aliases or private routes',async()=>{
 const {default:FaqPage}=load('app/[lang]/faq/page.tsx');
 const markup=renderToStaticMarkup(await FaqPage({params:Promise.resolve({lang:'en'})}));
 const expected=STYLES.map(x=>`/en/styles/${toStyleSlug(x.id)}/`);
 const links=[...markup.matchAll(/href="(\/en\/styles\/[^" ]+)"/g)].map(x=>x[1]);
 // Next Link normalizes trailing slashes using build-time Next configuration.
 assert.deepEqual(links.map(x=>x.endsWith('/')?x:x+'/'),expected);
 const params=await generateStaticParams();assert.deepEqual(params.map(x=>x.style),STYLES.map(x=>toStyleSlug(x.id)));
 const entries=await sitemap(),urls=entries.map(x=>x.url);
 assert.equal(urls.length,new Set(urls).size);
 assert.deepEqual(urls.filter(x=>x.includes('/styles/')),expected.map(x=>'https://pixpawai.com'+x));
 assert.ok(urls.some(x=>x.endsWith('/blog/published-fixture/')));
 assert.ok(!urls.some(x=>/\/(admin|dashboard|auth|payment|test-qwen)\//.test(x)));
 assert.equal(entries.find(x=>x.url.endsWith('/gallery/')).lastModified.toISOString(),'2026-08-29T00:00:00.000Z');
});

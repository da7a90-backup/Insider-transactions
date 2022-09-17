import { randomInt } from "crypto";
import { XMLParser } from "fast-xml-parser";
import fetch from "node-fetch";
import HttpsProxyAgent from 'https-proxy-agent';
const proxyAgent = new HttpsProxyAgent('http://20.43.60.43:8000');


const getFilingsJsonFeed = async ()=>{
    let feed = await fetch('https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=only&start=0&count=100&output=atom',
    {agent:proxyAgent,'Host': 'www.sec.gov','Accept-Encoding': 'gzip, deflate'});
  
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true
  },true);
    let jsonFeed = parser.parse(await feed.text());

    return jsonFeed;
}
const fetchAndParseForms = async (urls) => {
    let forms = [];
    console.log("Starting:\n")

    for(const url of urls){
        console.log("PROCESSING:"+url)

        let feed = await fetch(url,
            {agent:proxyAgent,'Host': 'www.sec.gov','Accept-Encoding': 'gzip, deflate'});
          
            const parser = new XMLParser({
              ignoreAttributes: false,
              parseAttributeValue: true
          },true);
            let jsonForm = parser.parse(await feed.text());
            if(jsonForm!==undefined){
                let code = jsonForm.ownershipDocument.nonDerivativeTable.nonDerivativeTransaction.transactionCoding.transactionCode;
                if(code==='P'||code==='S'){
                    console.table(jsonForm);
                    forms.push(jsonForm);
                }
            }
            console.log("Done Processing\n")

        await new Promise(r => setTimeout(r, 2500+randomInt(200)));
    }
    return forms;
}
/*
const throttledScrapingProcess = async (items, interval, func) => {  
    console.log('PROCESSING', items[0], Date()) // this is where your http call/update/etc takes place
        await func(items[0])
        if (items.length == 1) { // stop when there's no more items to process
            console.log('ALL DONE')
            return
          }  
    setTimeout(async () => await throttledScrapingProcess(items.slice(1), interval+5+randomInt(100),func), // wrap in an arrow function to defer evaluation
      interval)
  }*/

const getFormURLsFromJsonFeed = async (feed)=>{
    const urlPromises = feed.feed.entry.map(async (entry)=>{
        let url = entry.link['@_href']
        await new Promise(r => setTimeout(r, 2500+randomInt(200)));
        return await scrapeFormUrlFromDirectoryUrl(url)
    })

    const urls = await Promise.all(urlPromises);
    return urls;
  
}

const scrapeFormUrlFromDirectoryUrl = async (url)=>{
    await new Promise(r => setTimeout(r, 2500+randomInt(200)));
    let page = await fetch(url.slice(0, url.lastIndexOf('/'))+"/index.xml",
        {agent:proxyAgent,'Host': 'www.sec.gov','Accept-Encoding': 'gzip, deflate'});
        const parser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true
        });
    const dirXml = parser.parse(await page.text());

    
    return "https://www.sec.gov"+dirXml.directory.item[dirXml.directory.item.length-1].href
}

(async () => {

  const jsonFeed = await getFilingsJsonFeed();
    
  const urls = await getFormURLsFromJsonFeed(jsonFeed);

  const forms = await fetchAndParseForms(urls);

 console.log(forms)


})();
import 'dotenv/config';
import { OpenAI } from 'openai';

import { exec } from 'child_process';
import { writeFile } from "fs";
import puppeteer from "puppeteer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";



async function executeCommand(cmd = '') {
  return new Promise((res, rej) => {
    exec(cmd, (error, data) => {
      if (error) {
        return res(`Error running command ${error}`);
      } else {
        res(data);
      }
    });
  });
}

function writeToFile(str) {
    
    
    const fileName = str[0]
    const content = str[1]
  fs.writeFile(fileName, content, (err) => {
    if (err) {
      return "Error writing to file:", err;
    } else {
      return `Successfully wrote to ${fileName}`;
    }
  });
}

const userInput = process.argv.slice(2)[0]




cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(filePath) {
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      folder: "website_cloner", // optional: auto organize uploads
      resource_type: "image",
    });

    console.log("✅ Uploaded:", res.secure_url);
    return res.secure_url; // Public URL
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    throw err;
  }
}





async function scrape(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

  // 1️⃣ Get HTML
  const html = await page.content();

  // 2️⃣ Get Screenshot
  const screenshotPath = "screenshot.png";
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const ssPath = uploadToCloudinary("screenshot.png");

  // 3️⃣ Extract assets (CSS, JS, images)
  const assets = await page.evaluate(() => {
    const urls = new Set();

    // CSS
    document.querySelectorAll("link[rel='stylesheet']").forEach(link => {
      urls.add(link.href);
    });

    // JS
    document.querySelectorAll("script[src]").forEach(script => {
      urls.add(script.src);
    });

    // Images
    document.querySelectorAll("img[src]").forEach(img => {
      urls.add(img.src);
    });

    // Background images (inline CSS)
    document.querySelectorAll("*").forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg.startsWith("url(")) {
        urls.add(bg.slice(5, -2)); // clean `url("...")`
      }
    });

    return Array.from(urls);
  });
  

  await browser.close();
  return { html, ssPath, assets };
}


const TOOL_MAP = {
  executeCommand: executeCommand,
  writeToFile: writeToFile,
  scrape : scrape,
};

const client = new OpenAI();

async function main() {
  // These api calls are stateless (Chain Of Thought)
  const SYSTEM_PROMPT = `
    You are an AI assistant who works on START, THINK and OUTPUT format.
    And an amazing frontend developer and coder, Your work is to clone the site's UI from the url provided by the user.
    You should always keep thinking and thinking before giving the actual output.
    
    Also, before outputing the final result to user you must check once if everything is correct.
    You also have list of available tools that you can call based on requirements.
    
    For every tool call that you make, wait for the OBSERVATION from the tool which is the
    response from the tool that you called.

    Available Tools:
    - executeCommand(command: string): Takes a CLI command for windows as arg and executes the command on user's machine and returns the output.
    - writeToFile([filename , content]: array with filename at index 0 and content at index 1): Writes the content to a file with the given filename that you have to create 
    - scrape(url: string): Scrapes the url and returns the html content of the site and the path to the screenshot of the site which you have to copy and the list of all the assets used in the site(like this {html, ssPath, assets }).

    Rules:
    - Strictly follow the output JSON format
    - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Alway make sure to do multiple steps of thinking before giving out output.
    - For every tool call always wait for the OBSERVE which contains the output from tool
    - Create folder and files for modular code .
    - Give all the files and folders in a seperate folder
    - clone the whole page same as the screenshot not just 100vh of the page .
    - it should have all the sections of scrapped html and screenshot in index.html(for example :- header, main , section ,article ,  footer ) it should have 
      everything if dynamic convert to static then code but it should have it that too similar same as the site .
    - it should have every content of the page with same UI (for example :- hero , course , work experience , contacts , etc).
    - Do not download assets for assets use url , and for css use tailwind if needed. 
    - Page should look same as the screenshot including assets.

    Note: 
    - if you ever use tailwind than you have to add this in head for cdn :- <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    - I repeat it should be a full page clone not just 100vh of the page , same as the screenshot given and all the assets should be working . 
    - Write in correct files and folders
    - If any section of screenshot or scrapped html is missing in the code written re iterate the code.
    - clone the whole page till the page is scrollable.


    Output JSON Format:
    { "step": "START | THINK | OUTPUT | OBSERVE | TOOL" , "content": "string", "tool_name": "string", "input": "STRING" }

    Example:
    User: "https://www.google.com" ?
    ASSISTANT: { "step": "START", "content": "The user is intertested in geetting a clone of google.com's UI" } 
    ASSISTANT: { "step": "THINK", "content": "I should start scrapping the site to fetch html, screenshot path and assets of the site " } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available scrape that can scrap the site and return the html content, screenshot path and assets of the site" }
    ASSISTANT: { "step": "TOOL", "input" : "https://www.google.com" , "tool_name" : "scrape" }
    ASSISTANT: { "step": "OBSERVE", "content" : "{htmlContent , screenshotPath , assets}" }
    ASSISTANT: { "step": "THINK", "content": "I need to make a folder named googleUI" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available executeCommand that can execute a command on user's machine to make folder" }
    ASSISTANT: { "step": "TOOL", "input" : "mkdir googleUI"  , "tool_name" : "executeCommand" }
    ASSISTANT: { "step": "OBSERVE", "content" : "Made directory successfully" }
   
    ASSISTANT: { "step": "THINK", "content": "I need to change my directory to googleUI" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available executeCommand that can execute a command on user's machine to change directory" }
    ASSISTANT: { "step": "TOOL", "input" : "cd .\googleUI\"  , "tool_name" : "executeCommand" }
    ASSISTANT: { "step": "OBSERVE", "content" : "Changed directory successfully" }
    ASSISTANT: { "step": "THINK", "content": "I need to make a file of html for the site" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available executeCommand that can execute a command on user's machine to make file" }
    ASSISTANT: { "step": "TOOL", "input" : "New-Item -Name "index.html" -ItemType File"  , "tool_name" : "executeCommand" }
    ASSISTANT: { "step": "OBSERVE", "content" : "Created file successfully" }
    ASSISTANT: { "step": "THINK", "content": "I need to make a file of css for the site" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available executeCommand that can execute a command on user's machine to make file" }
    ASSISTANT: { "step": "TOOL", "input" : "New-Item -Name "index.css" -ItemType File"  , "tool_name" : "executeCommand" }
    ASSISTANT: { "step": "OBSERVE", "content" : "Created file successfully" }
    ASSISTANT: { "step": "THINK", "content": "I need to make a file of js for the site" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available executeCommand that can execute a command on user's machine to make file" }
    ASSISTANT: { "step": "TOOL", "input" : "New-Item -Name "index.js" -ItemType File"  , "tool_name" : "executeCommand" }
    ASSISTANT: { "step": "OBSERVE", "content" : "Created file successfully" }
    ASSISTANT: { "step": "THINK", "content": "I need to write code to match the UI of google.com from the screenshot path , html content and assets given" } 
    
    ASSISTANT: { "step": "THINK", "content": "I should refine the html scrapped to match the screenshot , if helpfull should use assets also and write the code in the files created" }
    ASSISTANT: { "step": "THINK", "content": "Done.. Now I should write it in index.html" }
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available writeToFile that can  write on a file" }
    ASSISTANT: { "step": "TOOL", "input" : "["index.html", "HTMLCode that LLM will generate"]"  , "tool_name" : "writeToFile" }
    ASSISTANT: { "step": "OBSERVE", "content" : "Successfully wrote to index.html"}
    ASSISTANT: { "step": "THINK", "content": "I should write css to match the screenshot fully , if helpfull should use assets and scraped code also and write the code in the files created" }
    ASSISTANT: { "step": "THINK", "content": "Done.. Now I should write it in index.css" }
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available writeToFile that can  write on a file" }
    ASSISTANT: { "step": "TOOL", "input" : "["index.html", "CSS that LLM will generate"]"  , "tool_name" : "writeToFile" }
    ASSISTANT: { "step": "OBSERVE", "content" : "Successfully wrote to index.css"}
    ASSISTANT: { "step": "THINK", "content": "I should write javascript to match the screenshot fully , if helpfull should use assets and scraped code also and write the code in the files created" }
    ASSISTANT: { "step": "THINK", "content": "Done.. Now I should write it in index.js" }
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available writeToFile that can  write on a file" }
    ASSISTANT: { "step": "TOOL", "input" : "["index.html", "Javascript code that LLM will generate"]"  , "tool_name" : "writeToFile" }
    ASSISTANT: { "step": "OBSERVE", "content" : "Successfully wrote to index.js"}
   ASSISTANT: { "step": "THINK", "content": "I should check if code generated by me matches the UI of google.com using the screenshot path, if it doesn't I should re iterate my code until it does" }
   ASSISTANT: { "step": "THINK", "content": "Success... Yes it does match the UI of google.com" }
    
    ASSISTANT: { "step": "OUTPUT", "content": "Clone of https://www.google.com is ready" }
  `;

  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: userInput,
    },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: messages,
    });

    const rawContent = response.choices[0].message.content;
    const parsedContent = JSON.parse(rawContent);

    messages.push({
      role: 'assistant',
      content: JSON.stringify(parsedContent),
    });

    if (parsedContent.step === 'START') {
      console.log(`🔥`, parsedContent.content);
      continue;
    }

    if (parsedContent.step === 'THINK') {
      console.log(`\t🧠`, parsedContent.content);
      continue;
    }

    if (parsedContent.step === 'TOOL') {
      const toolToCall = parsedContent.tool_name;
      if (!TOOL_MAP[toolToCall]) {
        messages.push({
          role: 'developer',
          content: `There is no such tool as ${toolToCall}`,
        });
        continue;
      }

      const responseFromTool = await TOOL_MAP[toolToCall](parsedContent.input);
      console.log(
        `🛠️: ${toolToCall}(${parsedContent.input}) = `,
        responseFromTool
      );
      messages.push({
        role: 'developer',
        content: JSON.stringify({ step: 'OBSERVE', content: responseFromTool }),
      });
      continue;
    }

    if (parsedContent.step === 'OUTPUT') {
      console.log(`🤖`, parsedContent.content);
      break;
    }
  }

  console.log('Done...');
}

main();
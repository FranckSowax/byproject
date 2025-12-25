# **Gemini 3 Overview**

## **Introduction**

Gemini 3 is marking a major milestone two years into the Gemini era. With billions of users engaging with Gemini-powered products, this release continues Google’s mission to rapidly deliver advanced AI through its full-stack approach — from infrastructure to models to products that reach the world.

## **What’s New in Gemini 3**

Gemini 3 is Google’s most intelligent, multimodal model to date. It unifies and advances every capability from prior generations to help users *learn, build, and plan anything*. Key improvements include:

* State-of-the-art reasoning with deeper contextual understanding and more nuanced interpretations.  
* Better intent recognition, requiring fewer prompts.

---

## **Performance Highlights**

Gemini 3 delivers substantial improvements across reasoning, multimodality, coding, and factual accuracy:

* \#1 on LMArena (1501 Elo)  
* PhD-level reasoning with top scores on Humanity’s Last Exam and GPQA Diamond  
* Breakthrough mathematics with state-of-the-art MathArena Apex performance  
* Leading multimodal understanding with top results on MMMU-Pro and Video-MMMU  
* High factual reliability, scoring 72.1% on SimpleQA Verified

### **Gemini 3 Deep Think**

A new enhanced-reasoning mode that pushes performance even further, achieving:

* 41% on Humanity’s Last Exam  
* 93.8% on GPQA Diamond  
* 45.1% on ARC-AGI-2 (with code execution)

Deep Think will be released to Google AI Ultra subscribers after final safety review.

---

## **What You Can Do with Gemini 3**

### **Learn Anything**

Gemini 3’s million-token context window and multimodal reasoning enable richer understanding and personalized learning:  
\- Translate and preserve handwritten family recipes  
\- Convert research papers or long videos into interactive learning tools  
\- Analyze sports footage and generate personalized training plans  
\- Explore new web experiences in AI Mode with dynamic, generative UIs

### **Build Anything**

Gemini 3 is Google’s most powerful vibe coding and agentic coding model:  
\- Exceptional zero-shot generation and complex prompt handling  
\- Top of WebDev Arena (1487 Elo)  
\- Advanced tool use (54.2% on Terminal-Bench 2.0)  
\- Strong agentic performance (76.2% on SWE-bench Verified)

### **Plan Anything**

Gemini 3 excels at long-horizon planning and consistent multi-step execution:  
\- \#1 on Vending-Bench 2 for year-long simulated planning  
\- Capable of handling real-world tasks like inbox organization or service booking  
\- Gemini Agent now available to Google AI Ultra subscribers

---

## **Responsible AI & Safety**

Gemini 3 is Google’s most secure model yet, with extensive evaluations including:  
\- Reduced sycophancy and stronger prompt-injection resistance  
\- Enhanced defenses against cyber misuse  
\- External evaluations by Apollo, Vaultis, Dreadnode, and partnership with bodies like the UK AISI

---

## **Looking Ahead**

Gemini 3 marks the start of a new chapter focused on advancing intelligence, agents, and personalization. Google will continue iterating rapidly — and looks forward to seeing what users build with it.

Set the REPLICATE\_API\_TOKEN environment variable

export REPLICATE\_API\_TOKEN=r8\_SeY8Lg7u8nagGcSccRjWQPkipr6sHL32HAZGM  
Visibility  
Copy

[Learn more about authentication](https://replicate.com/google/gemini-3-pro/api/learn-more#authentication)

Install Replicate’s Node.js client library

npm install replicate  
Copy  
[Learn more about setup](https://replicate.com/google/gemini-3-pro/api/learn-more#setup)

Run google/gemini-3-pro using Replicate’s API. Check out the model's [schema](https://replicate.com/google/gemini-3-pro/api/schema) for an overview of inputs and outputs.

import Replicate from "replicate";  
const replicate \= new Replicate();

const input \= {  
    audio: "https://replicate.delivery/pbxt/O5Vw2eTOp7z4V27QYXqEUQZ5OvwTEKj2TVf3syi4dTJpvUG9/Never%20Gonna%20Give%20You%20Up%20-%20Rick%20Astley.mp3",  
    prompt: "Why should I be scared of this audio?",  
    thinking\_level: "low"  
};

for await (const event of replicate.stream("google/gemini-3-pro", { input })) {  
  process.stdout.write(\`${event}\`)  
};

//=\> "You shouldn't be scared for your safety, but you might b…

## **Input schema**

TableJSON  
{  
  "type": "object",  
  "title": "Input",  
  "required": \[  
    "prompt"  
  \],  
  "properties": {  
    "audio": {  
      "type": "string",  
      "title": "Audio",  
      "format": "uri",  
      "x-order": 3,  
      "nullable": true,  
      "description": "Input audio to send with the prompt (max 1 audio file, up to 8.4 hours)"  
    },  
    "top\_p": {  
      "type": "number",  
      "title": "Top P",  
      "default": 0.95,  
      "maximum": 1,  
      "minimum": 0,  
      "x-order": 7,  
      "description": "Nucleus sampling parameter \- the model considers the results of the tokens with top\_p probability mass"  
    },  
    "images": {  
      "type": "array",  
      "items": {  
        "type": "string",  
        "format": "uri"  
      },  
      "title": "Images",  
      "default": \[\],  
      "x-order": 1,  
      "description": "Input images to send with the prompt (max 10 images, each up to 7MB)"  
    },  
    "prompt": {  
      "type": "string",  
      "title": "Prompt",  
      "x-order": 0,  
      "description": "The text prompt to send to the model"  
    },  
    "videos": {  
      "type": "array",  
      "items": {  
        "type": "string",  
        "format": "uri"  
      },  
      "title": "Videos",  
      "default": \[\],  
      "x-order": 2,  
      "description": "Input videos to send with the prompt (max 10 videos, each up to 45 minutes)"  
    },  
    "temperature": {  
      "type": "number",  
      "title": "Temperature",  
      "default": 1,  
      "maximum": 2,  
      "minimum": 0,  
      "x-order": 6,  
      "description": "Sampling temperature between 0 and 2"  
    },  
    "thinking\_level": {  
      "enum": \[  
        "low",  
        "high"  
      \],  
      "type": "string",  
      "title": "thinking\_level",  
      "description": "Thinking level for reasoning (low or high). Replaces thinking\_budget for Gemini 3 models.",  
      "x-order": 5,  
      "nullable": true  
    },  
    "max\_output\_tokens": {  
      "type": "integer",  
      "title": "Max Output Tokens",  
      "default": 65535,  
      "maximum": 65535,  
      "minimum": 1,  
      "x-order": 8,  
      "description": "Maximum number of tokens to generate"  
    },  
    "system\_instruction": {  
      "type": "string",  
      "title": "System Instruction",  
      "x-order": 4,  
      "nullable": true,  
      "description": "System instruction to guide the model's behavior"  
    }  
  }  
}

## **Output schema**

TableJSON  
{  
  "type": "array",  
  "items": {  
    "type": "string"  
  },  
  "title": "Output",  
  "x-cog-array-type": "iterator",  
  "x-cog-array-display": "concatenate"  
}  

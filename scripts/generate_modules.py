import json
import os

# Define output directories
modules_dir = "/var/home/wtg/Repos/course-catalog/public/content/tracks/agentic-engineering/agy-311/modules"
scratch_dir = "/var/home/wtg/.gemini/antigravity-cli/brain/9b98efbd-6ce7-4922-b107-9f3154ab80eb/scratch"

# Create directories if they do not exist
os.makedirs(modules_dir, exist_ok=True)
os.makedirs(scratch_dir, exist_ok=True)

# ----------------- MODULE 1 -----------------
m1_blocks = [
    {
        "type": "p",
        "content": "To integrate autonomous AI agents into enterprise workflows, developers must move beyond basic prompt-response sandboxes. The Google Antigravity SDK provides programmatic bindings that allow you to orchestrate conversation lifecycles, manage execution sessions, and connect to cloud APIs. In this module, we explore the SDK architecture, install the required packages, and establish an OAuth 2.0 connection to the Google Workspace ecosystem."
    },
    {
        "type": "h2",
        "content": "Core SDK Architectural Pillars"
    },
    {
        "type": "p",
        "content": "The Antigravity SDK is designed around a clean separation of concerns, divided into three fundamental objects:"
    },
    {
        "type": "list",
        "items": [
            "Agent: The configuration and capability registry. It manages access tokens, loads system instructions, defines active tools, handles safety settings, and registers lifecycle hooks.",
            "Conversation: The stateful session container. It persists interaction histories, records execution trajectories, tracks tokens, and executes context compaction policies when input limits are reached.",
            "Connection: The abstract network transport layer. It encapsulates HTTP/REST and WebSocket protocols, managing requests, responses, and token streaming with the Gemini model backends."
        ]
    },
    {
        "type": "h2",
        "content": "Developer Setup & Dependencies"
    },
    {
        "type": "p",
        "content": "The Antigravity SDK is available for both Python and Node.js. Choose your preferred language runtime and verify your local environment setup (Python 3.10+ or Node.js 18+ is required)."
    },
    {
        "type": "code",
        "language": "bash",
        "content": "# Install the Python SDK library\npip install google-antigravity google-auth-oauthlib google-api-python-client"
    },
    {
        "type": "code",
        "language": "bash",
        "content": "# Install the Node.js SDK library\nnpm install @google/antigravity googleapis @google-cloud/local-auth"
    },
    {
        "type": "h2",
        "content": "Google Workspace OAuth 2.0 Authentication"
    },
    {
        "type": "p",
        "content": "To programmatically manage resources in Google Drive, Docs, and Sheets, your application must obtain authorized user credentials. The standard method is OAuth 2.0, which allows developers to request specific scopes of access."
    },
    {
        "type": "info",
        "content": "Authentication Decoupling: Use OAuth Client IDs (Desktop Application) for interactive user scripts that need personal Drive access. For headless backend pipelines running on servers, configure Google Cloud Service Accounts with domain-wide delegation or explicitly shared folder access to avoid manual verification gates."
    },
    {
        "type": "p",
        "content": "Follow these steps to establish authorization in the Google Cloud Console:"
    },
    {
        "type": "list",
        "items": [
            "1. Navigate to the GCP Console (https://console.cloud.google.com) and create or select a project.",
            "2. Navigate to 'API & Services' > 'Library' and enable the Google Drive API, Google Docs API, and Google Sheets API.",
            "3. Configure the OAuth Consent Screen: Set the User Type to 'Internal' (if using a Google Workspace domain) or 'External'. Add the required scopes: https://www.googleapis.com/auth/drive, https://www.googleapis.com/auth/documents, and https://www.googleapis.com/auth/spreadsheets.",
            "4. Go to 'Credentials' > 'Create Credentials' > 'OAuth Client ID'. Select 'Desktop Application' as the application type, name the client, and click create.",
            "5. Download the credentials JSON file, rename it to 'credentials.json', and place it in the root of your local project workspace."
        ]
    },
    {
        "type": "h2",
        "content": "Programmatic OAuth Implementation (Python)"
    },
    {
        "type": "p",
        "content": "The following Python script implements the OAuth 2.0 flow. It launches a local loopback server to handle the user consent redirect, retrieves access/refresh tokens, writes them to a local 'token.json' file for persistence, and initializes the Google API service clients."
    },
    {
        "type": "code",
        "language": "python",
        "content": "import os.path\nfrom google.auth.transport.requests import Request\nfrom google.oauth2.credentials import Credentials\nfrom google_auth_oauthlib.flow import InstalledAppFlow\nfrom googleapiclient.discovery import build\n\n# Define the required scopes for Drive, Docs, and Sheets\nSCOPES = [\n    'https://www.googleapis.com/auth/drive',\n    'https://www.googleapis.com/auth/documents',\n    'https://www.googleapis.com/auth/spreadsheets'\n]\n\ndef get_workspace_credentials():\n    creds = None\n    # The token.json file stores the user's access and refresh tokens\n    if os.path.exists('token.json'):\n        creds = Credentials.from_authorized_user_file('token.json', SCOPES)\n        \n    # If credentials do not exist or are invalid, run the login flow\n    if not creds or not creds.valid:\n        if creds and creds.expired and creds.refresh_token:\n            print(\"Refreshing expired OAuth token...\")\n            creds.refresh(Request())\n        else:\n            print(\"Initializing fresh local OAuth consent flow...\")\n            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)\n            creds = flow.run_local_server(port=0)\n            \n        # Save the credentials for subsequent script executions\n        with open('token.json', 'w') as token_file:\n            token_file.write(creds.to_json())\n            \n    return creds\n\nif __name__ == '__main__':\n    credentials = get_workspace_credentials()\n    # Initialize the standard Google Workspace API clients\n    drive_client = build('drive', 'v3', credentials=credentials)\n    docs_client = build('docs', 'v1', credentials=credentials)\n    sheets_client = build('sheets', 'v4', credentials=credentials)\n    print(\"API clients successfully authenticated with OAuth!\")"
    },
    {
        "type": "h2",
        "content": "Programmatic OAuth Implementation (Node.js)"
    },
    {
        "type": "p",
        "content": "Below is the equivalent implementation in Node.js using ES module syntax. It loads the Client ID credentials, handles token exchange, and exports standard API client wrappers."
    },
    {
        "type": "code",
        "language": "javascript",
        "content": "import fs from 'fs';\nimport path from 'path';\nimport { authenticate } from '@google-cloud/local-auth';\nimport { google } from 'googleapis';\n\nconst SCOPES = [\n  'https://www.googleapis.com/auth/drive',\n  'https://www.googleapis.com/auth/documents',\n  'https://www.googleapis.com/auth/spreadsheets'\n];\nconst TOKEN_PATH = path.join(process.cwd(), 'token.json');\nconst CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');\n\nasync function loadSavedCredentialsIfExist() {\n  try {\n    if (fs.existsSync(TOKEN_PATH)) {\n      const content = fs.readFileSync(TOKEN_PATH, 'utf8');\n      const credentials = JSON.parse(content);\n      return google.auth.fromJSON(credentials);\n    }\n  } catch (err) {\n    return null;\n  }\n  return null;\n}\n\nasync function saveCredentials(client) {\n  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');\n  const keys = JSON.parse(content);\n  const key = keys.installed || keys.web;\n  const payload = JSON.stringify({\n    type: 'authorized_user',\n    client_id: key.client_id,\n    client_secret: key.client_secret,\n    refresh_token: client.credentials.refresh_token,\n    access_token: client.credentials.access_token,\n    token_type: client.credentials.token_type,\n    expiry_date: client.credentials.expiry_date,\n  });\n  fs.writeFileSync(TOKEN_PATH, payload);\n}\n\nasync function getWorkspaceClient() {\n  let client = await loadSavedCredentialsIfExist();\n  if (client) {\n    return client;\n  }\n  \n  console.log(\"Initializing local redirect server for OAuth verification...\");\n  client = await authenticate({\n    scopes: SCOPES,\n    keyfilePath: CREDENTIALS_PATH,\n  });\n  \n  if (client.credentials) {\n    await saveCredentials(client);\n  }\n  return client;\n}\n\nasync function run() {\n  const auth = await getWorkspaceClient();\n  const drive = google.drive({ version: 'v3', auth });\n  const docs = google.docs({ version: 'v1', auth });\n  const sheets = google.sheets({ version: 'v4', auth });\n  console.log(\"Node.js Workspace API clients successfully constructed!\");\n}\n\nrun().catch(console.error);"
    },
    {
        "type": "h2",
        "content": "Check Your Understanding"
    },
    {
        "type": "p",
        "content": "Question 1: Which Google Cloud credentials type is most appropriate for a backend automated script running on a cloud server that reads shared folder contents without requiring human interaction?"
    },
    {
        "type": "p",
        "content": "- A) API Key"
    },
    {
        "type": "p",
        "content": "- B) Service Account JSON File"
    },
    {
        "type": "p",
        "content": "- C) OAuth Client ID (Desktop Application)"
    },
    {
        "type": "p",
        "content": "- D) OAuth Client ID (Web Application) with short-lived access tokens"
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: B. Service Accounts allow backend-to-backend operations without interactive human-in-the-loop authorization gates."
    },
    {
        "type": "p",
        "content": "Question 2: Why are scopes required during the OAuth consent screen configuration?"
    },
    {
        "type": "p",
        "content": "- A) To increase the token encryption level."
    },
    {
        "type": "p",
        "content": "- B) To define the specific boundaries of access (e.g. read-only vs edit permissions for Sheets/Drive) that the application is authorized to request."
    },
    {
        "type": "p",
        "content": "- C) To compile the GCP project code."
    },
    {
        "type": "p",
        "content": "- D) To limit the number of parallel requests the script can make."
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: B. OAuth scopes limit access authority, protecting the user's data from unauthorized modifications by restricting the client's capabilities."
    }
]

# ----------------- MODULE 2 -----------------
m2_blocks = [
    {
        "type": "p",
        "content": "When executing complex workflows, waiting for a model to generate its entire response before displaying or parsing it can cause long latencies. The Google Antigravity SDK supports real-time streaming of both final response text and intermediate reasoning thoughts. Furthermore, to make these loops reliable, developers must master prompt structuring to feed contextual inputs correctly."
    },
    {
        "type": "h2",
        "content": "Streaming Text and Thoughts"
    },
    {
        "type": "p",
        "content": "For reasoning-capable models, the response contains two distinct outputs: the model's internal thinking trajectory (reasoning chain) and the actual user-facing text answer. The SDK exposes these as separate streaming interfaces, allowing you to display intermediate reasoning blocks in real time."
    },
    {
        "type": "h2",
        "content": "Asynchronous Streaming in Python"
    },
    {
        "type": "p",
        "content": "The following Python script illustrates how to instantiate an agent and stream thoughts followed by text content using asynchronous iterators."
    },
    {
        "type": "code",
        "language": "python",
        "content": "import asyncio\nfrom google.antigravity import Agent, LocalAgentConfig\n\nasync def run_streaming_demo():\n    # Default configuration loads gemini-3.5-flash which supports streaming\n    config = LocalAgentConfig()\n    \n    async with Agent(config) as agent:\n        response = await agent.chat(\"Explain the difference between a list and a set in Python, including time complexity.\")\n        \n        print(\"--- Agent Reasoning Thoughts ---\")\n        # Access thoughts stream (only populated for reasoning-enabled models)\n        async for thought in response.thoughts:\n            print(thought, end='', flush=True)\n        print(\"\\n\")\n        \n        print(\"--- Agent Text Response ---\")\n        # Stream the final user-facing text tokens\n        async for token in response:\n            print(token, end='', flush=True)\n        print(\"\\n\")\n\nif __name__ == '__main__':\n    asyncio.run(run_streaming_demo())"
    },
    {
        "type": "h2",
        "content": "Asynchronous Streaming in Node.js"
    },
    {
        "type": "p",
        "content": "Below is the equivalent implementation in Node.js, iterating over the thoughts stream and standard text stream using `for await...of` construct."
    },
    {
        "type": "code",
        "language": "javascript",
        "content": "import { Agent, LocalAgentConfig } from '@google/antigravity';\n\nasync function runStreaming() {\n  const config = new LocalAgentConfig();\n  const agent = new Agent(config);\n  await agent.start();\n  \n  try {\n    const response = await agent.chat(\"Explain the difference between a list and a set in Python, including time complexity.\");\n    \n    console.log(\"--- Agent Reasoning Thoughts ---\");\n    for await (const thought of response.thoughts) {\n      process.stdout.write(thought);\n    }\n    console.log(\"\\n\");\n    \n    console.log(\"--- Agent Text Response ---\");\n    for await (const token of response) {\n      process.stdout.write(token);\n    }\n    console.log(\"\\n\");\n  } finally {\n    await agent.stop();\n  }\n}\n\nrunStreaming().catch(console.error);"
    },
    {
        "type": "h2",
        "content": "Structuring Agent Prompts programmatically"
    },
    {
        "type": "p",
        "content": "Standardizing prompt inputs prevents agents from wandering outside operational rules. A robust prompt design pattern separates the System Instructions (the immutable boundaries and behavior instructions) from the User Context and Target Input."
    },
    {
        "type": "warning",
        "content": "Do not mix system instructions and dynamic user-supplied context in a single concatenated string. Doing so increases the risk of prompt injection, where user content overrides instructions."
    },
    {
        "type": "p",
        "content": "Use the following programmatic structure to build prompts:"
    },
    {
        "type": "list",
        "items": [
            "System Instructions: Define the role (e.g. 'You are a Google Docs format inspector'), response rules, and formatting outputs.",
            "Variables and XML tags: Encapsulate runtime inputs (like doc text, file dates) inside clearly labeled delimiters (e.g., <document_content>...</document_content>).",
            "Task Statement: A final, clear instruction explaining exactly what processing action the agent must perform on the context."
        ]
    },
    {
        "type": "h2",
        "content": "Prompt Construction (Python)"
    },
    {
        "type": "code",
        "language": "python",
        "content": "import asyncio\nfrom google.antigravity import Agent, LocalAgentConfig\n\nasync def run_prompt_structuring():\n    system_instruction = (\n        \"You are a technical document editor. Your task is to clean up raw transcriptions. \"\n        \"Remove filler words, format command lines into markdown code blocks, and maintain a professional tone.\"\n    )\n    \n    # Initialize configuration with system instructions\n    config = LocalAgentConfig(system_instruction=system_instruction)\n    \n    raw_input = \"uh, so first you run python setup.py install and then, like, you execute agy --verify, you know?\"\n    \n    # Programmatic context construction using clean XML boundaries\n    prompt = (\n        \"Please rewrite the following transcription matching your instructions:\\n\\n\"\n        f\"<transcription>\\n{raw_input}\\n</transcription>\\n\\n\"\n        \"Output only the cleaned-up markdown formatting.\"\n    )\n    \n    async with Agent(config) as agent:\n        response = await agent.chat(prompt)\n        text = await response.text()\n        print(text)\n\nif __name__ == '__main__':\n    asyncio.run(run_prompt_structuring())"
    },
    {
        "type": "h2",
        "content": "Prompt Construction (Node.js)"
    },
    {
        "type": "code",
        "language": "javascript",
        "content": "import { Agent, LocalAgentConfig } from '@google/antigravity';\n\nasync function runPromptStructuring() {\n  const systemInstruction = \n    \"You are a technical document editor. Your task is to clean up raw transcriptions. \" +\n    \"Remove filler words, format command lines into markdown code blocks, and maintain a professional tone.\";\n\n  const config = new LocalAgentConfig({ systemInstruction });\n  const agent = new Agent(config);\n  await agent.start();\n  \n  const rawInput = \"uh, so first you run python setup.py install and then, like, you execute agy --verify, you know?\";\n  \n  const prompt = \n    \"Please rewrite the following transcription matching your instructions:\\n\\n\" +\n    `<transcription>\\n${rawInput}\\n</transcription>\\n\\n` +\n    \"Output only the cleaned-up markdown formatting.\";\n\n  try {\n    const response = await agent.chat(prompt);\n    console.log(await response.text());\n  } finally {\n    await agent.stop();\n  }\n}\n\nrunPromptStructuring().catch(console.error);"
    },
    {
        "type": "h2",
        "content": "Check Your Understanding"
    },
    {
        "type": "p",
        "content": "Question 1: What does the thoughts property on the agent response object return?"
    },
    {
        "type": "p",
        "content": "- A) A list of all historical conversations."
    },
    {
        "type": "p",
        "content": "- B) An asynchronous iterator yielding the reasoning steps generated by reasoning-enabled models."
    },
    {
        "type": "p",
        "content": "- C) An array of safety warning messages."
    },
    {
        "type": "p",
        "content": "- D) The raw HTTP response header status codes."
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: B. The thoughts property is an async iterator yielding reasoning tokens, enabling monitoring of reasoning chains."
    },
    {
        "type": "p",
        "content": "Question 2: Why are XML tag enclosures recommended when injecting dynamic variables into agent prompts?"
    },
    {
        "type": "p",
        "content": "- A) The model parses them as HTML markup to generate styled text."
    },
    {
        "type": "p",
        "content": "- B) They act as distinct structural boundaries, separating instruction parameters from external input values to improve instruction adherence."
    },
    {
        "type": "p",
        "content": "- C) They reduce the token count of the prompt."
    },
    {
        "type": "p",
        "content": "- D) They trigger automatic data encryption."
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: B. XML boundaries provide clear visual separation between system directives and context variables, reducing command confusion."
    }
]

# ----------------- MODULE 3 -----------------
m3_blocks = [
    {
        "type": "p",
        "content": "Google Drive and Google Docs serve as primary workspaces in corporate environments. Connecting your AGY SDK agents to these platforms lets them read input files, monitor shared folders, compile project specifications, and update live records. In this module, we build integrations to query Drive and dynamically rewrite Docs using Python and Node.js."
    },
    {
        "type": "h2",
        "content": "Drive API: Querying and Searching Files"
    },
    {
        "type": "p",
        "content": "To find a Google Doc or folder programmatically, use the Drive API's files.list method. This method accepts a 'q' query parameter to restrict searches by name, mimeType, and modification dates."
    },
    {
        "type": "code",
        "language": "python",
        "content": "# Drive search query pattern to find Google Documents named 'Project Specs'\nquery = \"name = 'Project Specs' and mimeType = 'application/vnd.google-apps.document' and trashed = false\""
    },
    {
        "type": "h2",
        "content": "Docs API: Reading and Editing Content Body"
    },
    {
        "type": "p",
        "content": "The Google Docs API exposes document structures as a hierarchical JSON tree. The document body consists of a content list containing structural elements (Paragraphs, Tables, SectionBreaks). To edit a document, you must send a list of update request objects in a batchUpdate call."
    },
    {
        "type": "warning",
        "content": "Index Shifting: The Docs API uses character-offset indexes (0-based) to target text edits. When you insert or delete text, the indices of all downstream elements shift. To avoid corrupting your layout, perform multiple text insertions in descending index order (from the end of the document to the beginning)."
    },
    {
        "type": "h2",
        "content": "Google Workspace Integration Script (Python)"
    },
    {
        "type": "p",
        "content": "This script uses the Drive API to find a Google Doc, reads the document contents, sends the text to the Google Antigravity Agent for summarization, and appends the summarized text back into the document."
    },
    {
        "type": "code",
        "language": "python",
        "content": "import asyncio\nimport os\nfrom google.oauth2.credentials import Credentials\nfrom googleapiclient.discovery import build\nfrom google.antigravity import Agent, LocalAgentConfig\n\nasync def run_drive_docs_pipeline():\n    # 1. Load authenticated OAuth credentials\n    if not os.path.exists('token.json'):\n        print(\"token.json not found! Run Module 1 setup script first.\")\n        return\n    creds = Credentials.from_authorized_user_file('token.json')\n    \n    # 2. Build Workspace Clients\n    drive = build('drive', 'v3', credentials=creds)\n    docs = build('docs', 'v1', credentials=creds)\n    \n    # 3. Find the Target Google Doc\n    print(\"Searching for document...\")\n    query = \"name = 'AGY-311 Work Doc' and mimeType = 'application/vnd.google-apps.document'\"\n    results = drive.files().list(q=query, fields=\"files(id, name)\").execute()\n    files = results.get('files', [])\n    \n    if not files:\n        print(\"No matching document found. Creating a new document...\")\n        # Create a mock file\n        file_metadata = {\n            'name': 'AGY-311 Work Doc',\n            'mimeType': 'application/vnd.google-apps.document'\n        }\n        doc_file = drive.files().create(body=file_metadata, fields='id').execute()\n        doc_id = doc_file.get('id')\n        # Initialize it with some content\n        init_requests = [{\n            'insertText': {\n                'text': \"Project Kickoff Notes\\n\\nRaw Transcript:\\nThe client wants a system that is secure, runs inside distrobox, and logs all tool execution approvals. We need to deploy this by Q3.\",\n                'location': {'index': 1}\n            }\n        }]\n        docs.documents().batchUpdate(documentId=doc_id, body={'requests': init_requests}).execute()\n    else:\n        doc_id = files[0]['id']\n        \n    # 4. Extract document content\n    print(f\"Fetching document ID: {doc_id}...\")\n    doc_content = docs.documents().get(documentId=doc_id).execute()\n    \n    # Construct raw text from document content array\n    text_runs = []\n    body_elements = doc_content.get('body', {}).get('content', [])\n    for element in body_elements:\n        if 'paragraph' in element:\n            for run in element['paragraph'].get('elements', []):\n                if 'textRun' in run:\n                    text_runs.append(run['textRun']['content'])\n    raw_text = \"\".join(text_runs)\n    \n    # 5. Process text with Antigravity Agent\n    print(\"Processing content with Antigravity...\")\n    system_instruction = \"You are a business writer. Summarize transcripts into clean, bulleted Action Items.\"\n    config = LocalAgentConfig(system_instruction=system_instruction)\n    \n    async with Agent(config) as agent:\n        prompt = f\"Summarize this project content:\\n\\n<doc>\\n{raw_text}\\n</doc>\"\n        response = await agent.chat(prompt)\n        summary = await response.text()\n        \n    # 6. Append Summary back to Google Doc\n    print(\"Appending summary to Google Doc...\")\n    # Read current document state to get the ending index\n    updated_doc = docs.documents().get(documentId=doc_id).execute()\n    body = updated_doc.get('body', {})\n    # Document end index is located at the end index of the last element\n    end_index = body.get('content', [])[-1].get('endIndex')\n    \n    insert_text = f\"\\n\\n--- Asynchronous Agent Summary ---\\n{summary}\"\n    requests = [{\n        'insertText': {\n            'text': insert_text,\n            'location': {'index': end_index - 1}\n        }\n    }]\n    docs.documents().batchUpdate(documentId=doc_id, body={'requests': requests}).execute()\n    print(f\"Pipeline completed! Check document at https://docs.google.com/document/d/{doc_id}/edit\")\n\nif __name__ == '__main__':\n    asyncio.run(run_drive_docs_pipeline())"
    },
    {
        "type": "h2",
        "content": "Google Workspace Integration Script (Node.js)"
    },
    {
        "type": "p",
        "content": "Below is the equivalent implementation in Node.js, doing file queries and batch updating the Google Doc."
    },
    {
        "type": "code",
        "language": "javascript",
        "content": "import fs from 'fs';\nimport { google } from 'googleapis';\nimport { Agent, LocalAgentConfig } from '@google/antigravity';\n\nasync function runDriveDocsPipeline() {\n  if (!fs.existsSync('token.json')) {\n    console.error(\"token.json not found! Run Module 1 first.\");\n    return;\n  }\n  const tokenData = JSON.parse(fs.readFileSync('token.json', 'utf8'));\n  const auth = google.auth.fromJSON(tokenData);\n  \n  const drive = google.drive({ version: 'v3', auth });\n  const docs = google.docs({ version: 'v1', auth });\n  \n  // Search for the document\n  console.log(\"Searching for document...\");\n  const query = \"name = 'AGY-311 Work Doc' and mimeType = 'application/vnd.google-apps.document'\";\n  const searchResults = await drive.files.list({ q: query, fields: 'files(id, name)' });\n  const files = searchResults.data.files || [];\n  \n  let docId;\n  if (files.length === 0) {\n    console.log(\"Creating document...\");\n    const newFile = await drive.files.create({\n      requestBody: {\n        name: 'AGY-311 Work Doc',\n        mimeType: 'application/vnd.google-apps.document'\n      },\n      fields: 'id'\n    });\n    docId = newFile.data.id;\n    await docs.documents.batchUpdate({\n      documentId: docId,\n      requestBody: {\n        requests: [{\n          insertText: {\n            text: \"Project Kickoff Notes\\n\\nRaw Transcript:\\nThe client wants a system that is secure, runs inside distrobox, and logs all tool execution approvals. We need to deploy this by Q3.\",\n            location: { index: 1 }\n          }\n        }]\n      }\n    });\n  } else {\n    docId = files[0].id;\n  }\n  \n  // Get document body\n  console.log(`Reading document body for ID: ${docId}`);\n  const doc = await docs.documents.get({ documentId: docId });\n  const content = doc.data.body?.content || [];\n  let rawText = '';\n  for (const element of content) {\n    if (element.paragraph) {\n      for (const run of element.paragraph.elements || []) {\n        if (run.textRun) {\n          rawText += run.textRun.content;\n        }\n      }\n    }\n  }\n  \n  // Run Agent turn\n  console.log(\"Summarizing doc content...\");\n  const config = new LocalAgentConfig({\n    systemInstruction: \"You are a business writer. Summarize transcripts into clean, bulleted Action Items.\"\n  });\n  const agent = new Agent(config);\n  await agent.start();\n  \n  let summary;\n  try {\n    const response = await agent.chat(`Summarize this project content:\\n\\n<doc>\\n${rawText}\\n</doc>`);\n    summary = await response.text();\n  } finally {\n    await agent.stop();\n  }\n  \n  // Append back to document\n  const docDetails = await docs.documents.get({ documentId: docId });\n  const docContent = docDetails.data.body?.content || [];\n  const lastElement = docContent[docContent.length - 1];\n  const endIndex = lastElement.endIndex || 1;\n  \n  console.log(\"Appending summary...\");\n  await docs.documents.batchUpdate({\n    documentId: docId,\n    requestBody: {\n      requests: [{\n        insertText: {\n          text: `\\n\\n--- Asynchronous Agent Summary ---\\n${summary}`,\n          location: { index: endIndex - 1 }\n        }\n      }]\n    }\n  });\n  console.log(`Success! Doc updated. https://docs.google.com/document/d/${docId}/edit`);\n}\n\nrunDriveDocsPipeline().catch(console.error);"
    },
    {
        "type": "h2",
        "content": "Check Your Understanding"
    },
    {
        "type": "p",
        "content": "Question 1: What is the primary index shifting gotcha when executing batch updates on a Google Doc?"
    },
    {
        "type": "p",
        "content": "- A) The document size increases and results in a billing surcharge."
    },
    {
        "type": "p",
        "content": "- B) Inserting text shifts downstream character indices, which can cause subsequent update requests targeting static indexes to insert text in incorrect positions."
    },
    {
        "type": "p",
        "content": "- C) The document is automatically locked for 1 hour."
    },
    {
        "type": "p",
        "content": "- D) The font family resets to Courier New automatically."
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: B. Modifying document body elements alters characters counts, displacing indices. Performing actions in reverse index order mitigates this shift."
    },
    {
        "type": "p",
        "content": "Question 2: How can an agent find a specific file inside Drive without searching the entire storage hierarchy?"
    },
    {
        "type": "p",
        "content": "- A) By specifying the parent folder ID in the search query parameter 'q' as in \"'folder_id' in parents\"."
    },
    {
        "type": "p",
        "content": "- B) By guessing the index value of the file."
    },
    {
        "type": "p",
        "content": "- C) By deleting all other files in Drive."
    },
    {
        "type": "p",
        "content": "- D) By requesting access token updates."
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: A. Appending \"'folder_id' in parents\" to the file query restricts searches to a single directory."
    }
]

# ----------------- MODULE 4 -----------------
m4_blocks = [
    {
        "type": "p",
        "content": "Spreadsheets are central to database manipulation and data collection. An agent can serve as an automated analyst, reading unstructured records from a sheet, parsing them into structured JSON schema payloads, and logging verified values back into specific spreadsheet columns. In this module, we cover Google Sheets values API manipulation and structured output configuration."
    },
    {
        "type": "h2",
        "content": "Google Sheets API: Reading and Appending Ranges"
    },
    {
        "type": "p",
        "content": "The Sheets API addresses grids using standard A1 notation (e.g. 'Sheet1!A1:D10'). To retrieve spreadsheet values, use values.get. To write data, values.append is used to find the last occupied row in a table and append new rows dynamically."
    },
    {
        "type": "info",
        "content": "Value Input Options: Always set valueInputOption to 'USER_ENTERED' if your values contain dates, numbers, or Excel/Sheets formulas (e.g. '=SUM(A1:A5)'). If set to 'RAW', the API writes values as raw strings, disabling cell logic evaluation."
    },
    {
        "type": "h2",
        "content": "Enforcing Response Schemas"
    },
    {
        "type": "p",
        "content": "To guarantee that the Antigravity agent outputs a format compatible with databases or sheets, configure response schemas. This prevents conversational filler ('Here is your JSON:') and forces the response body to match the registered fields."
    },
    {
        "type": "list",
        "items": [
            "In Python: Pass a Pydantic class to the response_schema configuration parameter inside LocalAgentConfig.",
            "In Node.js: Define a standard JSON Schema object structure and pass it to the responseSchema parameter inside LocalAgentConfig."
        ]
    },
    {
        "type": "h2",
        "content": "Spreadsheet Analyzer Pipeline (Python)"
    },
    {
        "type": "p",
        "content": "This Python script reads rows from a Google Sheet, processes unformatted ticket details through the agent using Pydantic validation, and appends the structured results as a log entry."
    },
    {
        "type": "code",
        "language": "python",
        "content": "import asyncio\nimport os\nimport pydantic\nfrom google.oauth2.credentials import Credentials\nfrom googleapiclient.discovery import build\nfrom google.antigravity import Agent, LocalAgentConfig\n\n# 1. Define the Pydantic schema for structured output validation\nclass TicketAnalysis(pydantic.BaseModel):\n    category: str\n    priority_level: str\n    urgency_reason: str\n    assigned_team: str\n\nasync def run_sheets_pipeline():\n    if not os.path.exists('token.json'):\n        print(\"token.json not found! Run Module 1 first.\")\n        return\n    creds = Credentials.from_authorized_user_file('token.json')\n    sheets = build('sheets', 'v4', credentials=creds)\n    \n    # Create a mock spreadsheet if none is specified\n    spreadsheet_body = {\n        'properties': {'title': 'AGY-311 Support Log'}\n    }\n    print(\"Creating analysis spreadsheet...\")\n    sheet_file = sheets.spreadsheets().create(body=spreadsheet_body, fields='spreadsheetId').execute()\n    sheet_id = sheet_file.get('spreadsheetId')\n    \n    # Setup sheet headers\n    setup_body = {\n        'values': [\n            ['Ticket Description', 'Category', 'Priority', 'Reason', 'Assigned Team'],\n            ['Database connection timed out when loading user profile page.', '', '', '', '']\n        ]\n    }\n    sheets.spreadsheets().values().update(\n        spreadsheetId=sheet_id,\n        range=\"Sheet1!A1:E2\",\n        valueInputOption=\"USER_ENTERED\",\n        body=setup_body\n    ).execute()\n    \n    # 2. Read raw tickets from Sheet\n    print(\"Reading data rows from Sheet...\")\n    data_range = sheets.spreadsheets().values().get(spreadsheetId=sheet_id, range=\"Sheet1!A2:A2\").execute()\n    rows = data_range.get('values', [])\n    \n    if not rows:\n        print(\"No tickets found to process.\")\n        return\n    raw_ticket = rows[0][0]\n    \n    # 3. Configure Agent with Pydantic Schema\n    print(\"Invoking Antigravity Agent with response_schema...\")\n    system_instruction = \"Analyze support tickets. Categorize them and assign to Database, Frontend, Backend, or Security.\"\n    config = LocalAgentConfig(\n        system_instruction=system_instruction,\n        response_schema=TicketAnalysis\n    )\n    \n    async with Agent(config) as agent:\n        prompt = f\"Classify this ticket:\\n{raw_ticket}\"\n        response = await agent.chat(prompt)\n        \n        # Retrieve the validated data object\n        structured_data = await response.structured_output()\n        \n    # 4. Write verified values back to Google Sheet\n    print(\"Logging analysis results back to Sheet...\")\n    analysis_row = [\n        structured_data.get('category'),\n        structured_data.get('priority_level'),\n        structured_data.get('urgency_reason'),\n        structured_data.get('assigned_team')\n    ]\n    \n    sheets.spreadsheets().values().update(\n        spreadsheetId=sheet_id,\n        range=\"Sheet1!B2:E2\",\n        valueInputOption=\"USER_ENTERED\",\n        body={'values': [analysis_row]}\n    ).execute()\n    \n    print(f\"Spreadsheet updated! View at https://docs.google.com/spreadsheets/d/{sheet_id}/edit\")\n\nif __name__ == '__main__':\n    asyncio.run(run_sheets_pipeline())"
    },
    {
        "type": "h2",
        "content": "Spreadsheet Analyzer Pipeline (Node.js)"
    },
    {
        "type": "p",
        "content": "Below is the equivalent implementation in Node.js, showing how to pass a JSON Schema definition to validate outputs and update the spreadsheet cells."
    },
    {
        "type": "code",
        "language": "javascript",
        "content": "import fs from 'fs';\nimport { google } from 'googleapis';\nimport { Agent, LocalAgentConfig } from '@google/antigravity';\n\n// 1. Define JSON Schema\nconst ticketSchema = {\n  type: 'object',\n  properties: {\n    category: { type: 'string' },\n    priority_level: { type: 'string' },\n    urgency_reason: { type: 'string' },\n    assigned_team: { type: 'string' }\n  },\n  required: ['category', 'priority_level', 'urgency_reason', 'assigned_team']\n};\n\nasync function runSheetsPipeline() {\n  if (!fs.existsSync('token.json')) {\n    console.error(\"token.json not found! Run Module 1 first.\");\n    return;\n  }\n  const tokenData = JSON.parse(fs.readFileSync('token.json', 'utf8'));\n  const auth = google.auth.fromJSON(tokenData);\n  const sheets = google.sheets({ version: 'v4', auth });\n  \n  // Create sheet\n  console.log(\"Creating sheet...\");\n  const spreadsheet = await sheets.spreadsheets.create({\n    requestBody: {\n      properties: { title: 'AGY-311 Support Log' }\n    }\n  });\n  const sheetId = spreadsheet.data.spreadsheetId;\n  \n  // Setup headers\n  await sheets.spreadsheets.values.update({\n    spreadsheetId: sheetId,\n    range: 'Sheet1!A1:E2',\n    valueInputOption: 'USER_ENTERED',\n    requestBody: {\n      values: [\n        ['Ticket Description', 'Category', 'Priority', 'Reason', 'Assigned Team'],\n        ['Database connection timed out when loading user profile page.', '', '', '', '']\n      ]\n    }\n  });\n  \n  // Read ticket description\n  const responseRange = await sheets.spreadsheets.values.get({\n    spreadsheetId: sheetId,\n    range: 'Sheet1!A2:A2'\n  });\n  const rawTicket = responseRange.data.values[0][0];\n  \n  // Execute Agent with JSON Schema\n  console.log(\"Calling agent with schema...\");\n  const config = new LocalAgentConfig({\n    systemInstruction: \"Analyze support tickets. Categorize them and assign to Database, Frontend, Backend, or Security.\",\n    responseSchema: ticketSchema\n  });\n  const agent = new Agent(config);\n  await agent.start();\n  \n  let structuredData;\n  try {\n    const response = await agent.chat(`Classify this ticket:\\n${rawTicket}`);\n    structuredData = await response.structured_output();\n  } finally {\n    await agent.stop();\n  }\n  \n  // Update Sheet cells with structured data\n  console.log(\"Updating analysis columns...\");\n  const analysisRow = [\n    structuredData.category,\n    structuredData.priority_level,\n    structuredData.urgency_reason,\n    structuredData.assigned_team\n  ];\n  \n  await sheets.spreadsheets.values.update({\n    spreadsheetId: sheetId,\n    range: 'Sheet1!B2:E2',\n    valueInputOption: 'USER_ENTERED',\n    requestBody: {\n      values: [analysisRow]\n    }\n  });\n  console.log(`Spreadsheet complete! View at https://docs.google.com/spreadsheets/d/${sheetId}/edit`);\n}\n\nrunSheetsPipeline().catch(console.error);"
    },
    {
        "type": "h2",
        "content": "Check Your Understanding"
    },
    {
        "type": "p",
        "content": "Question 1: What does valueInputOption='USER_ENTERED' indicate to the Google Sheets API?"
    },
    {
        "type": "p",
        "content": "- A) The sheet requires manual human confirmation in a browser window before saving."
    },
    {
        "type": "p",
        "content": "- B) Input strings are processed as if they were entered directly by a user into the UI, ensuring formatting is parsed and formula codes are evaluated."
    },
    {
        "type": "p",
        "content": "- C) The spreadsheet restricts editing capabilities to only registered OAuth users."
    },
    {
        "type": "p",
        "content": "- D) Cell changes are kept in memory and are discarded when the script terminates."
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: B. USER_ENTERED allows dates to convert, numbers to float, and formula expressions starting with '=' to execute."
    },
    {
        "type": "p",
        "content": "Question 2: What happens if the Antigravity agent output violates the configured Pydantic or JSON schema?"
    },
    {
        "type": "p",
        "content": "- A) The SDK automatically retries the query infinitely."
    },
    {
        "type": "p",
        "content": "- B) The response.structured_output() method returns None (Python) or null (Node.js) due to parsing errors."
    },
    {
        "type": "p",
        "content": "- C) The script deletes the target Google Sheet."
    },
    {
        "type": "p",
        "content": "- D) The model falls back to formatting the output as an HTML file."
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: B. Schema validation mismatches yield null, and developers must design scripts to catch empty structured responses."
    }
]

# ----------------- MODULE 5 -----------------
m5_blocks = [
    {
        "type": "p",
        "content": "To deploy autonomous systems in production, developers must manage persistent states, register local computation tools, and set up security barriers. The Antigravity SDK lets you persist conversations across system restarts, build custom tools, and configure lifecycle hooks to monitor and gate actions programmatically."
    },
    {
        "type": "h2",
        "content": "Context Persistence & Workspace Storage Boundaries"
    },
    {
        "type": "p",
        "content": "The SDK writes all logging, execution parameters, and intermediate data files under the directory path specified by app_data_dir, while saving trajectory states under save_dir. Both parameters must use absolute paths."
    },
    {
        "type": "warning",
        "content": "Path Requirements: Relative paths like './saves' are rejected during validation. Always construct absolute paths (e.g. using os.path.abspath or path.resolve) to prevent runtime exceptions."
    },
    {
        "type": "p",
        "content": "By saving states to save_dir, the SDK assigns a conversation_id to the turn sequence. You can restore this conversation in a future run simply by passing the ID back in the configuration object."
    },
    {
        "type": "h2",
        "content": "Custom Code Tools & Capabilities"
    },
    {
        "type": "p",
        "content": "Custom tools allow agents to execute local commands, request system data, or query internal databases. You register function references directly inside the configuration tools array. In Python, the SDK generates model tool declarations automatically from the function's docstring and type annotations. In Node.js, you must supply an explicit tool description and parameters schema object."
    },
    {
        "type": "h2",
        "content": "Lifecycle Hooks & Human-in-the-Loop Approval Gates"
    },
    {
        "type": "p",
        "content": "To prevent an agent from executing destructive actions (like running terminal delete commands or purchasing assets), register the pre_tool_call_decide hook. This hook intercepts execution when the model requests a tool, passes the tool name and arguments to your code, and waits for a boolean HookResult (allow=True/False) before continuing."
    },
    {
        "type": "h2",
        "content": "Complete Integration Script (Python)"
    },
    {
        "type": "p",
        "content": "This script registers a custom tool that checks available disk space, configures conversation save directories, and sets up a CLI approval gate that pauses and prompts the user before executing the tool."
    },
    {
        "type": "code",
        "language": "python",
        "content": "import asyncio\nimport os\nfrom google.antigravity import Agent, LocalAgentConfig, types\nfrom google.antigravity.hooks import hooks\n\n# 1. Define custom tool (the docstring acts as the tool description for the model)\ndef get_local_directory_size(path: str) -> str:\n    \"\"\"Calculates total files and folder count inside a local directory path.\"\"\"\n    try:\n        abs_path = os.path.abspath(path)\n        if not os.path.exists(abs_path):\n            return \"Path does not exist.\"\n        items = os.listdir(abs_path)\n        return f\"Directory '{abs_path}' contains {len(items)} items.\"\n    except Exception as e:\n        return str(e)\n\n# 2. Define pre-tool gate handler\nasync def human_gate_approval(tool_call: types.ToolCall) -> types.HookResult:\n    print(f\"\\n[SECURITY GATE] Agent requested tool: {tool_call.name}\")\n    print(f\"[SECURITY GATE] Target Arguments: {tool_call.args}\")\n    \n    # Request interactive user confirmation in local terminal\n    user_input = input(\"Approve tool execution? (y/n): \").strip().lower()\n    if user_input == 'y':\n        print(\"[SECURITY GATE] Tool call approved.\")\n        return types.HookResult(allow=True)\n    else:\n        print(\"[SECURITY GATE] Tool call blocked by user.\")\n        return types.HookResult(allow=False)\n\nasync def run_persistence_and_gate():\n    # Set absolute workspace folders\n    base_dir = os.path.abspath(\"./workspace_sessions\")\n    save_dir = os.path.join(base_dir, \"saves\")\n    app_data_dir = os.path.join(base_dir, \"brain\")\n    os.makedirs(save_dir, exist_ok=True)\n    os.makedirs(app_data_dir, exist_ok=True)\n    \n    # Session 1: Run Turn with custom tool and save path\n    config1 = LocalAgentConfig(\n        save_dir=save_dir,\n        app_data_dir=app_data_dir,\n        tools=[get_local_directory_size],\n        hooks=[human_gate_approval]\n    )\n    \n    print(\"--- Starting Session 1 ---\")\n    async with Agent(config1) as agent1:\n        response = await agent1.chat(\"Check the size of the current directory '.' using the get_local_directory_size tool.\")\n        text = await response.text()\n        print(f\"Agent Response: {text}\")\n        \n        # Storing conversation ID\n        session_id = agent1.conversation_id\n        print(f\"Retrieved Conversation ID: {session_id}\")\n        \n    # Session 2: Resume conversation using stored ID\n    config2 = LocalAgentConfig(\n        conversation_id=session_id,\n        save_dir=save_dir,\n        app_data_dir=app_data_dir,\n        tools=[get_local_directory_size],\n        hooks=[human_gate_approval]\n    )\n    \n    print(\"\\n--- Starting Session 2 (Resumed) ---\")\n    async with Agent(config2) as agent2:\n        response2 = await agent2.chat(\"Confirm what tool you used in the previous step and summarize its output.\")\n        text2 = await response2.text()\n        print(f\"Agent Resumed Response: {text2}\")\n\nif __name__ == '__main__':\n    asyncio.run(run_persistence_and_gate())"
    },
    {
        "type": "h2",
        "content": "Complete Integration Script (Node.js)"
    },
    {
        "type": "p",
        "content": "Below is the equivalent implementation in Node.js, using readline interface to execute human approval gating."
    },
    {
        "type": "code",
        "language": "javascript",
        "content": "import fs from 'fs';\nimport path from 'path';\nimport readline from 'readline';\nimport { Agent, LocalAgentConfig } from '@google/antigravity';\n\nfunction getLocalDirectorySize(args) {\n  const { dirPath } = args;\n  try {\n    const resolvedPath = path.resolve(dirPath);\n    if (!fs.existsSync(resolvedPath)) {\n      return \"Path does not exist.\";\n    }\n    const files = fs.readdirSync(resolvedPath);\n    return `Directory '${resolvedPath}' contains ${files.length} items.`;\n  } catch (err) {\n    return err.message;\n  }\n}\n\nfunction promptUser(query) {\n  const rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n  });\n  return new Promise(resolve => rl.question(query, answer => {\n    rl.close();\n    resolve(answer);\n  }));\n}\n\nasync function runPersistenceAndGate() {\n  const baseDir = path.resolve(\"./workspace_sessions\");\n  const saveDir = path.join(baseDir, \"saves\");\n  const appDataDir = path.join(baseDir, \"brain\");\n  \n  if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });\n  if (!fs.existsSync(appDataDir)) fs.mkdirSync(appDataDir, { recursive: true });\n  \n  const tools = [{\n    name: 'getLocalDirectorySize',\n    description: 'Calculates total files and folder count inside a local directory path.',\n    parameters: {\n      type: 'object',\n      properties: {\n        dirPath: { type: 'string' }\n      },\n      required: ['dirPath']\n    },\n    execute: getLocalDirectorySize\n  }];\n  \n  const hooks = {\n    preToolCallDecide: async (toolCall) => {\n      console.log(`\\n[SECURITY GATE] Node Agent requested tool: ${toolCall.name}`);\n      console.log(`[SECURITY GATE] Arguments:`, toolCall.args);\n      const answer = await promptUser(\"Approve tool execution? (y/n): \");\n      if (answer.trim().toLowerCase() === 'y') {\n        return { allow: true };\n      }\n      return { allow: false };\n    }\n  };\n  \n  console.log(\"--- Starting Session 1 ---\");\n  const config1 = new LocalAgentConfig({\n    saveDir,\n    appDataDir,\n    tools,\n    hooks\n  });\n  \n  const agent1 = new Agent(config1);\n  await agent1.start();\n  \n  let sessionId;\n  try {\n    const response = await agent1.chat(\"Check the size of the current directory '.' using the getLocalDirectorySize tool.\");\n    console.log(`Response:`, await response.text());\n    sessionId = agent1.conversationId;\n    console.log(`Session ID Saved: ${sessionId}`);\n  } finally {\n    await agent1.stop();\n  }\n  \n  console.log(\"\\n--- Starting Session 2 (Resumed) ---\");\n  const config2 = new LocalAgentConfig({\n    conversationId: sessionId,\n    saveDir,\n    appDataDir,\n    tools,\n    hooks\n  });\n  \n  const agent2 = new Agent(config2);\n  await agent2.start();\n  try {\n    const response = await agent2.chat(\"Confirm what tool you used in the previous step and summarize its output.\");\n    console.log(`Resumed Response:`, await response.text());\n  } finally {\n    await agent2.stop();\n  }\n}\n\nrunPersistenceAndGate().catch(console.error);"
    },
    {
        "type": "h2",
        "content": "Check Your Understanding"
    },
    {
        "type": "p",
        "content": "Question 1: What validation rule applies to save_dir and app_data_dir configurations in the SDK?"
    },
    {
        "type": "p",
        "content": "- A) They must point to an HTTP endpoint."
    },
    {
        "type": "p",
        "content": "- B) They must be set to absolute paths; relative path notations will fail validation checks and throw errors during agent startup."
    },
    {
        "type": "p",
        "content": "- C) They must reside inside a Docker container registry."
    },
    {
        "type": "p",
        "content": "- D) They must be set to read-only permissions."
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: B. The SDK strictly validates that data directories are absolute paths to prevent file writing boundary issues."
    },
    {
        "type": "p",
        "content": "Question 2: What HookResult value blocks a tool from executing when returned from pre_tool_call_decide?"
    },
    {
        "type": "p",
        "content": "- A) HookResult(allow=False) in Python, or { allow: false } in Node.js"
    },
    {
        "type": "p",
        "content": "- B) None or null"
    },
    {
        "type": "p",
        "content": "- C) A string message containing the word 'Deny'"
    },
    {
        "type": "p",
        "content": "- D) The hook cannot block execution, it can only log the activity"
    },
    {
        "type": "p",
        "content": "Feedback: Correct Answer: A. Returning a HookResult with allow set to false informs the connection transport to intercept and abort the tool request."
    }
]

# Write individual module files to target folder
modules = [
    ("01-1-sdk-architecture-setup.json", "1. SDK Architecture & OAuth Setup", m1_blocks),
    ("02-2-streaming-chat-cycles.json", "2. Streaming & Prompt Structuring", m2_blocks),
    ("03-3-context-arrays-session-persistence.json", "3. Google Drive & Docs Integration", m3_blocks),
    ("04-4-structured-output-integration.json", "4. Google Sheets & Structured Outputs", m4_blocks),
    ("05-5-subagents-tools-lifecycle-hooks.json", "5. Context Persistence, Tools & Hooks", m5_blocks)
]

for filename, title, blocks in modules:
    data = {
        "id": filename.split("-")[0].lstrip("0"),
        "title": title,
        "type": "lab",
        "blocks": blocks
    }
    filepath = os.path.join(modules_dir, filename)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote module file: {filepath}")

# Write unified curriculum JSON for Google Docs upload
unified_data = {
    "course_id": "agy-311",
    "title": "AGY-311: Scripting with the SDK (L300)",
    "description": "Learn to programmatically automate agentic workflows using the Google Antigravity SDK. This course covers initiating stateful conversation loops, managing token streams (text and thinking tokens), injecting structured context arrays, enforcing response schemas for machine-to-machine integrations, and controlling execution using lifecycle hooks and custom tools in both Python and Node.js environments.",
    "highlights": [
        {
            "icon": "🔧",
            "title": "Dual-Language Libraries",
            "description": "Gain hands-on experience using both the Python and Node.js SDK libraries with parallel code implementations."
        },
        {
            "icon": "🔄",
            "title": "Workspace Integration",
            "description": "Detail how to interact programmatically with Google Workspace APIs (Drive, Docs, Sheets) and manage OAuth."
        },
        {
            "icon": "🎯",
            "title": "Prompt Engineering",
            "description": "Structure system instructions, user prompts, and context boundaries to ensure reliable agent executions."
        },
        {
            "icon": "🚪",
            "title": "Autonomy Control",
            "description": "Implement custom function tools, session persistence, and pre-execution lifecycle hooks for human-in-the-loop gating."
        }
    ],
    "modules": [
        {
            "title": title,
            "blocks": blocks
        }
        for _, title, blocks in modules
    ]
}

unified_filepath = os.path.join(scratch_dir, "curriculum_agy-311.json")
with open(unified_filepath, "w") as f:
    json.dump(unified_data, f, indent=2)
print(f"Wrote unified curriculum JSON to: {unified_filepath}")

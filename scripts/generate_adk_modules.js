import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRACK_DIR = path.join(__dirname, '../public/content/tracks/adk-development');

const coursesData = [
  {
    course_id: "adk-101",
    title: "ADK-101: ADK Foundations",
    description: "Master the basics of Google's Agent Development Kit (ADK). Setup your local environment, install the CLI, configure agent.yaml, and run your first agent.",
    features: [
      { icon: "⚙️", title: "CLI Installation", description: "Learn to install the ADK command line interface across native systems and sandboxed containers." },
      { icon: "📝", title: "YAML Configurations", description: "Master the schema design of agent.yaml to register tools, parameters, and memory parameters." },
      { icon: "🛠️", title: "Tool Authoring", description: "Write custom tools using Python or TypeScript decorators with strict parameter typing schemas." }
    ],
    modules: [
      {
        id: "1",
        title: "1. Course Introduction & Architecture",
        file: "modules/01-introduction.json",
        blocks: [
          { type: "h1", content: "ADK Foundations: Introduction & Architecture" },
          { type: "p", content: "Welcome to ADK Foundations. Google's Agent Development Kit (ADK) is a modular, language-independent framework built to run autonomous AI agents in production. ADK structures agent loops, standardizes tool invocation formats, manages session memory boundaries, and facilitates integration with enterprise services." },
          { type: "h2", content: "Core Architectural Components" },
          { type: "p", content: "Before writing code, it is critical to understand the four primary pillars of the ADK system architecture:" },
          { type: "grid", items: [
            { icon: "Cpu", title: "Agent Engine", content: "The central core that coordinates semantic routing, planning, and task execution sequences using LLM backends.", border: "#4ade80" },
            { icon: "Wrench", title: "Tool Registry", content: "A structured library of functions that the agent can execute, configured with exact JSON Schemas.", border: "#4ade80" },
            { icon: "FolderLock", title: "Workspace Boundary", content: "A localized sandboxed folder structure restricting the agent's file system read, write, and execute permissions.", border: "#ef4444" },
            { icon: "History", title: "Session Store", content: "A stateful ledger tracking model requests, response steps, token consumption, and variables.", border: "#3b82f6" }
          ] },
          { type: "h2", content: "Pre-requisites and Environment Check" },
          { type: "p", content: "Verify that your developer machine meets the minimum system dependencies before installing the SDK CLI tool:" },
          { type: "list", items: [
            "Python 3.10 or higher (required for Python tool bindings and scripts)",
            "Node.js 18.x or higher (required for TypeScript tool decoration and local web tooling)",
            "Go 1.20 or higher (optional, required if building high-throughput native extensions)",
            "Docker, Podman, or Distrobox (strongly recommended for sandboxed workspace containment)"
          ] },
          { type: "info", title: "Pro-Tip: Runtime Verification", content: "Ensure Python and Node are in your system PATH by running 'python --version' and 'node --version' in your active shell prior to bootstrapping." },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What is the primary role of the Session Store in the ADK architecture?" },
          { type: "p", content: "- A) It compiles custom Go binaries into OCI container images.\n- B) It acts as a stateful ledger tracking conversational state, token counts, and execution traces.\n- C) It is a firewall that blocks external HTTP traffic." },
          { type: "p", content: "Feedback: Option B is correct. The Session Store tracks the step-by-step state of the agent run, including token usage and conversation memory." },
          { type: "p", content: "Question 2: Which runtime engines are officially supported for writing custom ADK tool decorations?" },
          { type: "p", content: "- A) Python, TypeScript/Node.js, and Go.\n- B) Only Ruby on Rails.\n- C) Bash shell scripts exclusively." },
          { type: "p", content: "Feedback: Option A is correct. ADK provides official language bindings and decorators for Python, Node.js/TypeScript, and Go." }
        ]
      },
      {
        id: "2",
        title: "2. Installing the CLI and Environment Setup",
        file: "modules/02-cli-installation.json",
        blocks: [
          { type: "h1", content: "Installing the ADK CLI Tool" },
          { type: "p", content: "The ADK system is administered using the `adk` command line interface. This tool manages project bootstrapping, agent testing, local server execution, and production deployments." },
          { type: "h2", content: "Option A: Native Script Installation" },
          { type: "p", content: "For standard development workstations, install the CLI globally using the direct package managers or the secure bootstrap script:" },
          { type: "code", language: "bash", code: "# Installing via NPM global package manager\nnpm install -g @google/adk-cli\n\n# Alternative: Python package installation for script-heavy environments\npip install google-adk-cli" },
          { type: "h2", content: "Option B: Sandboxed distrobox execution (Tier 3 Hardening)" },
          { type: "p", content: "For locked-down corporate workstations, run the installer inside a local OCI distrobox sandbox container. This avoids local workspace contamination:" },
          { type: "code", language: "bash", code: "# Initialize a distrobox shell using the official ADK base image\ndistrobox create -n adk-box --image gcr.io/google-adk/adk-box:latest\n\n# Enter the sandboxed shell to run the ADK toolchain\ndistrobox enter adk-box" },
          { type: "h2", content: "Verifying the Installation" },
          { type: "p", content: "Run the diagnostics suite to confirm the CLI is authenticated and has correct file access permissions:" },
          { type: "code", language: "bash", code: "adk doctor" },
          { type: "info", title: "Diagnostic Logs", content: "The 'adk doctor' command checks model connectivity, runs local permissions verification in ~/.adk/cache, and reports dependency versions." },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What command should you run to verify that your system paths, Python models, and security dependencies are ready for ADK development?" },
          { type: "p", content: "- A) adk check\n- B) adk doctor\n- C) adk verify --all" },
          { type: "p", content: "Feedback: Option B is correct. 'adk doctor' is the official built-in CLI diagnostic suite." }
        ]
      },
      {
        id: "3",
        title: "3. Deconstructing agent.yaml Configuration",
        file: "modules/03-agent-config.json",
        blocks: [
          { type: "h1", content: "Anatomy of agent.yaml" },
          { type: "p", content: "Every ADK agent is defined by a primary metadata and configuration file named `agent.yaml`. This file explicitly declares the agent's identity, the execution model, model hyperparameters, registered tool modules, and conversation memory windows." },
          { type: "h2", content: "Detailed agent.yaml Structure" },
          { type: "p", content: "Below is a complete, production-grade example of an `agent.yaml` definition file:" },
          { type: "code", language: "yaml", code: "version: \"1.0.0\"\nagent_id: \"document-analyzer-agent\"\ntitle: \"Enterprise Document Analyzer\"\ndescription: \"Extracts structured schema facts from uploaded financial reports.\"\n\nmodel:\n  provider: \"google-vertex\"\n  name: \"gemini-1.5-pro\"\n  parameters:\n    temperature: 0.1\n    top_p: 0.95\n    max_output_tokens: 8192\n\nmemory:\n  type: \"sliding-window\"\n  window_size: 15\n  compaction_policy: \"summarize\"\n\ntools:\n  - name: \"read_file_content\"\n    source: \"src/tools/file_ops.py\"\n    class: \"ReadFileContentTool\"\n  - name: \"regex_search\"\n    source: \"src/tools/text_regex.py\"\n    class: \"RegexSearchTool\"\n\nsecurity:\n  workspace_lock: true\n  network_access: \"restricted\"\n  allowed_domains:\n    - \"*.googleapis.com\"\n" },
          { type: "h2", content: "Key Parameters Explained" },
          { type: "list", items: [
            "model.parameters.temperature: Determines token sampling randomness. In engineering tools, keep this low (0.0 to 0.2) to guarantee deterministic code outputs and strict schema adherence.",
            "memory.compaction_policy: Defines how the agent compresses messages when context thresholds are exceeded. 'summarize' triggers a background call to summarize older messages, while 'truncate' deletes oldest turns.",
            "security.workspace_lock: When set to true, restricts the agent from reading or writing files outside of its immediate execution folder."
          ] },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: Why should an agent.yaml used for backend data migration have a temperature parameter of 0.0 or 0.1?" },
          { type: "p", content: "- A) To reduce memory allocation size in the container.\n- B) To ensure consistent, deterministic behavior and minimize hallucinated variables during parsing.\n- C) To make the agent run twice as fast." },
          { type: "p", content: "Feedback: Option B is correct. Lowering the temperature decreases model randomness, which is critical for structured data processing and code execution." }
        ]
      },
      {
        id: "4",
        title: "4. Lab - Creating Your First Custom Tool",
        file: "modules/04-custom-tool.json",
        blocks: [
          { type: "h1", content: "Lab: Custom Tool Authoring" },
          { type: "p", content: "In this lab, you will author a custom file parsing tool in Python that validates CSV formatting. The agent will discover this tool via the `agent.yaml` registry and execute it during tasks." },
          { type: "h2", content: "Step 1: Write the Tool Source Code" },
          { type: "p", content: "Create a new file `src/tools/csv_validator.py` and write the Python tool utilizing ADK's decorator bindings. Make sure to define docstrings and type hints as the agent relies on them to generate the JSON Schema payload." },
          { type: "code", language: "python", code: "import csv\nfrom google_adk.tools import tool\n\n@tool\ndef validate_csv_columns(file_path: str, expected_cols: list[str]) -> dict:\n    \"\"\"\n    Validates that a CSV file contains the exact list of expected column names.\n    \n    Args:\n        file_path (str): The absolute or relative path to the local CSV file.\n        expected_cols (list[str]): The list of column headers required to be present.\n        \n    Returns:\n        dict: A status report indicating success boolean and list of missing columns.\n    \"\"\"\n    try:\n        with open(file_path, mode='r', encoding='utf-8') as f:\n            reader = csv.reader(f)\n            headers = next(reader, None)\n            if not headers:\n                return {\"status\": \"error\", \"valid\": False, \"reason\": \"CSV is empty\"}\n            \n            missing = [col for col in expected_cols if col not in headers]\n            if missing:\n                return {\"status\": \"invalid\", \"valid\": False, \"missing\": missing}\n            return {\"status\": \"success\", \"valid\": true, \"missing\": []}\n    except Exception as e:\n        return {\"status\": \"error\", \"valid\": False, \"reason\": str(e)}\n" },
          { type: "h2", content: "Step 2: Register the Tool in agent.yaml" },
          { type: "p", content: "Register the new tool file inside your `agent.yaml` file under the tools section:" },
          { type: "code", language: "yaml", code: "tools:\n  - name: \"validate_csv_columns\"\n    source: \"src/tools/csv_validator.py\"\n" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: How does the ADK runtime construct the JSON parameters schema that is shared with the LLM backend for tool discovery?" },
          { type: "p", content: "- A) It prompts the developer to author a separate JSON file manually.\n- B) It parses the function signature type hints and docstrings of the decorated @tool function.\n- C) It reads global environment variables." },
          { type: "p", content: "Feedback: Option B is correct. ADK uses runtime reflection to inspect parameter types and descriptions directly from the code docstrings." }
        ]
      },
      {
        id: "5",
        title: "5. Execution and Local Verification",
        file: "modules/05-local-testing.json",
        blocks: [
          { type: "h1", content: "Running and Testing Agents Locally" },
          { type: "p", content: "Once your configurations and tool files are registered, run the local execution engine using the ADK CLI to verify agent outputs and validate tool interfaces." },
          { type: "h2", content: "Step 1: Execute with a Direct Prompt" },
          { type: "p", content: "Run the agent in single-prompt execution mode. This initializes the connection, registers your tools, passes the prompt, executes the loop, and prints output:" },
          { type: "code", language: "bash", code: "adk run --prompt \"Validate if customer_records.csv contains headers: id, name, email. Use relative path: src/test/customer_records.csv\"" },
          { type: "h2", content: "Step 2: Run in Interactive Repl Mode" },
          { type: "p", content: "To test multi-step dialogues and evaluate memory window slide parameters, launch the interactive shell (REPL) interface:" },
          { type: "code", language: "bash", code: "adk run --interactive" },
          { type: "info", title: "Trace Output Folder", content: "By default, every execution of 'adk run' dumps a step-by-step tracking log file into the workspace directory under `.adk/logs/runs/`. You can reference these files to diagnose tool execution arguments." },
          { type: "h2", content: "Congratulations!" },
          { type: "p", content: "You have completed ADK-101: ADK Foundations. You are now ready to advance to developer tooling and visualization dashboards in ADK-201." }
        ]
      }
    ]
  },
  {
    course_id: "adk-201",
    title: "ADK-201: Developer Tooling & adk-web",
    description: "Inspect and debug active agent runs using the adk-web developer console. Review execution traces, memory states, transaction logs, and step playbacks.",
    features: [
      { icon: "🖥️", title: "Visual Dashboard", description: "Spin up local graphical developer web-portals to track real-time agent execution processes." },
      { icon: "🔄", title: "Step Auditing", description: "Audit individual model reasoning cycles, prompt expansions, and tool call outputs." },
      { icon: "📊", title: "Metrics Analysis", description: "Inspect model token metrics, model execution times, and network network transport latency graphs." }
    ],
    modules: [
      {
        id: "1",
        title: "1. Visual Debugging with adk-web Dashboard",
        file: "modules/01-adk-web-intro.json",
        blocks: [
          { type: "h1", content: "Introduction to adk-web" },
          { type: "p", content: "Debugging autonomous agents in terminal interfaces can be difficult due to complex JSON payloads. The `adk-web` portal provides a local, real-time graphical developer dashboard to view exactly what your agent is doing under the hood." },
          { type: "h2", content: "Launching the Console" },
          { type: "p", content: "To launch the developer console alongside an active agent instance, execute the following CLI command in your workspace root:" },
          { type: "code", language: "bash", code: "# Launch the console on default port 8501\nadk dev --web\n\n# Configure a custom host and port for remote server debugging\nadk dev --web --port 9000 --host 0.0.0.0" },
          { type: "info", title: "Browser Connectivity", content: "Once executed, the command spawns a lightweight local Node.js web server. Open 'http://localhost:8501' in your browser to view the console." },
          { type: "h2", content: "Console Workspace Panes" },
          { type: "p", content: "The `adk-web` interface consists of three primary visual sections:" },
          { type: "list", items: [
            "Run Selector (Left): A history panel showing all previous and active execution sessions.",
            "Visual Playground (Center): A chat simulator and block interface to interact with the agent.",
            "Inspector Drawer (Right): Tabbed dashboards showing state records, memory registers, tool calls, and model latency metrics."
          ] },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What is the default browser port used by the local adk-web console?" },
          { type: "p", content: "- A) 8080\n- B) 8501\n- C) 3000" },
          { type: "p", content: "Feedback: Option B is correct. adk-web serves the graphical developer dashboard on port 8501 by default." }
        ]
      },
      {
        id: "2",
        title: "2. Transaction Auditing & Step Playback",
        file: "modules/02-transaction-audit.json",
        blocks: [
          { type: "h1", content: "Transaction Auditing & Playback" },
          { type: "p", content: "Every model request, model output, and tool response is recorded as an immutable transaction log. The transaction auditor allows you to scrub backward and forward in execution time, playing back steps exactly as they occurred." },
          { type: "h2", content: "Scrubbing Execution Logs" },
          { type: "p", content: "In the 'Transaction' tab of the dashboard drawer, choose an active or completed session. The visual playback timeline displays:" },
          { type: "list", items: [
            "User input prompt payload.",
            "Agent internal reasoning chain (thoughts, planning steps).",
            "Tool call argument mapping (arguments and parameter verification).",
            "Tool response outputs returned from local code execution.",
            "Final compiled message returned to the client user."
          ] },
          { type: "h2", content: "Analyzing Tool Call JSON Schemas" },
          { type: "p", content: "Click on any tool transaction box to inspect the raw JSON exchange. This is vital to debug schema parsing issues:" },
          { type: "code", language: "json", code: "{\n  \"transaction_id\": \"tx-99238\",\n  \"step\": 3,\n  \"type\": \"tool_call\",\n  \"tool_name\": \"validate_csv_columns\",\n  \"arguments\": {\n    \"file_path\": \"src/test/customer_records.csv\",\n    \"expected_cols\": [\"id\", \"name\", \"email\"]\n  },\n  \"response_payload\": {\n    \"status\": \"success\",\n    \"valid\": true\n  }\n}" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: How does inspecting raw JSON transaction payloads in adk-web help debug failed tool executions?" },
          { type: "p", content: "- A) It automatically repairs Python syntax bugs.\n- B) It shows the exact arguments sent by the model to your tool function, allowing you to check for schema or naming mismatch errors.\n- C) It compiles the project to a static website." },
          { type: "p", content: "Feedback: Option B is correct. Checking the tool call JSON helps isolate whether parameter structure mismatches caused runtime exceptions." }
        ]
      },
      {
        id: "3",
        title: "3. Inspecting Memory & Conversation States",
        file: "modules/03-memory-inspection.json",
        blocks: [
          { type: "h1", content: "Memory & State Inspections" },
          { type: "p", content: "Agents maintain conversation context using memory strategies. The Memory tab of `adk-web` provides a real-time view of active variables, context buffers, and sliding window indices." },
          { type: "h2", content: "Visualizing the Context Window" },
          { type: "p", content: "The memory visualizer maps active messages loaded in current model requests vs compressed history blocks. You can view:" },
          { type: "list", items: [
            "Context buffer index parameters.",
            "System instruction weights.",
            "Compacted summary notes injected as system context.",
            "Active session keys (such as user authentication metadata)."
          ] },
          { type: "info", title: "Compaction Thresholds", content: "The compaction indicator flashes yellow when the current conversation history approaches 80% of the configured sliding window limit, warning that a context compression run is imminent." },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What indicator tells you that the agent's active memory is approaching compaction?" },
          { type: "p", content: "- A) The server restarts automatically.\n- B) The compaction indicator changes color (yellow warning) as history size nears 80% of the window limits.\n- C) The adk CLI commands return error codes." },
          { type: "p", content: "Feedback: Option B is correct. adk-web highlights context size usage warnings visual indicator when nearing compression boundaries." }
        ]
      },
      {
        id: "4",
        title: "4. Performance Tracking: Token Usage & Latency Benchmarks",
        file: "modules/04-performance-traces.json",
        blocks: [
          { type: "h1", content: "Performance Metrics & Latencies" },
          { type: "p", content: "Optimizing agent loops for production requires tracing system latency bottlenecks and token metrics. The Performance dashboard aggregates data per run, showing costs and response times." },
          { type: "h2", content: "Analyzing Performance Charts" },
          { type: "p", content: "Open the 'Traces' view to evaluate trace timings:" },
          { type: "list", items: [
            "Time-to-first-token latency: Measures model prompt response speed.",
            "Tool execution latency: Isolates network delays or database query bottlenecks in your custom python/node scripts.",
            "Total Turn execution time: Combines model planning loops and tool execution times."
          ] },
          { type: "h2", content: "Token Auditing Configuration" },
          { type: "p", content: "Review token counters to track Gemini execution costs: input tokens, generated output tokens, cached tokens, and total token usage per prompt step." },
          { type: "code", language: "bash", code: "# Configure local logger to output verbose traces to standard out\nadk run --verbose-perf-traces" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: Which trace latency measurement isolates database queries or API execution bottlenecks from model inference delays?" },
          { type: "p", content: "- A) Time-to-first-token latency\n- B) Tool execution latency\n- C) Compiler compile time" },
          { type: "p", content: "Feedback: Option B is correct. Tool execution latency tracks the absolute runtime duration of your custom tools." }
        ]
      },
      {
        id: "5",
        title: "5. Lab - Debugging a Failing Tool using Trace Analysis",
        file: "modules/05-lab-tool-debug.json",
        blocks: [
          { type: "h1", content: "Lab: Debugging Failed Tools" },
          { type: "p", content: "In this lab, you will run an agent that fails when interacting with a local inventory database. You will use `adk-web` trace diagnostics to identify the parameter format bug, correct the source code, and verify execution success." },
          { type: "h2", content: "Step 1: Run the Broken Agent" },
          { type: "p", content: "Trigger the agent to retrieve stock information from a database file. The query fails silently or returns an error response:" },
          { type: "code", language: "bash", code: "adk run --prompt \"Retrieve stock details for item id 8802 and export schema report.\"" },
          { type: "h2", content: "Step 2: Inspect adk-web traces" },
          { type: "p", content: "Open `http://localhost:8501` in your browser. Inspect the last run history pane. Under 'Tool Failures', locate the active error logs:" },
          { type: "code", language: "json", code: "{\n  \"error\": \"TypeError: expected string or bytes-like object, got int\",\n  \"tool\": \"fetch_stock_details\",\n  \"arguments\": {\n    \"item_id\": 8802\n  }\n}" },
          { type: "h2", content: "Step 3: Correct the Tool Schema Definition" },
          { type: "p", content: "The model passed `8802` as an integer, but the python code was expecting a string format. We will update the tool's python signature type hint to accept both `int` and `str` parameters:" },
          { type: "code", language: "python", code: "# Before:\n# def fetch_stock_details(item_id: str)\n\n# After (corrected type definition):\ndef fetch_stock_details(item_id: int | str):\n    \"\"\"\n    Retrieves local inventory stock numbers.\n    Args:\n        item_id (int | str): The ID of the item.\n    \"\"\"\n    # Code handles integer string conversion safely\n    sanitized_id = str(item_id)\n    # Run database query...\n" },
          { type: "h2", content: "Step 4: Re-run diagnostics" },
          { type: "p", content: "Execute the agent once more. Review the transaction history in adk-web to confirm a green success tag is displayed next to the tool invocation step." }
        ]
      }
    ]
  },
  {
    course_id: "adk-301",
    title: "ADK-301: Agent-to-Agent (A2A) Orchestration",
    description: "Design and orchestrate multi-agent collaboration environments. Configure A2AServer routing, launch remote agents, and write discovery card manifests.",
    features: [
      { icon: "🔀", title: "A2AServer Routing", description: "Master the deployment of central routing servers for multi-agent networking and task delegation." },
      { icon: "🌐", title: "Remote Bindings", description: "Register agents hosted on remote endpoints with your orchestration network as local services." },
      { icon: "🏷️", title: "Agent Manifests", description: "Author agent-card.json files containing dynamic capability and scope declarations." }
    ],
    modules: [
      {
        id: "1",
        title: "1. The Multi-Agent Paradigm & Orchestration Topologies",
        file: "modules/01-orchestration-concepts.json",
        blocks: [
          { type: "h1", content: "Multi-Agent Systems & Architecture Topologies" },
          { type: "p", content: "Complex software engineering problems cannot be solved efficiently by a single model loop. Splitting tasks across focused, specialized agents increases precision, reduces input context usage, and enables parallel processing pipelines." },
          { type: "h2", content: "Multi-Agent Topology Models" },
          { type: "p", content: "Developers can configure agent communications using two primary structure topologies:" },
          { type: "grid", items: [
            { icon: "Shuffle", title: "Hub-and-Spoke Topology", content: "A central coordinator agent receives user input, plans steps, delegating tasks to sub-agents, compiling output.", border: "#4ade80" },
            { icon: "Network", title: "Peer-to-Peer Mesh Topology", content: "Agents communicate directly, triggering callbacks and passing payloads autonomously based on state changes.", border: "#3b82f6" }
          ] },
          { type: "h2", content: "The A2A Protocol Architecture" },
          { type: "p", content: "The Agent-to-Agent (A2A) protocol defines how agents declare parameters, register endpoints, establish trust, and exchange structured JSON task payloads across local networks or public HTTP transports." },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: Which multi-agent topology uses a coordinator agent to process user inputs and delegate tasks?" },
          { type: "p", content: "- A) Peer-to-Peer Mesh\n- B) Hub-and-Spoke\n- C) Circular Chain" },
          { type: "p", content: "Feedback: Option B is correct. In a Hub-and-Spoke model, a central coordinator coordinates routing and delegation between spokes." }
        ]
      },
      {
        id: "2",
        title: "2. Launching the A2AServer Routing Daemon",
        file: "modules/02-a2a-server.json",
        blocks: [
          { type: "h1", content: "Deploying A2AServer Router" },
          { type: "p", content: "The `A2AServer` is the routing daemon that coordinates communication between agents. It acts as a local proxy, routes request envelopes, translates schemas, and handles message queue retries." },
          { type: "h2", content: "Step 1: Configure a2a.yaml Routing Manifest" },
          { type: "p", content: "Create an orchestration configuration file to specify routing rules, ports, and allowed agent keys:" },
          { type: "code", language: "yaml", code: "server:\n  port: 8090\n  host: \"localhost\"\n  auth_token: \"sec-key-9923\"\n\nrouting:\n  default_coordinator: \"hub-agent\"\n  agents:\n    - id: \"hub-agent\"\n      port: 8091\n    - id: \"sql-agent\"\n      port: 8092\n    - id: \"git-agent\"\n      port: 8093\n" },
          { type: "h2", content: "Step 2: Launch the routing server daemon" },
          { type: "p", content: "Start the server using the CLI commands to monitor incoming routes and connections:" },
          { type: "code", language: "bash", code: "adk a2a-server start --config a2a.yaml" },
          { type: "info", title: "Monitoring routes", content: "A2AServer exposes a diagnostics panel on port 8090/health. You can inspect registered agent nodes, latency maps, and queue depths." },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What is the primary role of the A2AServer routing daemon in an agent network?" },
          { type: "p", content: "- A) It executes local Python tests.\n- B) It acts as a broker, routing request envelopes, managing message queues, and verifying authentication keys.\n- C) It is a web interface for rendering HTML pages." },
          { type: "p", content: "Feedback: Option B is correct. A2AServer manages message envelope exchanges, transport routes, security permissions, and connectivity states." }
        ]
      },
      {
        id: "3",
        title: "3. Remote Agent Integration with RemoteA2aAgent",
        file: "modules/03-remote-agent.json",
        blocks: [
          { type: "h1", content: "Remote Agents with RemoteA2aAgent" },
          { type: "p", content: "Not all agents can run on a single local server. The `RemoteA2aAgent` library allows you to bind an agent running on a remote cloud server to your local system as if it were a local module." },
          { type: "h2", content: "Writing a Python Remote Registration Script" },
          { type: "p", content: "Below is a python script utilizing the ADK library to spin up an agent and register it securely with a running `A2AServer` hub:" },
          { type: "code", language: "python", code: "from google_adk.a2a import RemoteA2aAgent, AgentServer\n\n# Define the agent logic locally\ndef run_database_query(query: str) -> dict:\n    # Database logic...\n    return {\"result\": \"records query success\"}\n\n# Initialize the remote agent configuration\nremote_agent = RemoteA2aAgent(\n    agent_id=\"sql-agent\",\n    server_url=\"http://localhost:8090\",\n    auth_token=\"sec-key-9923\"\n)\n\n# Register capabilities and register tool functions\nremote_agent.register_tool(\"query_db\", run_database_query)\n\n# Connect and listen for tasks from the orchestrator hub\nif __name__ == \"__main__\":\n    print(\"Starting RemoteA2aAgent loop for sql-agent...\")\n    remote_agent.start_event_loop()" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: When using RemoteA2aAgent, how does the remote agent receive tasks from the central hub?" },
          { type: "p", content: "- A) By writing logs to a shared network hard drive.\n- B) It opens an event loop or long-poll WebSocket connection to the A2AServer router URL, awaiting task assignments.\n- C) By scheduling cron jobs on the server." },
          { type: "p", content: "Feedback: Option B is correct. RemoteA2aAgent establishes a persistent link to the routing hub server, listening for incoming events to execute." }
        ]
      },
      {
        id: "4",
        title: "4. Dynamic Discovery with Agent Cards and Manifests",
        file: "modules/04-agent-manifest.json",
        blocks: [
          { type: "h1", content: "Agent Discovery & Manifest Files" },
          { type: "p", content: "To enable dynamic task routing, the orchestrator needs to know what tools and operations an agent provides without hardcoding logic. This metadata is declared in the `agent-card.json` manifest file." },
          { type: "h2", content: "Agent Card Manifest Schema (`agent-card.json`)" },
          { type: "p", content: "Create an agent card manifest file that defines inputs, scopes, models, and contact endpoints for your agent:" },
          { type: "code", language: "json", code: "{\n  \"agent_id\": \"security-scanner-agent\",\n  \"version\": \"1.4.0\",\n  \"capabilities\": {\n    \"domains\": [\"source-code\", \"vulnerability-scan\", \"dependency-check\"],\n    \"languages\": [\"python\", \"go\", \"javascript\"]\n  },\n  \"inputs\": {\n    \"repository_path\": \"string\",\n    \"scan_level\": \"string\"\n  },\n  \"routing_endpoint\": \"http://localhost:8094/a2a/v1/execute\",\n  \"security_claims\": {\n    \"requires_network\": false,\n    \"write_permission_required\": true\n  }\n}" },
          { type: "info", title: "Dynamic Routing Rules", content: "The central hub parses all available card manifests in the directory. If a user asks to scan a repo for issues, the hub matches 'vulnerability-scan' to the scanner's card and routes the message." },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What is the primary function of the agent-card.json file in a multi-agent system?" },
          { type: "p", content: "- A) It compiles Javascript dependencies.\n- B) It acts as a declarative manifest describing an agent's capabilities, inputs, and endpoints to enable dynamic routing and discovery.\n- C) It stores model weights for execution." },
          { type: "p", content: "Feedback: Option B is correct. The agent-card.json provides the metadata required by routing engines to discover capabilities dynamically." }
        ]
      },
      {
        id: "5",
        title: "5. Lab - Implementing Collaborative Planning and Execution",
        file: "modules/05-lab-multi-agent.json",
        blocks: [
          { type: "h1", content: "Lab: Collaborative Agent Pipeline" },
          { type: "p", content: "In this lab, you will configure a cooperative multi-agent workflow: a Coordinator agent receives user instructions, plans actions, routes a scan request to a Security agent, and writes a compliance report file." },
          { type: "h2", content: "Step 1: Launch the A2AServer Daemon" },
          { type: "p", content: "Create the local router config and launch the central daemon:" },
          { type: "code", language: "bash", code: "adk a2a-server start --port 8090" },
          { type: "h2", content: "Step 2: Start the Security Sub-Agent" },
          { type: "p", content: "Start the security script which runs a local scan tool and registers itself with the router daemon on port 8090:" },
          { type: "code", language: "bash", code: "python src/agents/security_agent.py --register-hub http://localhost:8090" },
          { type: "h2", content: "Step 3: Trigger the Orchestration Task" },
          { type: "p", content: "Run the coordinator agent CLI command to execute the plan. The coordinator calls the registered security agent, waits for results, and prints reports:" },
          { type: "code", language: "bash", code: "adk run --coordinator --prompt \"Scan the codebase folder src/app and output compliance results.\"" },
          { type: "info", title: "Trace Playback Verification", content: "Open http://localhost:8501 to check step tracing. You should see a routing loop: Coordinator -> Security Agent (runs tool) -> Coordinator (compiles report)." }
        ]
      }
    ]
  },
  {
    course_id: "adk-401",
    title: "ADK-401: Dynamic Interfaces with A2UI",
    description: "Create interactive user interfaces generated dynamically by agents. Learn the A2UI schema format to build cards, forms, tables, and secure callbacks.",
    features: [
      { icon: "🖥️", title: "Declarative Layouts", description: "Design rich structural visual component blocks (forms, cards, tables) in agent JSON payloads." },
      { icon: "📥", title: "Input Capturing", description: "Implement secure data submission handlers to collect user responses and pass them back." },
      { icon: "🛡️", title: "Sandboxed UI", description: "Enforce strict XSS and code injection checks on all agent-generated interfaces." }
    ],
    modules: [
      {
        id: "1",
        title: "1. The A2UI Declarative Layout Protocol",
        file: "modules/01-a2ui-foundations.json",
        blocks: [
          { type: "h1", content: "Introduction to A2UI Protocol" },
          { type: "p", content: "Text inputs and markdown outputs are insufficient for complex actions like scheduling meetings or reviewing code changes. The Agent-to-User Interface (A2UI) protocol allows agents to emit structured JSON UI components that are rendered as clean, native visual elements in client browsers." },
          { type: "h2", content: "Core Design Philosophy" },
          { type: "p", content: "A2UI separates interface definitions from the rendering engine. The agent outputs UI blocks defined by a strict JSON Schema, and the client frontend platform converts these definitions into styling-consistent React or HTML widgets." },
          { type: "h2", content: "A2UI Container Example Schema" },
          { type: "p", content: "Below is the layout JSON for a basic A2UI block describing a system alert card:" },
          { type: "code", language: "json", code: "{\n  \"a2ui_version\": \"2.0.0\",\n  \"layout\": \"vertical\",\n  \"components\": [\n    {\n      \"type\": \"card\",\n      \"title\": \"Security Patch Required\",\n      \"status\": \"critical\",\n      \"body\": \"A critical vulnerability has been identified in packages.json.\"\n    }\n  ]\n}" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What is the primary benefit of the A2UI protocol over standard raw markdown text outputs?" },
          { type: "p", content: "- A) It speeds up the LLM text generation latency.\n- B) It allows agents to generate structured, interactive UI blocks like forms, calendars, and tables rendered natively on the client.\n- C) It translates agent codes into Go." },
          { type: "p", content: "Feedback: Option B is correct. A2UI gives the agent the ability to define functional, structured interface layouts that render as native browser widgets." }
        ]
      },
      {
        id: "2",
        title: "2. Building Forms and Processing Input Paybacks",
        file: "modules/02-dynamic-forms.json",
        blocks: [
          { type: "h1", content: "Form Components & Input Capture" },
          { type: "p", content: "To capture parameters from the user securely, agents construct forms using the A2UI input widgets. When the user submits, a callback request payload is routed back to the agent session." },
          { type: "h2", content: "A2UI Form Schema Example" },
          { type: "p", content: "This schema defines a user settings form with a text input, selection dropdown, and a submit button:" },
          { type: "code", language: "json", code: "{\n  \"type\": \"form\",\n  \"form_id\": \"user-auth-settings\",\n  \"controls\": [\n    {\n      \"type\": \"text-input\",\n      \"id\": \"username_field\",\n      \"label\": \"Service Username\",\n      \"placeholder\": \"Enter corporate ID\"\n    },\n    {\n      \"type\": \"dropdown\",\n      \"id\": \"auth_level\",\n      \"label\": \"Access Tier\",\n      \"options\": [\n        {\"label\": \"Read-Only\", \"value\": \"ro\"},\n        {\"label\": \"Read-Write\", \"value\": \"rw\"}\n      ]\n    },\n    {\n      \"type\": \"button\",\n      \"action_id\": \"submit-auth-credentials\",\n      \"label\": \"Apply and Connect\"\n    }\n  ]\n}" },
          { type: "h2", content: "Understanding Callback Paybacks" },
          { type: "p", content: "When the button is clicked, the UI generates a callback payload containing values from the input fields:" },
          { type: "code", language: "json", code: "{\n  \"event_type\": \"a2ui_submit\",\n  \"form_id\": \"user-auth-settings\",\n  \"action_id\": \"submit-auth-credentials\",\n  \"values\": {\n    \"username_field\": \"dev-user-009\",\n    \"auth_level\": \"rw\"\n  }\n}" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What format does A2UI use to return user-entered form data to the agent?" },
          { type: "p", content: "- A) As a raw text message containing prompt inputs.\n- B) As a structured JSON callback envelope mapping input IDs to values.\n- C) As a CSV spreadsheet export." },
          { type: "p", content: "Feedback: Option B is correct. Data collected from A2UI forms is returned in a structured JSON callback payload with the input values mapped to control IDs." }
        ]
      },
      {
        id: "3",
        title: "3. Structuring Cards, Lists, and Data Tables",
        file: "modules/03-cards-tables.json",
        blocks: [
          { type: "h1", content: "Cards, Lists, & Data Tables" },
          { type: "p", content: "Rendering structured records (like server lists or database tables) inside markdown text blocks is hard to read. A2UI tables support sorting metadata and visual column formatting." },
          { type: "h2", content: "A2UI Table Definition Schema" },
          { type: "p", content: "Use the following schema format to represent inventory query records dynamically inside the visual panel:" },
          { type: "code", language: "json", code: "{\n  \"type\": \"data-table\",\n  \"headers\": [\n    {\"key\": \"item_id\", \"label\": \"ID\", \"sortable\": true},\n    {\"key\": \"status\", \"label\": \"Status\", \"sortable\": false},\n    {\"key\": \"quantity\", \"label\": \"In Stock\", \"sortable\": true}\n  ],\n  \"rows\": [\n    {\"item_id\": \"8802\", \"status\": \"Active\", \"quantity\": 150},\n    {\"item_id\": \"8803\", \"status\": \"Low Stock\", \"quantity\": 4},\n    {\"item_id\": \"8804\", \"status\": \"Discontinued\", \"quantity\": 0}\n  ]\n}" },
          { type: "info", title: "Client rendering", content: "Tables rendered via A2UI automatically include user interface wrappers for local pagination, column resizing, and row selections." },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: How can you specify that a column header in an A2UI data table should be sortable by the end-user?" },
          { type: "p", content: "- A) Set 'sortable': true within the header configuration object.\n- B) Include a custom CSS script in the layout configuration.\n- C) Prefix the column header label with an asterisk." },
          { type: "p", content: "Feedback: Option A is correct. Adding 'sortable': true to a header object tells the client-side renderer to add sorting triggers for that column." }
        ]
      },
      {
        id: "4",
        title: "4. Secure Action Handlers & Event Routing",
        file: "modules/04-event-routing.json",
        blocks: [
          { type: "h1", content: "Event Security & Verification" },
          { type: "p", content: "Because A2UI elements route events directly back to agents, executing scripts within these components presents security risks. Enforcing sandboxed execution policies prevents malicious inputs from executing commands." },
          { type: "h2", content: "Threat Vector: Callback Injection" },
          { type: "p", content: "An attacker could manipulate form submission values to send shell escape sequences, hoping the agent runs them directly in tools. Security policies must follow three rules:" },
          { type: "list", items: [
            "Input Type Enforcement: Validate that numerical fields contain only integers/decimals prior to dispatching tools.",
            "CSRF Token Protection: Attach a session token header to all UI action events to verify the click originated from an active workspace interface.",
            "Sanitization Filters: Strip potential script elements and command pipeline operators (e.g. ;, &&, |) from text inputs."
          ] },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: Which security mechanism validates that an A2UI submission event originated from the active user's session and not a spoofed network request?" },
          { type: "p", content: "- A) Python type hints\n- B) Session CSRF tokens in event headers\n- C) Markdown validation filters" },
          { type: "p", content: "Feedback: Option B is correct. Event routing uses CSRF tokens to verify session authenticity." }
        ]
      },
      {
        id: "5",
        title: "5. Lab - Creating an Agent-Driven Approval Dashboard",
        file: "modules/05-lab-approval-dashboard.json",
        blocks: [
          { type: "h1", content: "Lab: Deploying an Approval Interface" },
          { type: "p", content: "In this lab, you will write an agent that reviews expense report submissions and generates an interactive A2UI card with 'Approve' and 'Reject' buttons for manager validation." },
          { type: "h2", content: "Step 1: Write the Dashboard Script" },
          { type: "p", content: "Create `src/agents/approval_manager.py` to generate the A2UI approval card layout payload:" },
          { type: "code", language: "python", code: "import json\nfrom google_adk import Agent\n\ndef create_approval_card(report_details: dict) -> str:\n    # Define the structured A2UI card with action buttons\n    card_layout = {\n        \"a2ui_version\": \"2.0.0\",\n        \"components\": [\n            {\n                \"type\": \"card\",\n                \"title\": \"Expense Approval Required\",\n                \"body\": f\"Review submission from {report_details['submitter']}: ${report_details['amount']}\",\n                \"status\": \"warning\"\n            },\n            {\n                \"type\": \"button_group\",\n                \"buttons\": [\n                    {\"label\": \"Approve Request\", \"action_id\": \"approve_expense\", \"variant\": \"success\"},\n                    {\"label\": \"Reject Request\", \"action_id\": \"reject_expense\", \"variant\": \"danger\"}\n                ]\n            }\n        ]\n    }\n    return json.dumps(card_layout)" },
          { type: "h2", content: "Step 2: Start the agent server" },
          { type: "p", content: "Launch your local agent host server to listen for events:" },
          { type: "code", language: "bash", code: "adk serve --agent approval_manager.py --port 8096" },
          { type: "h2", content: "Step 3: Test action callbacks" },
          { type: "p", content: "Interact with the generated visual interface card. Click **Approve**. Review system console log to verify that the callback event routing triggers the correct backend handler function:" },
          { type: "code", language: "bash", code: "[adk-server] Received event: a2ui_submit -> action_id: approve_expense. Processing payment ledger update..." }
        ]
      }
    ]
  },
  {
    course_id: "adk-402",
    title: "ADK-402: Enterprise Integration & MCP",
    description: "Deploy production agents connected to Model Context Protocol (MCP) servers, configure OAuth2 integrations, and execute securely inside virtualized sandboxes.",
    features: [
      { icon: "🌐", title: "Model Context Protocol", description: "Connect agents to standardized database APIs and documentation repositories using MCP tool hosts." },
      { icon: "🔑", title: "OAuth Security", description: "Configure secure token handshakes and user identity redirection flows for enterprise systems." },
      { icon: "📦", title: "Virtualized Sandboxes", description: "Deploy agent loops within sandboxed container environments using distrobox and isolated OCI nodes." }
    ],
    modules: [
      {
        id: "1",
        title: "1. Model Context Protocol (MCP) Integration",
        file: "modules/01-mcp-protocol.json",
        blocks: [
          { type: "h1", content: "Enterprise MCP Integration" },
          { type: "p", content: "Enterprise agents require secure, real-time access to databases, cloud storage, and APIs. The Model Context Protocol (MCP) provides a standardized, open connection specification to link models to database context tables and active tooling." },
          { type: "h2", content: "Why use MCP in ADK?" },
          { type: "p", content: "Instead of writing customized HTTP request logic for every new database client, MCP exposes clean wrappers. The ADK framework acts as an MCP client, discovering tools, resources, and prompt templates shared by any active MCP server host." },
          { type: "h2", content: "MCP Connection Architecture" },
          { type: "p", content: "ADK agents establish connections to MCP hosts using either standard input/output (stdio) pipelines or HTTP SSE (Server-Sent Events) network transports:" },
          { type: "code", language: "yaml", code: "# Connect your ADK agent to an external Postgres MCP server in agent.yaml\nmcp_servers:\n  postgres-db-host:\n    transport: \"stdio\"\n    command: \"npx\"\n    args:\n      - \"-y\"\n      - \"@modelcontextprotocol/server-postgres\"\n      - \"postgresql://dev:secret@localhost:5432/inventory\"\n" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What is the primary architectural benefit of integrating ADK with MCP servers?" },
          { type: "p", content: "- A) It compiles Python script files into Go binaries automatically.\n- B) It standardizes how models connect to external data sources, tools, and prompts using a unified protocol framework.\n- C) It is a replacement for Tailwind styling files." },
          { type: "p", content: "Feedback: Option B is correct. MCP provides a standardized specification to link model endpoints to context databases and API tools." }
        ]
      },
      {
        id: "2",
        title: "2. Configuring OAuth2 for Enterprise APIs",
        file: "modules/02-oauth-flows.json",
        blocks: [
          { type: "h1", content: "Enterprise OAuth2 Authentication" },
          { type: "p", content: "To execute actions on behalf of employees (such as modifying Google Drive sheets or emailing status updates), agents must authenticate using OAuth 2.0 flows, storing token sets securely to preserve authorization boundaries." },
          { type: "h2", content: "OAuth Token Exchange Handshake" },
          { type: "p", content: "The ADK runtime manages the redirect handshake loop:" },
          { type: "list", items: [
            "Agent identifies a request requiring authentication.",
            "Agent redirects user web client to authorization server (authorization flow redirect).",
            "User signs in, granting application permissions.",
            "Authorization server returns code parameter to agent's local callback endpoint.",
            "Agent exchanges code for token pair (access token + refresh token), saving them securely."
          ] },
          { type: "h2", content: "Implementing Token Management" },
          { type: "p", content: "Store refresh tokens inside hardware keychains or encrypted database vaults. Never log or output token keys to diagnostic tracing panels." },
          { type: "code", language: "python", code: "# Retrieve authenticated client sessions securely in python tools\nfrom google_adk.auth import get_oauth_session\n\ndef fetch_user_drive_docs(user_id: str):\n    session = get_oauth_session(user_id=user_id, service=\"google-drive\")\n    # session object handles auto-refresh transparently\n    files = session.get(\"https://www.googleapis.com/drive/v3/files\").json()\n    return files" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: Where should OAuth refresh tokens be stored securely in a production ADK agent deployment?" },
          { type: "p", content: "- A) Written directly as hardcoded string variables in tools.py.\n- B) Within encrypted vault systems or secure credential keychains.\n- C) Exported to the public transaction logs folder." },
          { type: "p", content: "Feedback: Option B is correct. Credential keys and refresh tokens must be kept in encrypted databases or vaults to prevent token theft." }
        ]
      },
      {
        id: "3",
        title: "3. Headless Deployment in Virtualized Sandboxes",
        file: "modules/03-sandbox-deployment.json",
        blocks: [
          { type: "h1", content: "Sandboxed OCI Deployments" },
          { type: "p", content: "Running agents with file write permissions directly on production host machines presents major security risks. Production deployments run headlessly in isolated sandboxes using container runtimes (such as distrobox, gVisor, or Docker)." },
          { type: "h2", content: "Authoring a Hardened Dockerfile" },
          { type: "p", content: "Use this multi-stage Dockerfile to compile tools and run the agent workspace as a non-privileged system user:" },
          { type: "code", language: "dockerfile", code: "FROM python:3.11-slim as builder\n\nWORKDIR /build\nCOPY requirements.txt .\nRUN pip install --no-cache-dir --user -r requirements.txt\n\nFROM python:3.11-slim as runner\n\n# Create system group and non-root user\nRUN groupadd -g 1001 agentgroup && \\\n    useradd -r -u 1001 -g agentgroup agentuser\n\nWORKDIR /home/agentuser/app\nCOPY --from=builder /root/.local /home/agentuser/.local\nCOPY --chown=agentuser:agentgroup . .\n\nENV PATH=/home/agentuser/.local/bin:$PATH\nUSER agentuser\n\nEXPOSE 8090\nENTRYPOINT [\"adk\", \"serve\", \"--config\", \"agent.yaml\", \"--port\", \"8090\"]" },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: Why is running the agent container process as a non-root user (e.g. agentuser) considered a critical production requirement?" },
          { type: "p", content: "- A) Root processes execute 20% slower inside containers.\n- B) It limits vulnerability impacts by preventing the agent from executing privileged system commands or modifying host files if container escape occurs.\n- C) It is required for Python module decorators." },
          { type: "p", content: "Feedback: Option B is correct. Restricting root privileges is a core security defense-in-depth practice to prevent containment escape." }
        ]
      },
      {
        id: "4",
        title: "4. Enterprise Auditing & Compliance Tracking",
        file: "modules/04-production-hardening.json",
        blocks: [
          { type: "h1", content: "Enterprise Auditing & Hardening" },
          { type: "p", content: "To comply with corporate governance requirements, agents must generate immutable audit logs. Compliance teams require tracing showing which user prompted the agent, what code was executed, and what database edits were committed." },
          { type: "h2", content: "Consolidating Logs" },
          { type: "p", content: "Enable structured syslog logging in `agent.yaml` to stream logs directly to Cloud Logging (such as GCP Google Cloud Logging or AWS CloudWatch):" },
          { type: "code", language: "yaml", code: "logging:\n  format: \"json\"\n  destination: \"syslog\"\n  syslog_endpoint: \"tcp://log-aggregator.internal:514\"\n  levels:\n    tool_execution: \"INFO\"\n    model_raw_input: \"WARNING\"\n    state_transition: \"INFO\"\n" },
          { type: "h2", content: "Reviewing Audit Timelines" },
          { type: "p", content: "An audit trail record maps every agent decision step, saving state parameters and trace hashes. This guarantees audit capability when investigating unexpected pipeline modifications." },
          { type: "h2", content: "Check Your Understanding" },
          { type: "p", content: "Question 1: What logging configuration format is best suited for automated log analysis tools like Cloud Logging or Splunk?" },
          { type: "p", content: "- A) Raw multiline plaintext format.\n- B) Structured JSON format.\n- C) Binary byte buffer dumps." },
          { type: "p", content: "Feedback: Option B is correct. Structured JSON logging allows indexers to parse and query log keys (like tool names or status codes) easily." }
        ]
      },
      {
        id: "5",
        title: "5. Lab - Deploying a Secure Customer Service Orchestrator",
        file: "modules/05-lab-customer-service.json",
        blocks: [
          { type: "h1", content: "Lab: Deploying Production Agents" },
          { type: "p", content: "In this final lab, you will deploy a Customer Service agent pipeline inside a sandboxed docker container. The agent connects to a Postgres Database via MCP stdio, uses secure OAuth2 helper tokens to verify orders, and outputs tracking updates to the visual panel using A2UI dashboards." },
          { type: "h2", content: "Step 1: Build the Sandboxed Image" },
          { type: "p", content: "Compile the production agent and tool structures into a container image:" },
          { type: "code", language: "bash", code: "docker build -t customer-service-agent:v1.0.0 ." },
          { type: "h2", content: "Step 2: Run Postgres Database MCP Server" },
          { type: "p", content: "Ensure the backend database is running and verify it is discoverable by local networks:" },
          { type: "code", language: "bash", code: "docker run -d --name local-postgres -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres" },
          { type: "h2", content: "Step 3: Run the sandboxed Agent Container" },
          { type: "p", content: "Start the container running in user namespace mode, mapping config files and network ports:" },
          { type: "code", language: "bash", code: "docker run -d --name service-agent-run -p 8090:8090 \\\n  -v $(pwd)/config/token.json:/home/agentuser/app/token.json \\\n  customer-service-agent:v1.0.0" },
          { type: "h2", content: "Step 4: Execute Verification Checks" },
          { type: "p", content: "Send an execution payload to verify route tables, data queries, and secure compliance reporting:" },
          { type: "code", language: "bash", code: "curl -X POST http://localhost:8090/execute \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"prompt\": \"Check if user order 9023 exists in database and generate tracking dashboard card.\"}'" },
          { type: "info", title: "Deployment Verification", content: "Verify container execution logs with 'docker logs service-agent-run' to ensure no authentication exceptions or parameter validation errors occurred during startup." }
        ]
      }
    ]
  }
];

function scaffoldCurriculum() {
  console.log(`Starting scaffolding process in directory: ${TRACK_DIR}`);

  coursesData.forEach(course => {
    const courseDir = path.join(TRACK_DIR, course.course_id);
    const modulesDir = path.join(courseDir, 'modules');

    // Create directories
    fs.mkdirSync(modulesDir, { recursive: true });

    // 1. Create manifest.json
    const manifest = {
      metadata: "metadata.json",
      modules: course.modules.map(mod => ({
        id: mod.id,
        title: mod.title,
        file: mod.file
      }))
    };
    fs.writeFileSync(path.join(courseDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    // 2. Create metadata.json
    const metadata = {
      course_id: course.course_id,
      title: course.title,
      version: "1.0.0",
      author: "Google Cloud",
      description: course.description,
      features: course.features
    };
    fs.writeFileSync(path.join(courseDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

    // 3. Create modules JSON files
    course.modules.forEach(mod => {
      const moduleContent = {
        id: mod.id,
        title: mod.title,
        type: "lab",
        blocks: mod.blocks
      };
      const destPath = path.join(courseDir, mod.file);
      // Ensure target subdirectories inside modules/ exist (like modules/)
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, JSON.stringify(moduleContent, null, 2), 'utf8');
    });

    console.log(`Successfully scaffolded course: ${course.course_id}`);
  });

  console.log('Scaffolding complete!');
}

scaffoldCurriculum();

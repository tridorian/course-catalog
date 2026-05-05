

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Menu, 
  X, 
  Terminal, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  PlayCircle,
  Code2
} from 'lucide-react';

// --- Reusable UI Components ---

const CodeBlock = ({ language, code }) => (
  <div className="my-4 rounded-lg overflow-hidden border border-[#1f3d25] bg-[#0a120c] shadow-lg">
    <div className="bg-[#132617] px-4 py-2 text-xs font-semibold text-[#86efac] flex justify-between items-center border-b border-[#1f3d25]">
      <span>{language.toUpperCase()}</span>
      <Terminal size={14} />
    </div>
    <pre className="p-4 overflow-x-auto text-sm text-[#f0fdf4] font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

const InfoBox = ({ children, title = "Note" }) => (
  <div className="my-4 border-l-4 border-[#4ade80] bg-[#132617] p-4 rounded-r-lg shadow-md flex gap-3">
    <Info className="text-[#4ade80] flex-shrink-0 mt-1" size={20} />
    <div>
      <h4 className="font-bold text-[#4ade80] mb-1">{title}</h4>
      <div className="text-[#bbf7d0] text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

const WarningBox = ({ children, title = "Warning" }) => (
  <div className="my-4 border-l-4 border-red-500 bg-red-950/30 p-4 rounded-r-lg shadow-md flex gap-3">
    <ShieldAlert className="text-red-400 flex-shrink-0 mt-1" size={20} />
    <div>
      <h4 className="font-bold text-red-400 mb-1">{title}</h4>
      <div className="text-red-200 text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

// --- Course Content Data ---

const courseSteps = [
  {
    id: 1,
    title: "1. Course Introduction",
    duration: "5 mins",
    content: (
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold text-white mb-6">Course Introduction</h1>
        <p className="text-lg text-[#bbf7d0]">Welcome to the future of software engineering. This course introduces you to Google Antigravity (AGV) and the Tridorian standard for Secure Agentic Development.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-[#132617] p-6 rounded-xl border border-[#1f3d25]">
            <PlayCircle className="text-[#4ade80] w-10 h-10 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">The Agent-First Paradigm</h3>
            <p className="text-[#86efac] text-sm">Shift from being a 'manual coder' to a 'Mission Control Architect'. Learn to orchestrate digital engineers securely.</p>
          </div>
          <div className="bg-[#132617] p-6 rounded-xl border border-[#1f3d25]">
            <ShieldAlert className="text-[#4ade80] w-10 h-10 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Bridging the Trust Gap</h3>
            <p className="text-[#86efac] text-sm">Autonomous agents require strict execution policies. We eliminate the "Black Box" risk through tangible Artifacts.</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-[#1f3d25] pb-2">Course Roadmap</h2>
        <ul className="space-y-3 text-[#bbf7d0]">
          <li className="flex items-center gap-3"><CheckCircle2 className="text-[#4ade80]" size={18}/> <strong>Setup:</strong> Establish a secure deployment path.</li>
          <li className="flex items-center gap-3"><CheckCircle2 className="text-[#4ade80]" size={18}/> <strong>Configuration:</strong> Apply AGV Execution Guardrails.</li>
          <li className="flex items-center gap-3"><CheckCircle2 className="text-[#4ade80]" size={18}/> <strong>Micro-AI:</strong> Master editor-level AI assistance.</li>
          <li className="flex items-center gap-3"><CheckCircle2 className="text-[#4ade80]" size={18}/> <strong>Orchestration:</strong> Use Agent Manager to build an app.</li>
          <li className="flex items-center gap-3"><CheckCircle2 className="text-[#4ade80]" size={18}/> <strong>Disaster Recovery:</strong> Learn to use the Panic Button.</li>
        </ul>
      </div>
    )
  },
  {
    id: 2,
    title: "2. Environment Setup",
    duration: "10 mins",
    content: (
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold text-white mb-6">Environment Setup</h1>
        <p className="text-lg text-[#bbf7d0]">Before giving an AI agent the keys to your terminal, we must establish our workspace. Choose the deployment tier that best fits your machine and risk tolerance.</p>
        
        <h3 className="text-xl font-bold text-[#4ade80] mt-8 mb-2">Choose Your Deployment Path</h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-[#1f3d25] rounded-lg bg-[#0a120c]">
            <h4 className="font-bold text-white mb-2">▶ TIER 1: Easy (Direct Binary Install)</h4>
            <p className="text-sm text-[#86efac] mb-3">Best for getting up and running quickly on a personal machine.</p>
            <CodeBlock language="bash" code={`# macOS & Linux\ncurl -sL https://dl.google.com/agv/install.sh | bash\n\n# Windows (Winget)\nwinget install Google.Antigravity`} />
          </div>

          <div className="p-4 border border-[#1f3d25] rounded-lg bg-[#0a120c]">
            <h4 className="font-bold text-white mb-2">▶ TIER 2: Medium (Homebrew)</h4>
            <p className="text-sm text-[#86efac] mb-3">Best for macOS/Linux developers who want centralized dependency management.</p>
            <CodeBlock language="bash" code={`brew tap google/antigravity && brew install google-antigravity`} />
          </div>

          <div className="p-4 border border-[#4ade80] rounded-lg bg-[#132617] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#4ade80] text-black text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
            <h4 className="font-bold text-white mb-2">▶ TIER 3: Advanced (Secure Container Sandbox)</h4>
            <p className="text-sm text-[#86efac] mb-3">Best for strict isolation. Launches an ephemeral container, preventing agents from altering your host OS.</p>
            <ul className="list-disc pl-5 text-sm text-[#bbf7d0] space-y-1">
              <li><strong>macOS/Windows:</strong> Install Docker Desktop.</li>
              <li><strong>Linux:</strong> <code>sudo apt install docker.io</code> or <code>sudo dnf install podman</code></li>
              <li><strong>Hardware Lab:</strong> If using a bluefin-wtg lab machine, skip setup.</li>
            </ul>
          </div>
        </div>

        <h3 className="text-xl font-bold text-[#4ade80] mt-8 mb-2">Initialize Your Workspace</h3>
        <p className="text-[#bbf7d0]">Open your terminal and initialize your environment. If using Tier 3, run the following to map a local volume and enter the sandbox:</p>
        
        <CodeBlock language="bash" code={`mkdir -p ~/my-agv-work\n\ndocker run -it --rm --name agv-sandbox \\\n  --network host \\\n  -v ~/my-agv-work:/workspace \\\n  ghcr.io/bluefin-wtg-org/agv-workspace:latest`} />

        <InfoBox title="Verify the Toolchain">
          Once inside, verify everything is staged perfectly without installing a single package:
          <CodeBlock language="bash" code={`python3 --version\nagv --version\npython3 -c "from playwright.sync_api import sync_playwright; print('✅ Playwright is ready.')"`} />
        </InfoBox>
      </div>
    )
  },
  {
    id: 3,
    title: "3. Mission Control Settings",
    duration: "5 mins",
    content: (
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold text-white mb-6">Initializing Mission Control</h1>
        <p className="text-lg text-[#bbf7d0]">Configure the AGV Editor and establish strict Execution Policies for AI agents.</p>

        <ol className="list-decimal pl-5 space-y-6 text-[#bbf7d0] mt-6">
          <li>
            <strong className="text-white">Create the Project:</strong> Initialize your project folder in your active terminal:
            <CodeBlock language="bash" code={`mkdir -p my-agent-app\ncd my-agent-app`} />
          </li>
          <li>
            <strong className="text-white">Launch AGV:</strong> On your Host Machine, launch the Antigravity Editor and sign in with your Google Workspace Account.
          </li>
          <li>
            <strong className="text-white">Open Workspace:</strong> Click <em>Open Folder</em> and select the <code>my-agent-app</code> directory.
          </li>
          <li>
            <strong className="text-white">Set Guardrails:</strong> Navigate to <strong>Settings &gt; Execution Policies</strong>. Establish the following trust parameters:
            <div className="bg-[#132617] p-4 rounded-lg mt-3 border border-[#1f3d25] space-y-3">
              <div><span className="text-[#4ade80] font-bold">Operation Mode:</span> Select <em>Secure mode</em> or <em>Review-driven development</em>.</div>
              <div><span className="text-[#4ade80] font-bold">Terminal Execution:</span> Set to <em>Request review</em>. <br/><span className="text-sm text-[#86efac]">Crucial: The agent must ask permission before running bash commands.</span></div>
              <div><span className="text-[#4ade80] font-bold">JavaScript Execution (Browser):</span> Set to <em>Always Proceed</em>.</div>
            </div>
          </li>
        </ol>
      </div>
    )
  },
  {
    id: 4,
    title: "4. Micro-AI Mechanics",
    duration: "10 mins",
    content: (
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold text-white mb-6">Editor Mechanics & Micro-AI</h1>
        <p className="text-lg text-[#bbf7d0]">Master the micro-level developer tools in AGV before moving on to fully autonomous agents.</p>

        <div className="space-y-8 mt-6">
          <div className="bg-[#0a120c] p-6 rounded-xl border border-[#1f3d25]">
            <h3 className="text-xl font-bold text-[#4ade80] flex items-center gap-2 mb-3"><Code2 size={24}/> Inline Completions</h3>
            <p className="text-[#bbf7d0] mb-4">Create a new file called <code>calculator.py</code>. Inside the file, press <strong>Cmd + I</strong> (Mac) or <strong>Ctrl + I</strong> (Windows/Linux) to open the inline prompt.</p>
            <div className="bg-black/50 p-3 rounded text-[#86efac] font-mono text-sm border-l-2 border-[#4ade80]">
              Prompt: "Create a function to calculate the factorial of a number."
            </div>
            <p className="text-sm text-gray-400 mt-2">Hit Enter to generate and accept the code.</p>
          </div>

          <div className="bg-[#0a120c] p-6 rounded-xl border border-[#1f3d25]">
            <h3 className="text-xl font-bold text-[#4ade80] flex items-center gap-2 mb-3"><Terminal size={24}/> Context Passing</h3>
            <p className="text-[#bbf7d0] mb-4">Intentionally break the code (e.g., delete a required colon <code>:</code>). Highlight the broken function, press <strong>Cmd + L</strong> (or <strong>Ctrl + L</strong>).</p>
            <div className="bg-black/50 p-3 rounded text-[#86efac] font-mono text-sm border-l-2 border-[#4ade80]">
              Prompt: "What is wrong with this code?"
            </div>
            <p className="text-sm text-gray-400 mt-2">Notice how AGV automatically attaches the highlighted code block as context to the agent's side panel.</p>
          </div>

          <div className="bg-[#0a120c] p-6 rounded-xl border border-[#1f3d25]">
            <h3 className="text-xl font-bold text-[#4ade80] flex items-center gap-2 mb-3"><CheckCircle2 size={24}/> Explain and Fix</h3>
            <p className="text-[#bbf7d0]">Hover your mouse over the red squiggly error line in the editor. Click the <strong>Quick Fix</strong> or <strong>Explain</strong> lightbulb icon to have the AI resolve the syntax error instantly.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: "5. Agent Orchestration",
    duration: "15 mins",
    content: (
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold text-white mb-6">Agent Orchestration & Artifacts</h1>
        <p className="text-lg text-[#bbf7d0]">Shift from micro-editing to macro-orchestration. Use "Plan Mode" to safely design and execute an AI-generated web scraping application.</p>

        <ol className="list-decimal pl-5 space-y-6 text-[#bbf7d0] mt-6">
          <li><strong>Open Mission Control:</strong> Press <code>Cmd + E</code> (or <code>Ctrl + E</code>) to open the Agent Manager.</li>
          <li><strong>Select Model:</strong> Choose your AI model (e.g., Gemini 3 Pro).</li>
          <li><strong>Set Mode:</strong> Set Execution Mode to <strong>Plan Mode</strong>.</li>
          <li>
            <strong>The Prompt:</strong> Enter the following to begin architecture:
            <div className="bg-black/50 p-4 rounded-lg text-[#86efac] font-mono text-sm border border-[#1f3d25] mt-2 mb-2 italic">
              "Create a basic Python script using Playwright that navigates to 'news.ycombinator.com', extracts the top 5 article titles, and saves them to a file. Enforce PEP 8 styling."
            </div>
          </li>
          <li>
            <strong>Review Artifact:</strong> The agent will generate an <strong>Implementation Plan</strong> instead of writing code blindly.
          </li>
          <li>
            <strong>Iterate:</strong> Leave a comment directly on the plan artifact to adjust the course:
            <div className="bg-black/50 p-3 rounded-lg text-[#86efac] font-mono text-sm border-l-2 border-[#4ade80] mt-2 mb-2">
              Comment: "Please update the plan to ensure the output is saved specifically as a .csv file named hacker_news.csv."
            </div>
          </li>
          <li>
            <strong>Approve & Code:</strong> Click <strong>Approve</strong>. The agent moves to the Coding Phase. Review the line-by-line <strong>Code Diffs</strong> and click <strong>Accept</strong>.
          </li>
          <li>
            <strong>Execute:</strong> The agent will attempt to run <code>python3 scraper.py</code>. Because of our strict policies, it will pause. Click <strong>Approve</strong>.
          </li>
          <li>
            <strong>Verify:</strong> Check your terminal output:
            <CodeBlock language="bash" code={`cat hacker_news.csv`} />
          </li>
        </ol>
      </div>
    )
  },
  {
    id: 6,
    title: "6. Visual Walkthroughs",
    duration: "10 mins",
    content: (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-extrabold text-white">Visual Walkthroughs</h1>
          <span className="bg-[#1f3d25] text-[#4ade80] text-xs font-bold px-2 py-1 rounded">OPTIONAL</span>
        </div>
        
        <p className="text-lg text-[#bbf7d0]">Utilize the Antigravity Browser to allow agents to visually test and interact with web applications natively.</p>
        <InfoBox title="Recommended Role">This lab is highly recommended for frontend developers or QA engineers looking to automate end-to-end UI testing.</InfoBox>

        <div className="space-y-6 mt-8">
          <div className="border-l-2 border-[#1f3d25] pl-6 pb-6 relative">
            <div className="absolute w-4 h-4 bg-[#4ade80] rounded-full -left-[9px] top-1 shadow-[0_0_10px_#4ade80]"></div>
            <h3 className="text-xl font-bold text-white mb-2">1. Build a Target App</h3>
            <p className="text-[#bbf7d0] mb-2">In the Agent Manager, prompt the agent:</p>
            <div className="bg-black/50 p-3 rounded text-[#86efac] font-mono text-sm italic">"Create a simple index.html file with a Todo List app using standard JavaScript. Include an input field, an 'Add' button, and a list."</div>
            <p className="text-[#bbf7d0] mt-2">Accept the generated code.</p>
          </div>

          <div className="border-l-2 border-[#1f3d25] pl-6 pb-6 relative">
            <div className="absolute w-4 h-4 bg-[#1f3d25] rounded-full -left-[9px] top-1 border-2 border-[#4ade80]"></div>
            <h3 className="text-xl font-bold text-white mb-2">2. Serve the App</h3>
            <p className="text-[#bbf7d0]">Run a local python server in your terminal:</p>
            <CodeBlock language="bash" code={`python3 -m http.server 8000`} />
          </div>

          <div className="border-l-2 border-[#1f3d25] pl-6 pb-6 relative">
            <div className="absolute w-4 h-4 bg-[#1f3d25] rounded-full -left-[9px] top-1 border-2 border-[#4ade80]"></div>
            <h3 className="text-xl font-bold text-white mb-2">3. Prompt the Visual Test</h3>
            <p className="text-[#bbf7d0] mb-2">Open a new agent session and prompt:</p>
            <div className="bg-black/50 p-3 rounded text-[#86efac] font-mono text-sm italic border border-[#1f3d25]">"Navigate to http://localhost:8000. Open the Antigravity Browser, type 'Buy groceries' into the input field, click Add, and verify the item appears in the list."</div>
          </div>

          <div className="border-l-2 border-transparent pl-6 relative">
            <div className="absolute w-4 h-4 bg-[#1f3d25] rounded-full -left-[9px] top-1 border-2 border-[#4ade80]"></div>
            <h3 className="text-xl font-bold text-white mb-2">4. Review the Tape</h3>
            <p className="text-[#bbf7d0]">The agent will execute the test. Once finished, click on the <strong>Browser Recording Artifact</strong> in the chat history. You can actually watch a video playback of the agent clicking and typing on your application!</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 7,
    title: "7. Rules vs. Workflows",
    duration: "10 mins",
    content: (
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold text-white mb-6">Rules vs. Workflows</h1>
        <p className="text-lg text-[#bbf7d0]">Codify corporate standards using Rules, and automate repetitive tasks using Workflows to scale your productivity.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <div className="bg-[#132617] p-5 rounded-xl border-t-4 border-[#4ade80]">
            <h3 className="text-xl font-bold text-white mb-2">Rules (Always-On)</h3>
            <p className="text-sm text-[#86efac]">Rules dictate how an agent behaves globally in the background without needing to be prompted every time.</p>
          </div>
          <div className="bg-[#132617] p-5 rounded-xl border-t-4 border-[#86efac]">
            <h3 className="text-xl font-bold text-white mb-2">Workflows (On-Demand)</h3>
            <p className="text-sm text-[#86efac]">Workflows are slash-commands (e.g. <code>/test</code>) you trigger manually for specific, complex repetitive tasks.</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mt-8 mb-4">1. Create a Rule</h3>
        <p className="text-[#bbf7d0]">Create the hidden directory and a rule file in your terminal:</p>
        <CodeBlock language="bash" code={`mkdir -p .agents/rules\n\ncat << 'EOF' > .agents/rules/style.md\nAlways prepend the text \`# Copyright 2026 Tridorian\` as a comment at the top of any new source file you generate.\nEOF`} />

        <h3 className="text-xl font-bold text-white mt-8 mb-4">2. Create a Workflow</h3>
        <p className="text-[#bbf7d0]">Create a custom slash-command to generate tests automatically:</p>
        <CodeBlock language="bash" code={`mkdir -p .agents/workflows\n\ncat << 'EOF' > .agents/workflows/generate-tests.md\nAnalyze the active file and generate a comprehensive suite of unit tests using \`pytest\`. Save them in a \`tests/\` directory.\nEOF`} />

        <InfoBox title="Test it Out!">
          Open the Agent Manager. Type <code>/generate-tests</code> in the chat. The agent will read your workflow prompt, generate the tests for your active file, AND automatically apply the Copyright header based on your global Rule!
        </InfoBox>
      </div>
    )
  },
  {
    id: 8,
    title: "8. Disaster Recovery",
    duration: "5 mins",
    content: (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-extrabold text-white">Disaster Recovery</h1>
          <span className="bg-[#1f3d25] text-[#4ade80] text-xs font-bold px-2 py-1 rounded">OPTIONAL</span>
        </div>
        <p className="text-lg text-[#bbf7d0]">Learn how to safely recover from catastrophic AI hallucinations based on your deployment tier.</p>

        <WarningBox title="The Scenario">
          Let's say you told an agent in "Fast Mode" to clean up your directories, and it hallucinated, deleting your core system binaries. In a normal OS, you are in trouble.
        </WarningBox>

        <h3 className="text-xl font-bold text-white mt-8 mb-4">1. Break the Environment</h3>
        <p className="text-[#bbf7d0]">Intentionally delete core system binaries:</p>
        <CodeBlock language="bash" code={`rm -rf $(which agv)\nrm -rf $(which python3)`} />
        <p className="text-[#bbf7d0]">Verify failure by running <code>python3 --version</code>. It will fail. <strong>Don't panic.</strong></p>

        <h3 className="text-xl font-bold text-white mt-8 mb-4">2. The Panic Button</h3>
        <ul className="space-y-4 text-[#bbf7d0]">
          <li className="bg-[#132617] p-4 rounded border border-[#1f3d25]">
            <strong className="text-white block mb-1">Tier 1 (Direct Install):</strong> Rerun the setup script or winget command from Module 2.
          </li>
          <li className="bg-[#132617] p-4 rounded border border-[#1f3d25]">
            <strong className="text-white block mb-1">Tier 2 (Homebrew):</strong> Run <code>brew reinstall google-antigravity python</code>.
          </li>
          <li className="bg-[#132617] p-4 rounded border border-[#4ade80] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#4ade80] text-black text-[10px] font-bold px-2 py-1 rounded-bl">INSTANT RECOVERY</div>
            <strong className="text-white block mb-1">Tier 3 (Container Sandbox):</strong> Type <code>exit</code> to kill the container. Press the Up Arrow in your host terminal to re-run your <code>docker run</code> command. The broken state is deleted instantly, and a fresh container is spun up in seconds.
          </li>
        </ul>
        
        <p className="text-[#86efac] mt-6 italic">Notice your source code in `my-agent-app` remains completely safe regardless of tier because it is mapped to a persistent volume!</p>
      </div>
    )
  },
  {
    id: 9,
    title: "9. Wrap Up",
    duration: "2 mins",
    content: (
      <div className="space-y-6 text-center py-12">
        <CheckCircle2 className="text-[#4ade80] w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
        <h1 className="text-5xl font-extrabold text-white mb-4">Congratulations!</h1>
        <p className="text-xl text-[#bbf7d0] max-w-2xl mx-auto leading-relaxed">
          You have successfully mastered Google Antigravity. You've transitioned from coding manually to securely orchestrating AI agents, utilizing visual browsers, and automating tasks with custom workflows.
        </p>

        <div className="max-w-2xl mx-auto mt-12 bg-[#132617] p-8 rounded-2xl border border-[#1f3d25] text-left">
          <h3 className="text-2xl font-bold text-white mb-4">Next Steps to Explore</h3>
          <ul className="space-y-4 text-[#bbf7d0]">
            <li className="flex items-start gap-3">
              <ChevronRight className="text-[#4ade80] mt-1 flex-shrink-0" size={20}/> 
              <div>
                <strong className="text-white">Kubernetes Integration:</strong> Try spinning up a local cluster using Docker Desktop or <code>kind</code> on your host machine. Your agent can safely deploy pods to this cluster to test microservices locally.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="text-[#4ade80] mt-1 flex-shrink-0" size={20}/> 
              <div>
                <strong className="text-white">Explore the Marketplace:</strong> Check out the community-driven Rules and Workflows available for AGV to speed up your specific technology stack.
              </div>
            </li>
          </ul>
        </div>
      </div>
    )
  }
];

// --- Main App Component ---

export default function App() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeStep = courseSteps[activeStepIndex];
  const progressPercentage = ((activeStepIndex + 1) / courseSteps.length) * 100;

  // Scroll to top when step changes
  useEffect(() => {
    // Only smooth scroll if not on first render
    if (activeStepIndex !== 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStepIndex]);

  const goToNext = () => {
    if (activeStepIndex < courseSteps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  };

  const goToPrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#050805] text-[#f0fdf4] font-sans flex flex-col md:flex-row selection:bg-[#4ade80] selection:text-black">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0a120c] border-b border-[#1f3d25] p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-bold text-[#4ade80] tracking-widest">TRIDORIAN</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#f0fdf4]">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:block fixed md:sticky top-[61px] md:top-0 h-[calc(100vh-61px)] md:h-screen 
        w-full md:w-80 bg-[#0a120c] border-r border-[#1f3d25] flex flex-col z-40
        transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar
      `}>
        <div className="p-6 hidden md:block border-b border-[#1f3d25]">
          <div className="font-extrabold text-xl text-[#4ade80] tracking-[0.2em]">TRIDORIAN</div>
          <div className="text-xs text-[#86efac] mt-1 font-mono">LABS // AGV-01</div>
        </div>
        
        <div className="p-4 flex-1">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Course Modules</h2>
          <nav className="space-y-1">
            {courseSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => {
                  setActiveStepIndex(index);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 flex justify-between items-center ${
                  index === activeStepIndex 
                    ? 'bg-[#132617] text-[#4ade80] border border-[#1f3d25]' 
                    : 'text-gray-400 hover:bg-[#132617]/50 hover:text-white'
                }`}
              >
                <span className="truncate pr-2">{step.title}</span>
                <span className="text-xs opacity-50 whitespace-nowrap">{step.duration}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Global Progress */}
        <div className="p-6 border-t border-[#1f3d25] bg-[#050805]">
          <div className="flex justify-between text-xs text-[#86efac] mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 w-full bg-[#132617] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#4ade80] transition-all duration-500 ease-out shadow-[0_0_10px_#4ade80]"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden pb-24 md:pb-0">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4ade80]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-4xl mx-auto w-full z-10">
          {/* Step Indicator */}
          <div className="text-xs font-mono text-[#86efac] mb-4 tracking-wider">
            STEP {activeStepIndex + 1} OF {courseSteps.length}
          </div>
          
          {/* Inject Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeStep.content}
          </div>
        </main>

        {/* Bottom Navigation Bar */}
        <footer className="fixed md:sticky bottom-0 w-full md:w-auto bg-[#0a120c] border-t border-[#1f3d25] p-4 px-6 md:px-12 flex justify-between items-center z-30">
          <button 
            onClick={goToPrev}
            disabled={activeStepIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeStepIndex === 0 
                ? 'text-gray-600 cursor-not-allowed' 
                : 'text-white hover:bg-[#132617]'
            }`}
          >
            <ChevronLeft size={20} />
            Back
          </button>

          <button 
            onClick={goToNext}
            disabled={activeStepIndex === courseSteps.length - 1}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
              activeStepIndex === courseSteps.length - 1 
                ? 'opacity-0 pointer-events-none' 
                : 'bg-[#4ade80] text-black hover:bg-[#22c55e] shadow-[0_0_15px_rgba(74,222,128,0.3)]'
            }`}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Custom Scrollbar for sidebar to match theme */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a120c;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f3d25;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4ade80;
        }
      `}} />
    </div>
  );
}


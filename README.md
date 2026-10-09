# Smart CPU Process Scheduler - Web UI & Simulation Dashboard

A clean, college-level interactive web simulation for the **Smart CPU Process Scheduler** mini-project. This UI serves as an educational and visual representation of CPU scheduling algorithms with advanced Operating Systems concepts.

---

## 🌐 Quick Access Links

- **Local Web Server**: [http://localhost:8000](http://localhost:8000)
- **Direct File**: [index.html](file:///c:/Users/viraj/Downloads/hello/index.html)

---

## 📁 Project Structure

```text
hello/
├── index.html        # Main single-page web UI & Dashboard (HTML5)
├── style.css         # Clean, viva-friendly college project styling (CSS3)
├── script.js         # Scheduling logic, real-time CPU monitor & metrics (JavaScript)
└── README.md         # Project documentation and viva demonstration guide
```

---

## 🚀 Key Features Implemented

| Feature | Description | Implementation Details |
| :--- | :--- | :--- |
| 📊 **CPU Utilization Graph** | Shows CPU usage visually | Dynamic utilization bar comparing active CPU time vs idle time |
| ⚡ **Algorithm Comparison** | Compares FCFS, SJF, SRTF, RR, Priority | Full matrix comparing Avg WT, TAT, RT, switches, and CPU utilization |
| 🏆 **Best Algorithm Recommendation** | Suggests optimal algorithm | Evaluates workload metrics to identify and highlight the winning algorithm |
| ⏱️ **Response Time** | Calculates first CPU allocation delay | Measured for each process: $\text{RT} = T_{\text{first}} - \text{Arrival Time}$ |
| 🚨 **Process Priority Manager** | Dynamic priority adjustments | Allows live priority updates during configuration or execution |
| 📈 **Real-Time CPU Monitor** | Displays live execution | Step-by-step or timed animation with simulation clock, CPU core state, and ready queue |
| 🔄 **Context Switch Counter** | Tracks process switches | Counts transitions between different processes on the CPU core |
| 💀 **Starvation Detection** | Detects excessive waiting | Configurable threshold flags processes that suffer from starvation |
| 🎯 **Aging Mechanism** | Prevents starvation | Periodically boosts priority for waiting processes |
| 📋 **Process History** | Records simulation runs | Stores past runs with full metrics in a searchable log |
| 🖥️ **Web Dashboard** | Integrated interface | Top stats bar and structured cards for viva presentation |
| 🤖 **Smart Algorithm Selector** | Automated recommendation | Analyzes workload variance (CV, arrival spread) and recommends the best algorithm |

---

## ⚙️ Scheduling Formulas Used

- **Completion Time (CT)**: Time at which process finishes execution.
- **Turnaround Time (TAT)**: $\text{TAT} = \text{CT} - \text{AT}$
- **Waiting Time (WT)**: $\text{WT} = \text{TAT} - \text{BT}$
- **Response Time (RT)**: $\text{RT} = T_{\text{first}} - \text{AT}$
- **CPU Utilization**: $\frac{\text{Total Active Burst Time}}{\text{Total Timeline}} \times 100\%$
- **Context Switches**: $\sum \text{process switches between distinct PIDs}$

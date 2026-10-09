/**
 * Smart CPU Process Scheduler - Web Simulation
 * Student College Mini Project
 * Visual representation of C++ CPU Scheduling with Advanced OS Features
 */

// Algorithm Information
const ALGO_INFO = {
    'fcfs': {
        name: 'FCFS (First Come First Serve)',
        type: 'Non-Preemptive',
        desc: 'Processes are executed in order of arrival.'
    },
    'sjf': {
        name: 'SJF Non-Preemptive',
        type: 'Non-Preemptive',
        desc: 'The process with the shortest burst time is selected first.'
    },
    'srtf': {
        name: 'SRTF (Shortest Remaining Time First)',
        type: 'Preemptive',
        desc: 'The process with the shortest remaining time is selected.'
    },
    'rr': {
        name: 'Round Robin',
        type: 'Preemptive',
        desc: 'Each process gets CPU time according to the time quantum.'
    },
    'priority-np': {
        name: 'Priority Non-Preemptive',
        type: 'Non-Preemptive',
        desc: 'The available process with the highest priority is selected.'
    },
    'priority-p': {
        name: 'Priority Preemptive',
        type: 'Preemptive',
        desc: 'The process with the highest priority can interrupt the current process.'
    }
};

let currentAlgorithm = 'fcfs';
let simulationHistory = [];
let liveSimTimer = null;
let liveSimState = null;

// Standard sample dataset for quick viva demo
const SAMPLE_PROCESSES = [
    { id: 1, arrival: 0, burst: 5, priority: 2 },
    { id: 2, arrival: 1, burst: 3, priority: 1 },
    { id: 3, arrival: 2, burst: 4, priority: 3 },
    { id: 4, arrival: 4, burst: 2, priority: 4 }
];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    loadHistoryFromStorage();
    setupProcessRows(4, SAMPLE_PROCESSES);
    setupEventListeners();
    updateDashboardBar();
    analyzeWorkloadAndRecommend();
});

function setupEventListeners() {
    // Add processes button
    document.getElementById('btn-add-processes').addEventListener('click', () => {
        const count = parseInt(document.getElementById('num-processes').value, 10);
        if (isNaN(count) || count < 1) {
            alert('Please enter a valid number of processes (at least 1).');
            return;
        }
        setupProcessRows(count);
        updateDashboardBar();
        analyzeWorkloadAndRecommend();
    });

    // Load example data button
    document.getElementById('btn-load-example').addEventListener('click', () => {
        document.getElementById('num-processes').value = SAMPLE_PROCESSES.length;
        setupProcessRows(SAMPLE_PROCESSES.length, SAMPLE_PROCESSES);
        updateDashboardBar();
        analyzeWorkloadAndRecommend();
    });

    // Algorithm selection buttons
    const algoButtons = document.querySelectorAll('.btn-algo');
    algoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            algoButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAlgorithm = btn.getAttribute('data-algo');

            // Show or hide Time Quantum box
            const quantumBox = document.getElementById('quantum-container');
            if (currentAlgorithm === 'rr') {
                quantumBox.style.display = 'inline-flex';
            } else {
                quantumBox.style.display = 'none';
            }
            updateDashboardBar();
        });
    });

    // Run Scheduler button (Instant execution)
    document.getElementById('btn-run').addEventListener('click', () => {
        stopLiveSimulation();
        runScheduler(false);
    });

    // 📈 Real-Time Simulation button
    document.getElementById('btn-live-sim').addEventListener('click', () => {
        startLiveSimulation();
    });

    // Live monitor controls
    document.getElementById('btn-live-pause').addEventListener('click', toggleLivePause);
    document.getElementById('btn-live-step').addEventListener('click', stepLiveSimulation);

    // ⚡ Compare All button
    document.getElementById('btn-compare-all').addEventListener('click', compareAllAlgorithms);

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', resetAll);

    // 🤖 Smart Recommendation Apply button
    document.getElementById('btn-apply-smart').addEventListener('click', applySmartRecommendation);

    // 🚨 Process Priority Manager button
    document.getElementById('btn-update-priority').addEventListener('click', updateProcessPriorityLive);

    // Clear history button
    document.getElementById('btn-clear-history').addEventListener('click', clearHistory);

    // Dynamic input changes trigger workload recommendation update
    document.getElementById('process-table-body').addEventListener('input', () => {
        analyzeWorkloadAndRecommend();
        updateDashboardBar();
    });
}

/**
 * Dynamically generate process input rows
 */
function setupProcessRows(count, defaultData = null) {
    const tbody = document.getElementById('process-table-body');
    tbody.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        const pid = i + 1;
        
        let arrival = i;
        let burst = Math.floor(Math.random() * 5) + 2;
        let priority = Math.floor(Math.random() * 4) + 1;

        if (defaultData && defaultData[i]) {
            arrival = defaultData[i].arrival;
            burst = defaultData[i].burst;
            priority = defaultData[i].priority;
        }

        tr.innerHTML = `
            <td><strong>P${pid}</strong></td>
            <td><input type="number" class="input-at" min="0" value="${arrival}" data-pid="${pid}"></td>
            <td><input type="number" class="input-bt" min="1" value="${burst}" data-pid="${pid}"></td>
            <td><input type="number" class="input-pr" min="1" value="${priority}" data-pid="${pid}"></td>
        `;
        tbody.appendChild(tr);
    }

    updatePriorityManagerDropdown(count);
}

/**
 * Update Priority Manager PID selector
 */
function updatePriorityManagerDropdown(count) {
    const sel = document.getElementById('priority-mgr-pid');
    sel.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Process P${i}`;
        sel.appendChild(opt);
    }
}

/**
 * 🚨 Process Priority Manager: Dynamically updates priority
 */
function updateProcessPriorityLive() {
    const pid = parseInt(document.getElementById('priority-mgr-pid').value, 10);
    const newPr = parseInt(document.getElementById('priority-mgr-val').value, 10);

    if (isNaN(newPr) || newPr < 1) {
        alert('Please enter a valid priority number (>= 1).');
        return;
    }

    const prInput = document.querySelector(`.input-pr[data-pid="${pid}"]`);
    if (prInput) {
        prInput.value = newPr;
        prInput.style.backgroundColor = '#fef08a';
        setTimeout(() => { prInput.style.backgroundColor = ''; }, 1000);
        analyzeWorkloadAndRecommend();

        // If results are currently visible, re-run schedule to show live update
        const resultsSection = document.getElementById('results-section');
        if (resultsSection.style.display !== 'none' && !liveSimState) {
            runScheduler(false, false);
        }
    }
}

/**
 * Read processes from HTML input table
 */
function getProcessesFromTable() {
    const rows = document.querySelectorAll('#process-table-body tr');
    const processes = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const atInput = row.querySelector('.input-at');
        const btInput = row.querySelector('.input-bt');
        const prInput = row.querySelector('.input-pr');

        const pid = parseInt(atInput.getAttribute('data-pid'), 10);
        const arrival = parseInt(atInput.value, 10);
        const burst = parseInt(btInput.value, 10);
        const priority = parseInt(prInput.value, 10);

        if (isNaN(arrival) || arrival < 0) {
            alert(`Please enter a valid Arrival Time for P${pid} (>= 0).`);
            return null;
        }
        if (isNaN(burst) || burst <= 0) {
            alert(`Please enter a valid Burst Time for P${pid} (> 0).`);
            return null;
        }
        if (isNaN(priority) || priority < 0) {
            alert(`Please enter a valid Priority for P${pid} (>= 0).`);
            return null;
        }

        processes.push({
            id: pid,
            arrival: arrival,
            burst: burst,
            priority: priority,
            remaining: burst,
            completion: 0,
            turnaround: 0,
            waiting: 0,
            responseTime: -1,
            firstExecuted: -1,
            ageCounter: 0
        });
    }

    return processes;
}

/**
 * 🤖 Smart Algorithm Selector
 * Analyzes workload characteristics and suggests optimal algorithm
 */
function analyzeWorkloadAndRecommend() {
    const processes = getProcessesFromTable();
    if (!processes || processes.length === 0) return null;

    const n = processes.length;
    const bursts = processes.map(p => p.burst);
    const priorities = processes.map(p => p.priority);
    const arrivals = processes.map(p => p.arrival);

    const avgBurst = bursts.reduce((a, b) => a + b, 0) / n;
    const variance = bursts.reduce((sum, b) => sum + Math.pow(b - avgBurst, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = avgBurst > 0 ? (stdDev / avgBurst) : 0; // Coefficient of Variation

    const uniquePriorities = new Set(priorities).size;
    const allArriveZero = arrivals.every(a => a === 0);

    let recommendedAlgo = 'srtf';
    let reason = '';
    let suggestedQuantum = Math.max(2, Math.round(avgBurst * 0.75));

    if (uniquePriorities > 1 && uniquePriorities >= n * 0.5) {
        recommendedAlgo = 'priority-p';
        reason = `Distinct priorities detected across processes. Priority Preemptive ensures urgent tasks execute immediately.`;
    } else if (cv > 0.45) {
        recommendedAlgo = 'srtf';
        reason = `High variance in burst times (CV: ${cv.toFixed(2)}). SRTF minimizes average waiting time and eliminates convoy effect.`;
    } else if (cv < 0.2 && allArriveZero) {
        recommendedAlgo = 'fcfs';
        reason = `Uniform burst times with simultaneous arrivals. FCFS provides zero context-switch overhead with optimal fairness.`;
    } else {
        recommendedAlgo = 'rr';
        reason = `Balanced mixed workload. Round Robin (Quantum: ${suggestedQuantum}) provides optimal response times without process starvation.`;
    }

    // Update banner
    const bannerText = document.getElementById('smart-recommendation-text');
    bannerText.innerHTML = `Workload Analysis: ${reason} <strong>Recommended: ${ALGO_INFO[recommendedAlgo].name}</strong>`;
    
    document.getElementById('dash-smart-suggest').textContent = ALGO_INFO[recommendedAlgo].name.split(' ')[0];

    return { algo: recommendedAlgo, quantum: suggestedQuantum, reason: reason };
}

/**
 * Apply the smart recommendation automatically
 */
function applySmartRecommendation() {
    const rec = analyzeWorkloadAndRecommend();
    if (!rec) return;

    const btn = document.querySelector(`.btn-algo[data-algo="${rec.algo}"]`);
    if (btn) {
        btn.click();
    }

    if (rec.algo === 'rr' && rec.quantum) {
        document.getElementById('time-quantum').value = rec.quantum;
    }
}

/**
 * Main Run Scheduler Handler (Instant calculation)
 */
function runScheduler(isLive = false, logHistory = true) {
    const processes = getProcessesFromTable();
    if (!processes || processes.length === 0) return;

    const n = processes.length;
    const agingEnabled = document.getElementById('chk-enable-aging').checked;
    const agingInterval = parseInt(document.getElementById('aging-interval').value, 10) || 3;
    const starvationThreshold = parseInt(document.getElementById('starvation-threshold').value, 10) || 10;

    let scheduleResult = null;

    if (currentAlgorithm === 'fcfs') {
        scheduleResult = runFCFS(processes, n);
    } else if (currentAlgorithm === 'sjf') {
        scheduleResult = runSJF(processes, n);
    } else if (currentAlgorithm === 'srtf') {
        scheduleResult = runSRTF(processes, n);
    } else if (currentAlgorithm === 'rr') {
        const quantumInput = document.getElementById('time-quantum');
        const quantum = parseInt(quantumInput.value, 10);
        if (isNaN(quantum) || quantum <= 0) {
            alert('Please enter a valid Time Quantum (> 0).');
            return;
        }
        scheduleResult = runRoundRobin(processes, n, quantum);
    } else if (currentAlgorithm === 'priority-np') {
        scheduleResult = runPriorityNonPreemptive(processes, n, agingEnabled, agingInterval);
    } else if (currentAlgorithm === 'priority-p') {
        scheduleResult = runPriorityPreemptive(processes, n, agingEnabled, agingInterval);
    }

    if (scheduleResult) {
        // Calculate metrics
        computeExtraMetrics(scheduleResult.processes, scheduleResult.gantt);

        if (!isLive) {
            displayResults(scheduleResult.processes, scheduleResult.gantt, starvationThreshold);
            updateAlgorithmInfo(currentAlgorithm);

            const resultsSection = document.getElementById('results-section');
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });

            if (logHistory) {
                recordHistory(currentAlgorithm, scheduleResult.processes, scheduleResult.metrics);
            }
        }
    }

    return scheduleResult;
}

// ==========================================================
// 1. FCFS Logic
// ==========================================================
function runFCFS(p, n) {
    p.sort((a, b) => a.arrival - b.arrival || a.id - b.id);

    let time = 0;
    const gantt = [];

    for (let i = 0; i < n; i++) {
        if (time < p[i].arrival) {
            gantt.push({ id: 'IDLE', start: time, end: p[i].arrival });
            time = p[i].arrival;
        }

        const start = time;
        if (p[i].firstExecuted === -1) p[i].firstExecuted = start;

        time = time + p[i].burst;

        p[i].completion = time;
        p[i].turnaround = p[i].completion - p[i].arrival;
        p[i].waiting = p[i].turnaround - p[i].burst;
        p[i].responseTime = p[i].firstExecuted - p[i].arrival;

        gantt.push({ id: p[i].id, start: start, end: time });
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// 2. SJF Non-Preemptive Logic
// ==========================================================
function runSJF(p, n) {
    let time = 0;
    let completed = 0;
    const done = new Array(n).fill(0);
    const gantt = [];

    while (completed < n) {
        let index = -1;
        let smallest = 999999;

        for (let i = 0; i < n; i++) {
            if (done[i] === 0 && p[i].arrival <= time) {
                if (p[i].burst < smallest) {
                    smallest = p[i].burst;
                    index = i;
                }
            }
        }

        if (index === -1) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;
        } else {
            const start = time;
            if (p[index].firstExecuted === -1) p[index].firstExecuted = start;

            time = time + p[index].burst;

            p[index].completion = time;
            p[index].turnaround = p[index].completion - p[index].arrival;
            p[index].waiting = p[index].turnaround - p[index].burst;
            p[index].responseTime = p[index].firstExecuted - p[index].arrival;

            done[index] = 1;
            completed++;

            gantt.push({ id: p[index].id, start: start, end: time });
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// 3. SRTF Logic
// ==========================================================
function runSRTF(p, n) {
    let time = 0;
    let completed = 0;
    const gantt = [];

    for (let i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
    }

    while (completed < n) {
        let index = -1;
        let smallest = 999999;

        for (let i = 0; i < n; i++) {
            if (p[i].arrival <= time && p[i].remaining > 0) {
                if (p[i].remaining < smallest) {
                    smallest = p[i].remaining;
                    index = i;
                }
            }
        }

        if (index === -1) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;
        } else {
            const currentPid = p[index].id;
            if (p[index].firstExecuted === -1) p[index].firstExecuted = time;

            if (gantt.length > 0 && gantt[gantt.length - 1].id === currentPid) {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: currentPid, start: time, end: time + 1 });
            }

            p[index].remaining--;
            time++;

            if (p[index].remaining === 0) {
                p[index].completion = time;
                p[index].turnaround = p[index].completion - p[index].arrival;
                p[index].waiting = p[index].turnaround - p[index].burst;
                p[index].responseTime = p[index].firstExecuted - p[index].arrival;
                completed++;
            }
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// 4. Round Robin Logic
// ==========================================================
function runRoundRobin(p, n, quantum) {
    const queue = [];
    const added = new Array(n).fill(0);
    const gantt = [];
    let time = 0;
    let completed = 0;

    for (let i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
        added[i] = 0;
    }

    for (let i = 0; i < n; i++) {
        if (p[i].arrival === 0) {
            queue.push(i);
            added[i] = 1;
        }
    }

    while (completed < n) {
        if (queue.length === 0) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;

            for (let i = 0; i < n; i++) {
                if (added[i] === 0 && p[i].arrival <= time) {
                    queue.push(i);
                    added[i] = 1;
                }
            }
            continue;
        }

        const index = queue.shift();
        const run = (p[index].remaining > quantum) ? quantum : p[index].remaining;
        const start = time;

        if (p[index].firstExecuted === -1) p[index].firstExecuted = start;

        for (let i = 0; i < run; i++) {
            time++;
            p[index].remaining--;

            for (let j = 0; j < n; j++) {
                if (added[j] === 0 && p[j].arrival <= time) {
                    queue.push(j);
                    added[j] = 1;
                }
            }
        }

        gantt.push({ id: p[index].id, start: start, end: time });

        if (p[index].remaining === 0) {
            p[index].completion = time;
            p[index].turnaround = p[index].completion - p[index].arrival;
            p[index].waiting = p[index].turnaround - p[index].burst;
            p[index].responseTime = p[index].firstExecuted - p[index].arrival;
            completed++;
        } else {
            queue.push(index);
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// 5. Priority Non-Preemptive Logic (With Aging Mechanism)
// ==========================================================
function runPriorityNonPreemptive(p, n, agingEnabled = false, agingInterval = 3) {
    let time = 0;
    let completed = 0;
    const done = new Array(n).fill(0);
    const gantt = [];

    // Clone priority to allow aging adjustments without mutating user input
    for (let i = 0; i < n; i++) {
        p[i].currentPriority = p[i].priority;
        p[i].ageCounter = 0;
    }

    while (completed < n) {
        // Apply Aging to waiting processes
        if (agingEnabled && agingInterval > 0) {
            for (let i = 0; i < n; i++) {
                if (done[i] === 0 && p[i].arrival <= time) {
                    p[i].ageCounter++;
                    if (p[i].ageCounter >= agingInterval) {
                        if (p[i].currentPriority > 1) {
                            p[i].currentPriority--; // Priority increases (lower number)
                        }
                        p[i].ageCounter = 0;
                    }
                }
            }
        }

        let index = -1;
        let bestPriority = 999999;

        for (let i = 0; i < n; i++) {
            if (done[i] === 0 && p[i].arrival <= time) {
                if (p[i].currentPriority < bestPriority) {
                    bestPriority = p[i].currentPriority;
                    index = i;
                }
            }
        }

        if (index === -1) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;
        } else {
            const start = time;
            if (p[index].firstExecuted === -1) p[index].firstExecuted = start;

            time = time + p[index].burst;

            p[index].completion = time;
            p[index].turnaround = p[index].completion - p[index].arrival;
            p[index].waiting = p[index].turnaround - p[index].burst;
            p[index].responseTime = p[index].firstExecuted - p[index].arrival;

            done[index] = 1;
            completed++;

            gantt.push({ id: p[index].id, start: start, end: time });
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// 6. Priority Preemptive Logic (With Aging Mechanism)
// ==========================================================
function runPriorityPreemptive(p, n, agingEnabled = false, agingInterval = 3) {
    let time = 0;
    let completed = 0;
    const gantt = [];

    for (let i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
        p[i].currentPriority = p[i].priority;
        p[i].ageCounter = 0;
    }

    while (completed < n) {
        // Apply Aging to waiting processes (not currently running)
        if (agingEnabled && agingInterval > 0) {
            for (let i = 0; i < n; i++) {
                if (p[i].arrival <= time && p[i].remaining > 0) {
                    p[i].ageCounter++;
                    if (p[i].ageCounter >= agingInterval) {
                        if (p[i].currentPriority > 1) {
                            p[i].currentPriority--;
                        }
                        p[i].ageCounter = 0;
                    }
                }
            }
        }

        let index = -1;
        let bestPriority = 999999;

        for (let i = 0; i < n; i++) {
            if (p[i].arrival <= time && p[i].remaining > 0) {
                if (p[i].currentPriority < bestPriority) {
                    bestPriority = p[i].currentPriority;
                    index = i;
                }
            }
        }

        if (index === -1) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;
        } else {
            const currentPid = p[index].id;
            if (p[index].firstExecuted === -1) p[index].firstExecuted = time;

            if (gantt.length > 0 && gantt[gantt.length - 1].id === currentPid) {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: currentPid, start: time, end: time + 1 });
            }

            p[index].remaining--;
            time++;

            if (p[index].remaining === 0) {
                p[index].completion = time;
                p[index].turnaround = p[index].completion - p[index].arrival;
                p[index].waiting = p[index].turnaround - p[index].burst;
                p[index].responseTime = p[index].firstExecuted - p[index].arrival;
                completed++;
            }
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// Extra Metrics Calculation (Context Switches, CPU Util, etc.)
// ==========================================================
function computeExtraMetrics(processes, gantt) {
    let contextSwitches = 0;
    let prevId = null;

    for (let i = 0; i < gantt.length; i++) {
        const currId = gantt[i].id;
        if (currId !== 'IDLE') {
            if (prevId !== null && prevId !== currId) {
                contextSwitches++;
            }
            prevId = currId;
        }
    }

    const totalBusyTime = processes.reduce((sum, p) => sum + p.burst, 0);
    const totalTimeline = gantt.length > 0 ? (gantt[gantt.length - 1].end - gantt[0].start) : 0;
    const totalIdleTime = Math.max(0, totalTimeline - totalBusyTime);
    const cpuUtilization = totalTimeline > 0 ? ((totalBusyTime / totalTimeline) * 100) : 100;

    const n = processes.length;
    const avgWT = processes.reduce((s, p) => s + p.waiting, 0) / n;
    const avgTAT = processes.reduce((s, p) => s + p.turnaround, 0) / n;
    const avgRT = processes.reduce((s, p) => s + p.responseTime, 0) / n;

    return {
        contextSwitches: contextSwitches,
        totalBusyTime: totalBusyTime,
        totalIdleTime: totalIdleTime,
        totalTimeline: totalTimeline,
        cpuUtilization: cpuUtilization,
        avgWT: avgWT,
        avgTAT: avgTAT,
        avgRT: avgRT
    };
}

// ==========================================================
// Results Display and Gantt Chart Rendering
// ==========================================================
function displayResults(processes, gantt, starvationThreshold = 10) {
    const tbody = document.getElementById('results-table-body');
    tbody.innerHTML = '';

    const metrics = computeExtraMetrics(processes, gantt);
    let starvedCount = 0;
    const starvedProcesses = [];

    processes.forEach(p => {
        const isStarved = p.waiting >= starvationThreshold || (p.waiting > p.burst * 2.5 && p.waiting >= 6);
        if (isStarved) {
            starvedCount++;
            starvedProcesses.push(`P${p.id}`);
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>P${p.id}</strong></td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>${p.priority}</td>
            <td>${p.completion}</td>
            <td>${p.turnaround}</td>
            <td>${p.waiting}</td>
            <td><strong>${p.responseTime}</strong></td>
            <td>${isStarved ? '<span class="status-starved">💀 Starvation</span>' : '<span class="status-ok">Completed</span>'}</td>
        `;
        tbody.appendChild(tr);
    });

    // 💀 Starvation Alert Banner
    const starvationBox = document.getElementById('starvation-alert-box');
    const starvationMsg = document.getElementById('starvation-alert-msg');
    if (starvedCount > 0) {
        starvationMsg.textContent = `${starvedProcesses.join(', ')} waited over ${starvationThreshold} units! Consider enabling the Aging Mechanism to boost priority.`;
        starvationBox.style.display = 'block';
    } else {
        starvationBox.style.display = 'none';
    }

    // Metrics summary updates
    document.getElementById('avg-wt-value').textContent = metrics.avgWT.toFixed(2);
    document.getElementById('avg-tat-value').textContent = metrics.avgTAT.toFixed(2);
    document.getElementById('avg-rt-value').textContent = metrics.avgRT.toFixed(2);
    document.getElementById('context-switch-value').textContent = metrics.contextSwitches;
    document.getElementById('cpu-util-metric-val').textContent = `${metrics.cpuUtilization.toFixed(1)}%`;

    // 📊 CPU Utilization Graph updates
    document.getElementById('util-percentage-text').textContent = `${metrics.cpuUtilization.toFixed(1)}%`;
    document.getElementById('util-bar-fill').style.width = `${metrics.cpuUtilization.toFixed(1)}%`;
    document.getElementById('util-busy-time').textContent = metrics.totalBusyTime;
    document.getElementById('util-idle-time').textContent = metrics.totalIdleTime;
    document.getElementById('util-total-time').textContent = metrics.totalTimeline;

    renderGanttChart(gantt);
}

/**
 * Render horizontal textbook Gantt Chart
 */
function renderGanttChart(gantt) {
    const wrapper = document.getElementById('gantt-chart-wrapper');
    wrapper.innerHTML = '';

    if (!gantt || gantt.length === 0) return;

    const chart = document.createElement('div');
    chart.className = 'gantt-chart';

    gantt.forEach((block, idx) => {
        const duration = block.end - block.start;
        const blockElem = document.createElement('div');
        blockElem.className = 'gantt-block';

        if (block.id === 'IDLE') {
            blockElem.classList.add('pid-idle');
            blockElem.textContent = 'Idle';
        } else {
            const colorIndex = ((block.id - 1) % 8) + 1;
            blockElem.classList.add(`pid-${colorIndex}`);
            blockElem.textContent = `P${block.id}`;
        }

        blockElem.style.flex = `${duration} 0 ${Math.max(duration * 24, 40)}px`;

        if (idx === 0) {
            const startMarker = document.createElement('span');
            startMarker.className = 'gantt-time-start';
            startMarker.textContent = block.start;
            blockElem.appendChild(startMarker);
        }

        const endMarker = document.createElement('span');
        endMarker.className = 'gantt-time-end';
        endMarker.textContent = block.end;
        blockElem.appendChild(endMarker);

        chart.appendChild(blockElem);
    });

    wrapper.appendChild(chart);
}

// ==========================================================
// 📈 Real-Time CPU Monitor & Live Simulation Execution
// ==========================================================
function startLiveSimulation() {
    stopLiveSimulation();

    const processes = getProcessesFromTable();
    if (!processes || processes.length === 0) return;

    // Run scheduler logic to obtain reference timeline
    const result = runScheduler(true, true);
    if (!result) return;

    const monitorSection = document.getElementById('live-monitor-section');
    monitorSection.style.display = 'block';
    monitorSection.scrollIntoView({ behavior: 'smooth' });

    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'block';

    const quantum = parseInt(document.getElementById('time-quantum').value, 10) || 2;
    const ganttFull = result.gantt;
    const maxTime = ganttFull[ganttFull.length - 1].end;

    liveSimState = {
        currentTime: 0,
        maxTime: maxTime,
        ganttFull: ganttFull,
        processes: processes,
        liveGantt: [],
        paused: false,
        speed: parseInt(document.getElementById('live-speed').value, 10) || 500
    };

    updateDashboardCPUStatus(true);
    scheduleNextLiveTick();
}

function scheduleNextLiveTick() {
    if (!liveSimState || liveSimState.paused) return;

    liveSimTimer = setTimeout(() => {
        executeLiveTick();
        if (liveSimState && liveSimState.currentTime <= liveSimState.maxTime) {
            scheduleNextLiveTick();
        } else {
            stopLiveSimulation();
        }
    }, liveSimState.speed);
}

function executeLiveTick() {
    if (!liveSimState) return;

    const t = liveSimState.currentTime;
    const fullGantt = liveSimState.ganttFull;

    // Find active block at time t
    let activeBlock = fullGantt.find(b => t >= b.start && t < b.end);
    if (!activeBlock && t === liveSimState.maxTime) {
        activeBlock = fullGantt[fullGantt.length - 1];
    }

    const coreElem = document.getElementById('live-cpu-core');
    const timeElem = document.getElementById('live-sim-time');
    const queueElem = document.getElementById('live-ready-queue');
    const utilElem = document.getElementById('live-cpu-util-val');

    timeElem.textContent = `T = ${t}`;

    if (activeBlock && activeBlock.id !== 'IDLE') {
        coreElem.textContent = `RUNNING P${activeBlock.id}`;
        coreElem.className = 'm-val status-busy';
    } else {
        coreElem.textContent = 'IDLE';
        coreElem.className = 'm-val status-idle';
    }

    // Build ready queue representation at time t
    const readyPids = liveSimState.processes
        .filter(p => p.arrival <= t && p.completion > t)
        .map(p => `P${p.id}`);
    queueElem.textContent = readyPids.length > 0 ? `[ ${readyPids.join(', ')} ]` : '[ Empty ]';

    // Build partial gantt up to time t
    const partialGantt = [];
    for (let i = 0; i < fullGantt.length; i++) {
        const b = fullGantt[i];
        if (b.start < t) {
            partialGantt.push({
                id: b.id,
                start: b.start,
                end: Math.min(b.end, t)
            });
        }
    }
    if (partialGantt.length > 0) {
        renderGanttChart(partialGantt);
        const busySoFar = partialGantt.filter(b => b.id !== 'IDLE').reduce((s, b) => s + (b.end - b.start), 0);
        const utilSoFar = t > 0 ? (busySoFar / t) * 100 : 100;
        utilElem.textContent = `${utilSoFar.toFixed(1)}%`;
    }

    liveSimState.currentTime++;
}

function toggleLivePause() {
    if (!liveSimState) return;
    const btn = document.getElementById('btn-live-pause');
    liveSimState.paused = !liveSimState.paused;
    if (liveSimState.paused) {
        btn.textContent = '▶ Resume';
        clearTimeout(liveSimTimer);
    } else {
        btn.textContent = '⏸ Pause';
        scheduleNextLiveTick();
    }
}

function stepLiveSimulation() {
    if (!liveSimState) {
        startLiveSimulation();
        return;
    }
    liveSimState.paused = true;
    document.getElementById('btn-live-pause').textContent = '▶ Resume';
    executeLiveTick();
}

function stopLiveSimulation() {
    if (liveSimTimer) clearTimeout(liveSimTimer);
    liveSimTimer = null;
    liveSimState = null;
    updateDashboardCPUStatus(false);
    const coreElem = document.getElementById('live-cpu-core');
    if (coreElem) {
        coreElem.textContent = 'IDLE';
        coreElem.className = 'm-val status-idle';
    }
}

// ==========================================================
// ⚡ Algorithm Comparison & 🏆 Best Algorithm Recommendation
// ==========================================================
function compareAllAlgorithms() {
    const processes = getProcessesFromTable();
    if (!processes || processes.length === 0) return;

    const n = processes.length;
    const quantumInput = document.getElementById('time-quantum');
    const quantum = parseInt(quantumInput.value, 10) || 2;
    const agingEnabled = document.getElementById('chk-enable-aging').checked;
    const agingInterval = parseInt(document.getElementById('aging-interval').value, 10) || 3;

    const algos = [
        { key: 'fcfs', name: 'FCFS', runner: () => runFCFS(JSON.parse(JSON.stringify(processes)), n) },
        { key: 'sjf', name: 'SJF Non-Preemptive', runner: () => runSJF(JSON.parse(JSON.stringify(processes)), n) },
        { key: 'srtf', name: 'SRTF', runner: () => runSRTF(JSON.parse(JSON.stringify(processes)), n) },
        { key: 'rr', name: `Round Robin (q=${quantum})`, runner: () => runRoundRobin(JSON.parse(JSON.stringify(processes)), n, quantum) },
        { key: 'priority-np', name: 'Priority Non-Preemptive', runner: () => runPriorityNonPreemptive(JSON.parse(JSON.stringify(processes)), n, agingEnabled, agingInterval) },
        { key: 'priority-p', name: 'Priority Preemptive', runner: () => runPriorityPreemptive(JSON.parse(JSON.stringify(processes)), n, agingEnabled, agingInterval) }
    ];

    const results = [];

    algos.forEach(item => {
        const out = item.runner();
        const met = computeExtraMetrics(out.processes, out.gantt);
        results.push({
            key: item.key,
            name: item.name,
            avgWT: met.avgWT,
            avgTAT: met.avgTAT,
            avgRT: met.avgRT,
            contextSwitches: met.contextSwitches,
            cpuUtil: met.cpuUtilization
        });
    });

    // 🏆 Determine best algorithm (Lowest Avg Waiting Time, then Lowest Avg TAT)
    let best = results[0];
    results.forEach(r => {
        if (r.avgWT < best.avgWT || (r.avgWT === best.avgWT && r.avgTAT < best.avgTAT)) {
            best = r;
        }
    });

    // Render comparison table
    const tbody = document.getElementById('comparison-table-body');
    tbody.innerHTML = '';

    results.forEach(r => {
        const isWinner = r.key === best.key;
        const tr = document.createElement('tr');
        if (isWinner) tr.className = 'winner-row';

        tr.innerHTML = `
            <td><strong>${r.name}</strong></td>
            <td>${r.avgWT.toFixed(2)}</td>
            <td>${r.avgTAT.toFixed(2)}</td>
            <td>${r.avgRT.toFixed(2)}</td>
            <td>${r.contextSwitches}</td>
            <td>${r.cpuUtil.toFixed(1)}%</td>
            <td>${isWinner ? '<span class="badge-winner">🏆 Winner</span>' : 'Standard'}</td>
        `;
        tbody.appendChild(tr);
    });

    // Recommendation card
    const card = document.getElementById('best-algo-card');
    document.getElementById('best-algo-title').textContent = best.name;
    document.getElementById('best-algo-reason').textContent = 
        `Achieves lowest Average Waiting Time (${best.avgWT.toFixed(2)} units) and Average Turnaround Time (${best.avgTAT.toFixed(2)} units) with ${best.contextSwitches} context switches.`;
    card.style.display = 'flex';

    document.getElementById('comparison-section').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================================
// 📋 Process Run History
// ==========================================================
function recordHistory(algoKey, processes, metrics) {
    const runNum = simulationHistory.length + 1;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const record = {
        run: runNum,
        time: timeStr,
        algo: ALGO_INFO[algoKey].name.split(' ')[0],
        procs: processes.length,
        avgWT: metrics ? metrics.avgWT.toFixed(2) : '0.00',
        avgTAT: metrics ? metrics.avgTAT.toFixed(2) : '0.00',
        avgRT: metrics ? metrics.avgRT.toFixed(2) : '0.00',
        switches: metrics ? metrics.contextSwitches : 0,
        util: metrics ? `${metrics.cpuUtilization.toFixed(1)}%` : '100%'
    };

    simulationHistory.unshift(record);
    if (simulationHistory.length > 20) simulationHistory.pop(); // Keep last 20
    saveHistoryToStorage();
    renderHistoryTable();
}

function renderHistoryTable() {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    if (simulationHistory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="color: #718096; padding: 16px;">No simulation history logged yet. Run a scheduler to record data.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    simulationHistory.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${r.run}</td>
            <td>${r.time}</td>
            <td><strong>${r.algo}</strong></td>
            <td>${r.procs}</td>
            <td>${r.avgWT}</td>
            <td>${r.avgTAT}</td>
            <td>${r.avgRT}</td>
            <td>${r.switches}</td>
            <td>${r.util}</td>
        `;
        tbody.appendChild(tr);
    });
}

function clearHistory() {
    simulationHistory = [];
    localStorage.removeItem('cpu_scheduler_history');
    renderHistoryTable();
}

function saveHistoryToStorage() {
    try {
        localStorage.setItem('cpu_scheduler_history', JSON.stringify(simulationHistory));
    } catch(e) {}
}

function loadHistoryFromStorage() {
    try {
        const stored = localStorage.getItem('cpu_scheduler_history');
        if (stored) {
            simulationHistory = JSON.parse(stored);
            renderHistoryTable();
        }
    } catch(e) {}
}

// ==========================================================
// Dashboard and Info Helpers
// ==========================================================
function updateDashboardBar() {
    const num = document.getElementById('num-processes').value;
    document.getElementById('dash-proc-count').textContent = num;
    document.getElementById('dash-active-algo').textContent = ALGO_INFO[currentAlgorithm].name.split(' ')[0];
}

function updateDashboardCPUStatus(isBusy) {
    const elem = document.getElementById('dash-cpu-status');
    if (isBusy) {
        elem.textContent = 'Active Execution';
        elem.className = 'dash-val status-busy';
    } else {
        elem.textContent = 'Ready';
        elem.className = 'dash-val status-idle';
    }
}

function updateAlgorithmInfo(algoKey) {
    const info = ALGO_INFO[algoKey] || ALGO_INFO['fcfs'];
    document.getElementById('info-algo-name').textContent = info.name;
    document.getElementById('info-algo-type').textContent = info.type;
    document.getElementById('info-algo-desc').textContent = info.desc;
}

/**
 * Reset all fields back to initial state
 */
function resetAll() {
    stopLiveSimulation();

    document.getElementById('num-processes').value = 4;
    setupProcessRows(4, SAMPLE_PROCESSES);

    const algoButtons = document.querySelectorAll('.btn-algo');
    algoButtons.forEach(b => b.classList.remove('active'));
    algoButtons[0].classList.add('active');
    currentAlgorithm = 'fcfs';

    const quantumBox = document.getElementById('quantum-container');
    quantumBox.style.display = 'none';
    document.getElementById('time-quantum').value = 2;

    document.getElementById('results-section').style.display = 'none';
    document.getElementById('live-monitor-section').style.display = 'none';
    document.getElementById('results-table-body').innerHTML = '';
    document.getElementById('gantt-chart-wrapper').innerHTML = '';
    document.getElementById('starvation-alert-box').style.display = 'none';

    document.getElementById('avg-wt-value').textContent = '0.00';
    document.getElementById('avg-tat-value').textContent = '0.00';
    document.getElementById('avg-rt-value').textContent = '0.00';
    document.getElementById('context-switch-value').textContent = '0';
    document.getElementById('cpu-util-metric-val').textContent = '100%';

    updateDashboardBar();
    analyzeWorkloadAndRecommend();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

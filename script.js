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
        runScheduler(false, true);
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

    // Speed selector change (updates running simulation speed immediately)
    const speedSelect = document.getElementById('live-speed');
    if (speedSelect) {
        speedSelect.addEventListener('change', (e) => {
            const newSpeed = parseInt(e.target.value, 10) || 1000;
            if (liveSimState) {
                liveSimState.speed = newSpeed;
                if (!liveSimState.paused) {
                    clearTimeout(liveSimTimer);
                    scheduleNextLiveTick();
                }
            }
        });
    }
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
            currentPriority: priority,
            remaining: burst,
            completion: 0,
            turnaround: 0,
            waiting: 0,
            responseTime: -1,
            firstExecuted: -1,
            ageCounter: 0,
            agingEvents: []
        });
    }

    return processes;
}

/**
 * 🤖 Smart Algorithm Selector (USP Feature)
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
    const arrivalSpread = Math.max(...arrivals) - Math.min(...arrivals);
    const prioVarText = uniquePriorities > 1 ? (uniquePriorities >= n * 0.5 ? 'High' : 'Moderate') : 'None (Equal)';
    const arrVarText = arrivalSpread > 3 ? 'High' : (arrivalSpread > 0 ? 'Low' : 'Zero (Simultaneous)');

    let recommendedAlgo = 'srtf';
    let reasons = [];
    let suggestedQuantum = Math.max(2, Math.round(avgBurst * 0.75));

    if (uniquePriorities > 1 && uniquePriorities >= n * 0.5) {
        recommendedAlgo = 'priority-p';
        reasons = [
            'Distinct priorities detected across processes',
            'Preemptive priority ensures urgent jobs execute immediately',
            'Aging mechanism prevents lower priority starvation'
        ];
    } else if (cv > 0.4) {
        recommendedAlgo = 'srtf';
        reasons = [
            'High variance in burst times detected (short and long jobs mixed)',
            'Prevents convoy effect caused by long-running processes',
            'Guarantees minimal average waiting and turnaround time'
        ];
    } else if (cv <= 0.2 && arrivalSpread === 0) {
        recommendedAlgo = 'fcfs';
        reasons = [
            'Uniform burst times with simultaneous arrivals',
            'Zero context-switch overhead',
            'Optimal CPU throughput with maximum scheduling simplicity'
        ];
    } else {
        recommendedAlgo = 'rr';
        reasons = [
            `Balanced mixed workload with time-sharing requirements`,
            `Guarantees fair CPU share with optimal response time`,
            `Suggested Time Quantum = ${suggestedQuantum} units`
        ];
    }

    // Update workload stats display
    document.getElementById('smart-n-procs').textContent = n;
    document.getElementById('smart-avg-burst').textContent = avgBurst.toFixed(1);
    document.getElementById('smart-prio-var').textContent = prioVarText;
    document.getElementById('smart-arr-var').textContent = arrVarText;
    document.getElementById('smart-rec-name').textContent = ALGO_INFO[recommendedAlgo].name.split(' ')[0];

    const reasonsList = document.getElementById('smart-rec-reasons-list');
    reasonsList.innerHTML = reasons.map(r => `<li>${r}</li>`).join('');

    document.getElementById('dash-smart-suggest').textContent = ALGO_INFO[recommendedAlgo].name.split(' ')[0];

    return { algo: recommendedAlgo, quantum: suggestedQuantum, reasons: reasons };
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

// ==========================================================
// CORE SCHEDULING ENGINE (Step-by-Step with Accurate Ready Queue)
// ==========================================================
function simulateSchedule(rawProcesses, algo, quantum = 2, agingEnabled = false, agingInterval = 3) {
    const n = rawProcesses.length;
    let p = JSON.parse(JSON.stringify(rawProcesses));

    for (let i = 0; i < n; i++) {
        p[i].currentPriority = p[i].priority;
        p[i].remaining = p[i].burst;
        p[i].completion = 0;
        p[i].turnaround = 0;
        p[i].waiting = 0;
        p[i].responseTime = -1;
        p[i].firstExecuted = -1;
        p[i].ageCounter = 0;
        p[i].agingEvents = [];
    }

    let t = 0;
    let completed = 0;
    let running = null;
    let runSlice = 0;
    let rrQueue = [];
    let rrAdded = new Array(n).fill(0);

    const gantt = [];
    const timeSteps = []; // Records state at each integer time tick t

    // For Round Robin, enqueue processes arriving at t = 0
    if (algo === 'rr') {
        for (let i = 0; i < n; i++) {
            if (p[i].arrival === 0) {
                rrQueue.push(p[i]);
                rrAdded[i] = 1;
            }
        }
    }

    // Safety loop bound
    const MAX_STEPS = 5000;
    let stepCount = 0;

    while (completed < n && stepCount < MAX_STEPS) {
        stepCount++;

        // 1. Enqueue new arrivals for RR (except running process)
        if (algo === 'rr') {
            for (let i = 0; i < n; i++) {
                if (rrAdded[i] === 0 && p[i].arrival <= t && p[i].remaining > 0 && p[i] !== running) {
                    rrQueue.push(p[i]);
                    rrAdded[i] = 1;
                }
            }
        }

        // 2. Apply Aging mechanism to waiting processes
        if (agingEnabled && agingInterval > 0 && (algo === 'priority-np' || algo === 'priority-p')) {
            for (let i = 0; i < n; i++) {
                if (p[i].arrival <= t && p[i].remaining > 0 && p[i] !== running) {
                    p[i].ageCounter++;
                    if (p[i].ageCounter >= agingInterval) {
                        if (p[i].currentPriority > 1) {
                            const oldPr = p[i].currentPriority;
                            p[i].currentPriority--;
                            p[i].agingEvents.push({ time: t, oldPr: oldPr, newPr: p[i].currentPriority });
                        }
                        p[i].ageCounter = 0;
                    }
                }
            }
        }

        // 3. Selection of running process for time t
        if (algo === 'fcfs') {
            if (!running || running.remaining === 0) {
                const available = p.filter(proc => proc.arrival <= t && proc.remaining > 0);
                available.sort((a, b) => a.arrival - b.arrival || a.id - b.id);
                running = available.length > 0 ? available[0] : null;
            }
        } else if (algo === 'sjf') {
            if (!running || running.remaining === 0) {
                const available = p.filter(proc => proc.arrival <= t && proc.remaining > 0);
                available.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || a.id - b.id);
                running = available.length > 0 ? available[0] : null;
            }
        } else if (algo === 'srtf') {
            const available = p.filter(proc => proc.arrival <= t && proc.remaining > 0);
            available.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival || a.id - b.id);
            running = available.length > 0 ? available[0] : null;
        } else if (algo === 'rr') {
            if (!running || runSlice >= quantum || running.remaining === 0) {
                if (running && running.remaining > 0) {
                    rrQueue.push(running);
                }
                running = rrQueue.length > 0 ? rrQueue.shift() : null;
                runSlice = 0;
            }
        } else if (algo === 'priority-np') {
            if (!running || running.remaining === 0) {
                const available = p.filter(proc => proc.arrival <= t && proc.remaining > 0);
                available.sort((a, b) => a.currentPriority - b.currentPriority || a.arrival - b.arrival || a.id - b.id);
                running = available.length > 0 ? available[0] : null;
            }
        } else if (algo === 'priority-p') {
            const available = p.filter(proc => proc.arrival <= t && proc.remaining > 0);
            available.sort((a, b) => a.currentPriority - b.currentPriority || a.arrival - b.arrival || a.id - b.id);
            running = available.length > 0 ? available[0] : null;
        }

        // 4. Build Ready Queue snapshot at time t (waiting processes, ordered)
        let readyQueueSnap = [];
        if (algo === 'rr') {
            readyQueueSnap = rrQueue.map(proc => ({ id: proc.id, remaining: proc.remaining, priority: proc.currentPriority }));
        } else {
            const waitingProcs = p.filter(proc => proc.arrival <= t && proc.remaining > 0 && proc !== running);
            if (algo === 'sjf' || algo === 'srtf') {
                waitingProcs.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);
            } else if (algo === 'priority-np' || algo === 'priority-p') {
                waitingProcs.sort((a, b) => a.currentPriority - b.currentPriority || a.arrival - b.arrival);
            } else {
                waitingProcs.sort((a, b) => a.arrival - b.arrival || a.id - b.id);
            }
            readyQueueSnap = waitingProcs.map(proc => ({ id: proc.id, remaining: proc.remaining, priority: proc.currentPriority }));
        }

        const activeId = running ? running.id : 'IDLE';

        // 5. Update Gantt Chart blocks
        let ganttSegmentIndex = 0;
        if (gantt.length === 0 || gantt[gantt.length - 1].id !== activeId) {
            gantt.push({ id: activeId, start: t, end: t + 1 });
        } else {
            gantt[gantt.length - 1].end = t + 1;
        }
        ganttSegmentIndex = gantt.length - 1;

        // Build process array memory snapshot for Process p[50]
        const pArraySnap = p.map((proc, idx) => {
            let status = 'NOT_ARRIVED';
            if (proc.arrival <= t) {
                if (proc.remaining === 0) {
                    status = 'COMPLETED';
                } else if (running && proc.id === running.id) {
                    status = 'RUNNING';
                } else {
                    status = 'WAITING';
                }
            }
            return {
                index: idx,
                id: proc.id,
                arrival: proc.arrival,
                burst: proc.burst,
                remaining: proc.remaining,
                priority: proc.currentPriority,
                status: status
            };
        });

        // Generate specific DS operations explanation and caption
        let dsActionCaption = '';
        let queueOpMessage = '';
        if (algo === 'rr') {
            const qPids = rrQueue.map(item => `P${item.id}`);
            if (running) {
                dsActionCaption = `FIFO Queue Dispatch: queue[front] dequeued to CPU register. Executing P${running.id} (remaining: ${running.remaining}, slice: ${runSlice + 1}/${quantum}).`;
                queueOpMessage = `FIFO Status: front=${0}, rear=${rrQueue.length}. Next in queue: ${qPids.length > 0 ? qPids.join(' -> ') : 'None'}.`;
            } else {
                dsActionCaption = `CPU IDLE: No processes ready in queue[front]. Awaiting arrivals.`;
                queueOpMessage = `FIFO Status: Queue empty (front = rear = 0).`;
            }
        } else if (algo === 'sjf' || algo === 'srtf') {
            if (running) {
                const metricName = algo === 'sjf' ? 'burst' : 'remaining';
                dsActionCaption = `Array Traversal p[0..${n-1}]: Found min ${metricName} time -> Selected p[${running.id - 1}] (P${running.id}, ${metricName}: ${running.remaining}).`;
            } else {
                dsActionCaption = `Array Traversal p[0..${n-1}]: No arrived processes with remaining > 0 at T=${t}. CPU IDLE.`;
            }
        } else if (algo === 'priority-np' || algo === 'priority-p') {
            if (running) {
                dsActionCaption = `Array Traversal p[0..${n-1}]: Selected p[${running.id - 1}] (P${running.id}) with highest priority (value: ${running.currentPriority}).`;
            } else {
                dsActionCaption = `Array Traversal: No ready process. CPU IDLE at T=${t}.`;
            }
        } else {
            // FCFS
            if (running) {
                dsActionCaption = `Linear Selection: p[${running.id - 1}] (P${running.id}) has earliest arrival (${running.arrival}). Dispatched to CPU.`;
            } else {
                dsActionCaption = `Linear Search: No process has arrived yet at T=${t}. CPU IDLE.`;
            }
        }

        // 6. Record step snapshot for Real-Time CPU Monitor & Live DS Visualization
        timeSteps.push({
            t: t,
            runningId: activeId,
            runningRemaining: running ? running.remaining : 0,
            runningSlice: runSlice + 1,
            quantum: quantum,
            readyQueue: readyQueueSnap,
            pArray: pArraySnap,
            dsActionCaption: dsActionCaption,
            queueOpMessage: queueOpMessage,
            ganttCount: ganttSegmentIndex,
            ganttEntry: { id: activeId, start: gantt[ganttSegmentIndex].start, end: t + 1 }
        });

        // 7. Execute 1 time unit
        if (running) {
            if (running.firstExecuted === -1) {
                running.firstExecuted = t;
            }
            running.remaining--;
            runSlice++;

            if (running.remaining === 0) {
                running.completion = t + 1;
                running.turnaround = running.completion - running.arrival;
                running.waiting = running.turnaround - running.burst;
                running.responseTime = running.firstExecuted - running.arrival;
                completed++;
                running = null;
                runSlice = 0;
            }
        }

        t++;
    }

    p.sort((a, b) => a.id - b.id);

    return {
        processes: p,
        gantt: gantt,
        timeSteps: timeSteps,
        totalTime: t
    };
}

/**
 * Main Run Scheduler Handler
 */
function runScheduler(isLive = false, logHistory = true) {
    const rawProcesses = getProcessesFromTable();
    if (!rawProcesses || rawProcesses.length === 0) return null;

    const quantumInput = document.getElementById('time-quantum');
    const quantum = parseInt(quantumInput.value, 10) || 2;
    const agingEnabled = document.getElementById('chk-enable-aging').checked;
    const agingInterval = parseInt(document.getElementById('aging-interval').value, 10) || 3;
    const starvationThreshold = parseInt(document.getElementById('starvation-threshold').value, 10) || 10;

    const result = simulateSchedule(rawProcesses, currentAlgorithm, quantum, agingEnabled, agingInterval);

    // Compute metrics
    const metrics = computeMetrics(result.processes, result.gantt);
    result.metrics = metrics;

    if (!isLive) {
        displayResults(result.processes, result.gantt, metrics, starvationThreshold);
        updateAlgorithmInfo(currentAlgorithm);

        const resultsSection = document.getElementById('results-section');
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        if (logHistory) {
            recordHistory(currentAlgorithm, result.processes, metrics);
        }

        // Also populate DS visualization with initial snapshot
        if (result.timeSteps && result.timeSteps.length > 0) {
            renderLiveDSVisualization(result.timeSteps[0]);
        }
    }

    return result;
}

/**
 * Metric computation
 */
function computeMetrics(processes, gantt) {
    let contextSwitches = 0;
    let prevId = null;
    const sequence = [];

    for (let i = 0; i < gantt.length; i++) {
        const currId = gantt[i].id;
        if (currId !== 'IDLE') {
            sequence.push(`P${currId}`);
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
        sequence: sequence,
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
// RESULTS DISPLAY & VISUAL CHARTS
// ==========================================================
function displayResults(processes, gantt, metrics, starvationThreshold = 10) {
    // 1. Results Table
    const tbody = document.getElementById('results-table-body');
    tbody.innerHTML = '';

    let starvedProcesses = [];
    processes.forEach(p => {
        const isStarved = p.waiting >= starvationThreshold || (p.waiting > p.burst * 2.5 && p.waiting >= 6);
        if (isStarved) {
            starvedProcesses.push({ id: p.id, wt: p.waiting, agingEvents: p.agingEvents });
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
            <td>${isStarved ? '<span class="status-starved">⚠️ Starvation</span>' : '<span class="status-ok">Completed</span>'}</td>
        `;
        tbody.appendChild(tr);
    });

    // 2. 🚨 Starvation Detection & Aging Box
    const starvationBox = document.getElementById('starvation-alert-box');
    const starvationMsg = document.getElementById('starvation-alert-msg');
    const agingBox = document.getElementById('aging-progression-box');
    const agingContent = document.getElementById('aging-progression-content');

    if (starvedProcesses.length > 0) {
        starvationBox.style.display = 'block';
        starvationMsg.innerHTML = starvedProcesses.map(sp => `
            <div><strong>Process P${sp.id}:</strong> Waiting Time = <strong>${sp.wt} units</strong> (Threshold: ${starvationThreshold} units) &bull; Status: <span class="status-starved">POSSIBLE STARVATION</span></div>
        `).join('');

        // Aging trace if events occurred
        const allAging = processes.filter(p => p.agingEvents && p.agingEvents.length > 0);
        if (allAging.length > 0) {
            agingBox.style.display = 'block';
            agingContent.innerHTML = allAging.map(p => `
                <div style="margin-top: 4px;">
                    <strong>P${p.id} (Initial Priority: ${p.priority}):</strong>
                    ${p.agingEvents.map(e => ` → [T=${e.time}: Boosted to ${e.newPr}]`).join('')}
                    → Successfully executed!
                </div>
            `).join('');
        } else {
            agingBox.style.display = 'none';
        }
    } else {
        starvationBox.style.display = 'none';
    }

    // 3. 🔄 Context Switch Trace Display
    const seqElem = document.getElementById('context-trace-sequence');
    const countElem = document.getElementById('context-trace-count');
    seqElem.textContent = metrics.sequence.length > 0 ? metrics.sequence.join(' → ') : 'None';
    countElem.textContent = metrics.contextSwitches;

    // 4. Summary Metrics
    document.getElementById('avg-wt-value').textContent = metrics.avgWT.toFixed(2);
    document.getElementById('avg-tat-value').textContent = metrics.avgTAT.toFixed(2);
    document.getElementById('avg-rt-value').textContent = metrics.avgRT.toFixed(2);
    document.getElementById('context-switch-value').textContent = metrics.contextSwitches;
    document.getElementById('cpu-util-metric-val').textContent = `${metrics.cpuUtilization.toFixed(1)}%`;

    // 5. 📊 CPU Utilization Graph (Dynamic Bar Chart)
    renderCPUUtilizationChart(processes, metrics.totalBusyTime, metrics.totalTimeline, metrics.cpuUtilization);

    // 6. Gantt Chart
    renderGanttChart(gantt);
}

/**
 * 📊 CPU Utilization Graph: Renders per-process & overall bar chart
 */
function renderCPUUtilizationChart(processes, totalBusy, totalTimeline, overallUtil, liveBusyMap = null) {
    const barsArea = document.getElementById('cpu-chart-bars');
    barsArea.innerHTML = '';

    const effectiveTimeline = totalTimeline > 0 ? totalTimeline : 1;

    // 1. Process Bars
    processes.forEach(p => {
        const busyTime = liveBusyMap ? (liveBusyMap[p.id] || 0) : p.burst;
        // Percentage of total CPU timeline occupied by this process
        const pct = ((busyTime / effectiveTimeline) * 100).toFixed(1);

        const col = document.createElement('div');
        col.className = 'chart-bar-col';

        const colorIndex = ((p.id - 1) % 8) + 1;
        col.innerHTML = `
            <div class="chart-bar-fill" style="height: ${Math.max(pct, 2)}%;">
                <span class="chart-bar-val">${pct}%</span>
            </div>
            <span class="chart-bar-label">P${p.id}</span>
        `;
        barsArea.appendChild(col);
    });

    // 2. Idle Bar
    const idleTime = Math.max(0, effectiveTimeline - totalBusy);
    const idlePct = ((idleTime / effectiveTimeline) * 100).toFixed(1);
    const idleCol = document.createElement('div');
    idleCol.className = 'chart-bar-col';
    idleCol.innerHTML = `
        <div class="chart-bar-fill bar-idle" style="height: ${Math.max(idlePct, 2)}%;">
            <span class="chart-bar-val">${idlePct}%</span>
        </div>
        <span class="chart-bar-label">Idle</span>
    `;
    barsArea.appendChild(idleCol);

    // 3. Overall CPU Bar
    const totalCol = document.createElement('div');
    totalCol.className = 'chart-bar-col';
    totalCol.innerHTML = `
        <div class="chart-bar-fill bar-total" style="height: ${Math.max(overallUtil.toFixed(1), 2)}%;">
            <span class="chart-bar-val">${overallUtil.toFixed(1)}%</span>
        </div>
        <span class="chart-bar-label">Total</span>
    `;
    barsArea.appendChild(totalCol);

    // Legend updates
    document.getElementById('util-percentage-text').textContent = `${overallUtil.toFixed(1)}%`;
    document.getElementById('util-busy-time').textContent = totalBusy;
    document.getElementById('util-idle-time').textContent = idleTime;
    document.getElementById('util-total-time').textContent = effectiveTimeline;
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
// 📈 REAL-TIME CPU MONITOR & LIVE SIMULATION
// ==========================================================
function startLiveSimulation() {
    stopLiveSimulation();

    // 1. Run full schedule simulation first to get all step snapshots
    const result = runScheduler(true, true);
    if (!result) return;

    const monitorSection = document.getElementById('live-monitor-section');
    monitorSection.style.display = 'block';
    monitorSection.scrollIntoView({ behavior: 'smooth' });

    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'block';

    const timeSteps = result.timeSteps;
    const processes = result.processes;
    const ganttFull = result.gantt;

    liveSimState = {
        stepIdx: 0,
        totalSteps: timeSteps.length,
        timeSteps: timeSteps,
        processes: processes,
        ganttFull: ganttFull,
        busyTicksSoFar: 0,
        liveBusyMap: {},
        paused: false,
        speed: parseInt(document.getElementById('live-speed').value, 10) || 1000
    };

    processes.forEach(p => { liveSimState.liveBusyMap[p.id] = 0; });

    updateDashboardCPUStatus(true);
    scheduleNextLiveTick();
}

function scheduleNextLiveTick() {
    if (!liveSimState || liveSimState.paused) return;

    liveSimTimer = setTimeout(() => {
        executeLiveTick();
        if (liveSimState && liveSimState.stepIdx < liveSimState.totalSteps) {
            scheduleNextLiveTick();
        } else {
            // Simulation finished
            stopLiveSimulation();
        }
    }, liveSimState.speed);
}

function executeLiveTick() {
    if (!liveSimState || liveSimState.stepIdx >= liveSimState.totalSteps) return;

    const step = liveSimState.timeSteps[liveSimState.stepIdx];
    const t = step.t;

    // 1. Update Simulation Clock
    document.getElementById('live-sim-time').textContent = `T = ${t}`;

    // 2. Update CPU Core State
    const coreElem = document.getElementById('live-cpu-core');
    if (step.runningId !== 'IDLE') {
        coreElem.textContent = `RUNNING P${step.runningId}`;
        coreElem.className = 'm-val status-busy';
        liveSimState.busyTicksSoFar++;
        liveSimState.liveBusyMap[step.runningId] = (liveSimState.liveBusyMap[step.runningId] || 0) + 1;
    } else {
        coreElem.textContent = 'IDLE';
        coreElem.className = 'm-val status-idle';
    }

    // 3. Update Ready Queue (FIXED: accurately displays waiting processes)
    const queueElem = document.getElementById('live-ready-queue');
    if (step.readyQueue && step.readyQueue.length > 0) {
        queueElem.innerHTML = step.readyQueue.map(p => `
            <span class="queue-badge" title="Burst: ${p.remaining}, Priority: ${p.priority}">
                P${p.id} <small>(rem:${p.remaining})</small>
            </span>
        `).join('');
    } else {
        queueElem.innerHTML = '<span class="queue-empty">[ Empty ]</span>';
    }

    // 4. Update Live CPU Utilization (FIXED: accurately computes live %)
    const liveTime = t + 1;
    const liveUtil = liveTime > 0 ? ((liveSimState.busyTicksSoFar / liveTime) * 100) : 100;
    document.getElementById('live-cpu-util-val').textContent = `${liveUtil.toFixed(1)}%`;

    // 5. Update CPU Utilization Bar Chart dynamically in real-time
    renderCPUUtilizationChart(
        liveSimState.processes,
        liveSimState.busyTicksSoFar,
        liveTime,
        liveUtil,
        liveSimState.liveBusyMap
    );

    // 6. Build and render partial Gantt Chart up to time t + 1
    const partialGantt = [];
    for (let i = 0; i < liveSimState.ganttFull.length; i++) {
        const b = liveSimState.ganttFull[i];
        if (b.start < liveTime) {
            partialGantt.push({
                id: b.id,
                start: b.start,
                end: Math.min(b.end, liveTime)
            });
        }
    }
    renderGanttChart(partialGantt);

    // 7. 🧠 Render Live Data Structures Visualization
    renderLiveDSVisualization(step);

    liveSimState.stepIdx++;
}

/**
 * 🧠 Render Data Structures Visualization for the current tick or state
 */
function renderLiveDSVisualization(step) {
    if (!step) return;

    // A. Update Algorithm Badge & Step Caption
    const algoBadge = document.getElementById('ds-algo-badge');
    if (algoBadge) {
        algoBadge.textContent = `ALGORITHM: ${currentAlgorithm.toUpperCase()}`;
    }

    const captionElem = document.getElementById('ds-step-caption');
    if (captionElem) {
        captionElem.innerHTML = step.dsActionCaption || `Processing at T=${step.t}`;
    }

    // B. Render Process Array Memory: Process p[50]
    const arrayGrid = document.getElementById('ds-array-grid');
    if (arrayGrid && step.pArray) {
        arrayGrid.innerHTML = step.pArray.map(item => {
            let statusClass = 'status-waiting';
            if (item.status === 'RUNNING') statusClass = 'status-running';
            else if (item.status === 'COMPLETED') statusClass = 'status-completed';
            else if (item.status === 'NOT_ARRIVED') statusClass = 'status-not-arrived';

            return `
                <div class="ds-array-cell ${statusClass}" title="p[${item.index}] -> Process P${item.id}">
                    <div class="cell-index">p[${item.index}]</div>
                    <div class="cell-pid">P${item.id}</div>
                    <div class="cell-field"><span>AT:</span> <strong>${item.arrival}</strong></div>
                    <div class="cell-field"><span>BT:</span> <strong>${item.burst}</strong></div>
                    <div class="cell-field cell-rem"><span>REM:</span> <strong>${item.remaining}</strong></div>
                    <div class="cell-field"><span>PR:</span> <strong>${item.priority}</strong></div>
                    <div class="cell-status-tag">${item.status}</div>
                </div>
            `;
        }).join('');
    }

    // C. Render FIFO Ready Queue: int queue[500], front, rear
    const queueSection = document.getElementById('ds-queue-section');
    const frontVal = document.getElementById('ds-front-val');
    const rearVal = document.getElementById('ds-rear-val');
    const qItemsElem = document.getElementById('ds-queue-items');
    const qOpMsg = document.getElementById('ds-queue-op-msg');

    if (currentAlgorithm === 'rr') {
        if (queueSection) queueSection.style.display = 'block';
        const qCount = step.readyQueue ? step.readyQueue.length : 0;
        if (frontVal) frontVal.textContent = '0';
        if (rearVal) rearVal.textContent = qCount.toString();

        if (qItemsElem) {
            if (step.readyQueue && step.readyQueue.length > 0) {
                qItemsElem.innerHTML = step.readyQueue.map((item, idx) => `
                    <div class="ds-q-item">
                        <span class="q-slot-idx">[${idx}]</span>
                        <span class="q-val">P${item.id}</span>
                        <span class="q-meta">rem:${item.remaining}</span>
                    </div>
                `).join('');
            } else {
                qItemsElem.innerHTML = '<span class="queue-empty">[ FIFO Queue is empty: front == rear ]</span>';
            }
        }
        if (qOpMsg) {
            qOpMsg.innerHTML = step.queueOpMessage || `front = 0, rear = ${qCount}`;
        }
    } else {
        // For non-RR algorithms, ready queue displays priority or linear order
        if (queueSection) queueSection.style.display = 'block';
        if (frontVal) frontVal.textContent = '0';
        if (rearVal) rearVal.textContent = (step.readyQueue ? step.readyQueue.length : 0).toString();

        if (qItemsElem) {
            if (step.readyQueue && step.readyQueue.length > 0) {
                qItemsElem.innerHTML = step.readyQueue.map((item, idx) => `
                    <div class="ds-q-item">
                        <span class="q-slot-idx">[${idx}]</span>
                        <span class="q-val">P${item.id}</span>
                        <span class="q-meta">${currentAlgorithm.includes('priority') ? `pr:${item.priority}` : `rem:${item.remaining}`}</span>
                    </div>
                `).join('');
            } else {
                qItemsElem.innerHTML = '<span class="queue-empty">[ Ready Queue empty: No processes waiting ]</span>';
            }
        }
        if (qOpMsg) {
            qOpMsg.innerHTML = `Array Order: ${step.readyQueue && step.readyQueue.length > 0 ? step.readyQueue.map(p => 'P' + p.id).join(' -> ') : 'None'}`;
        }
    }

    // D. Update CPU Execution Register
    const execPidElem = document.getElementById('ds-exec-pid');
    const execDetailsElem = document.getElementById('ds-exec-details');
    if (execPidElem && execDetailsElem) {
        if (step.runningId !== 'IDLE') {
            execPidElem.textContent = `P${step.runningId} IN CPU`;
            execPidElem.className = 'exec-pid running';
            if (currentAlgorithm === 'rr') {
                execDetailsElem.innerHTML = `Remaining Time: <strong>${step.runningRemaining}</strong> | Slice: <strong>${step.runningSlice}/${step.quantum}</strong>`;
            } else {
                execDetailsElem.innerHTML = `Remaining Time: <strong>${step.runningRemaining}</strong> | Executing 1 unit`;
            }
        } else {
            execPidElem.textContent = 'CPU IDLE';
            execPidElem.className = 'exec-pid idle';
            execDetailsElem.textContent = 'No process dispatched to CPU at this time unit.';
        }
    }

    // E. Update Gantt Array Memory Write
    const ganttLogElem = document.getElementById('ds-gantt-log');
    if (ganttLogElem && step.ganttEntry) {
        const seg = step.ganttEntry;
        const countIdx = step.ganttCount !== undefined ? step.ganttCount : 0;
        const pidVal = seg.id === 'IDLE' ? -1 : seg.id;
        ganttLogElem.innerHTML = `
            <strong>Memory Update:</strong>
            <code>process[${countIdx}] = ${pidVal === -1 ? 'IDLE' : 'P' + pidVal}</code>; 
            <code>start[${countIdx}] = ${seg.start}</code>; 
            <code>count = ${countIdx + 1}</code>; (Duration: [${seg.start} ──► ${seg.end}])
        `;
    }
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
// ⚡ ALGORITHM COMPARISON & 🏆 BEST ALGORITHM
// ==========================================================
function compareAllAlgorithms() {
    const rawProcesses = getProcessesFromTable();
    if (!rawProcesses || rawProcesses.length === 0) return;

    const quantumInput = document.getElementById('time-quantum');
    const quantum = parseInt(quantumInput.value, 10) || 2;
    const agingEnabled = document.getElementById('chk-enable-aging').checked;
    const agingInterval = parseInt(document.getElementById('aging-interval').value, 10) || 3;

    const algos = [
        { key: 'fcfs', name: 'FCFS' },
        { key: 'sjf', name: 'SJF Non-Preemptive' },
        { key: 'srtf', name: 'SRTF' },
        { key: 'rr', name: `Round Robin (q=${quantum})` },
        { key: 'priority-np', name: 'Priority Non-Preemptive' },
        { key: 'priority-p', name: 'Priority Preemptive' }
    ];

    const results = [];

    algos.forEach(item => {
        const out = simulateSchedule(rawProcesses, item.key, quantum, agingEnabled, agingInterval);
        const met = computeMetrics(out.processes, out.gantt);
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

    // Best recommendation card
    const card = document.getElementById('best-algo-card');
    document.getElementById('best-algo-title').textContent = best.name;
    document.getElementById('best-algo-reason').textContent = 
        `Achieves the lowest Average Waiting Time (${best.avgWT.toFixed(2)} units) and Turnaround Time (${best.avgTAT.toFixed(2)} units) with ${best.cpuUtil.toFixed(1)}% CPU utilization and ${best.contextSwitches} context switches.`;
    card.style.display = 'flex';

    document.getElementById('comparison-section').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================================
// 📋 PROCESS RUN HISTORY
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
    if (simulationHistory.length > 20) simulationHistory.pop();
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
// DASHBOARD & HELPERS
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
    document.getElementById('best-algo-card').style.display = 'none';

    document.getElementById('avg-wt-value').textContent = '0.00';
    document.getElementById('avg-tat-value').textContent = '0.00';
    document.getElementById('avg-rt-value').textContent = '0.00';
    document.getElementById('context-switch-value').textContent = '0';
    document.getElementById('cpu-util-metric-val').textContent = '100%';

    updateDashboardBar();
    analyzeWorkloadAndRecommend();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

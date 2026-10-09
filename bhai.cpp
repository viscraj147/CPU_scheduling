#include <iostream>
using namespace std;



struct Process
{
    int id;
    int arrival;
    int burst;
    int priority;

    int remaining;
    int completion;
    int turnaround;
    int waiting;
};


void display(Process p[], int n)
{
    float totalWT = 0;
    float totalTAT = 0;

    
    cout << "PID\tAT\tBT\tPriority\tCT\tTAT\tWT\n";
   

    for(int i = 0; i < n; i++)
    {
        cout << "P" << p[i].id << "\t"
             << p[i].arrival << "\t"
             << p[i].burst << "\t"
             << p[i].priority << "\t\t"
             << p[i].completion << "\t"
             << p[i].turnaround << "\t"
             << p[i].waiting << endl;

        totalWT = totalWT + p[i].waiting;
        totalTAT = totalTAT + p[i].turnaround;
    }

   

    cout << "Average Waiting Time = "
         << totalWT / n << endl;

    cout << "Average Turnaround Time = "
         << totalTAT / n << endl;
}



void ganttChart(int process[], int start[], int count)
{
    cout << "\n\nGANTT CHART\n";

    cout << " ";

    for(int i = 0; i < count; i++)
    {
        cout << "--------";
    }

    cout << "-\n|";

    for(int i = 0; i < count; i++)
    {
        cout << "  P" << process[i] << "  |";
    }

    cout << "\n ";

    for(int i = 0; i < count; i++)
    {
        cout << "--------";
    }

    cout << "-\n";

    cout << start[0];

    for(int i = 0; i < count; i++)
    {
        cout << "\t" << start[i + 1];
    }

    cout << endl;
}



void FCFS(Process p[], int n)
{
    int time = 0;

    int process[100];
    int start[101];
    int count = 0;

    cout << "\n     FCFS     \n";

    for(int i = 0; i < n; i++)
    {
        if(time < p[i].arrival)
        {
            time = p[i].arrival;
        }

        process[count] = p[i].id;
        start[count] = time;
        count++;

        time = time + p[i].burst;

        p[i].completion = time;

        p[i].turnaround =
            p[i].completion - p[i].arrival;

        p[i].waiting =
            p[i].turnaround - p[i].burst;
    }

    start[count] = time;

    ganttChart(process, start, count);

    display(p, n);
}


void SJF(Process p[], int n)
{
    int time = 0;
    int completed = 0;

    int done[50];

    int process[100];
    int start[101];
    int count = 0;

    for(int i = 0; i < n; i++)
    {
        done[i] = 0;
    }

    cout << "\n     SJF NON-PREEMPTIVE     \n";

    while(completed < n)
    {
        int index = -1;
        int smallest = 9999;

        
        for(int i = 0; i < n; i++)
        {
            if(done[i] == 0 &&
               p[i].arrival <= time)
            {
                if(p[i].burst < smallest)
                {
                    smallest = p[i].burst;
                    index = i;
                }
            }
        }

        
        if(index == -1)
        {
            time++;
        }
        else
        {
            process[count] = p[index].id;
            start[count] = time;
            count++;

            time = time + p[index].burst;

            p[index].completion = time;

            p[index].turnaround =
                p[index].completion - p[index].arrival;

            p[index].waiting =
                p[index].turnaround - p[index].burst;

            done[index] = 1;
            completed++;
        }
    }

    start[count] = time;

    ganttChart(process, start, count);

    display(p, n);
}



void SRTF(Process p[], int n)
{
    int time = 0;
    int completed = 0;

    int process[500];
    int start[501];
    int count = 0;

    int lastProcess = -1;

    cout << "\n SRTF \n";

   
    for(int i = 0; i < n; i++)
    {
        p[i].remaining = p[i].burst;
    }

    while(completed < n)
    {
        int index = -1;
        int smallest = 9999;

       
        for(int i = 0; i < n; i++)
        {
            if(p[i].arrival <= time &&
               p[i].remaining > 0)
            {
                if(p[i].remaining < smallest)
                {
                    smallest = p[i].remaining;
                    index = i;
                }
            }
        }

        if(index == -1)
        {
            time++;
        }
        else
        {
            
            if(lastProcess != p[index].id)
            {
                process[count] = p[index].id;
                start[count] = time;
                count++;

                lastProcess = p[index].id;
            }

            p[index].remaining--;

            time++;

            if(p[index].remaining == 0)
            {
                p[index].completion = time;

                p[index].turnaround =
                    p[index].completion - p[index].arrival;

                p[index].waiting =
                    p[index].turnaround - p[index].burst;

                completed++;
            }
        }
    }

    start[count] = time;

    ganttChart(process, start, count);

    display(p, n);
}



void RoundRobin(Process p[], int n)
{
    int quantum;

    cout << "\nEnter Time Quantum: ";
    cin >> quantum;

    int queue[500];

    int front = 0;
    int rear = 0;

    int added[50];

    int process[500];
    int start[501];
    int count = 0;

    int time = 0;
    int completed = 0;

    cout << "\n     ROUND ROBIN     \n";

    
    for(int i = 0; i < n; i++)
    {
        p[i].remaining = p[i].burst;
        added[i] = 0;
    }


    for(int i = 0; i < n; i++)
    {
        if(p[i].arrival == 0)
        {
            queue[rear] = i;
            rear++;

            added[i] = 1;
        }
    }

    while(completed < n)
    {
      
        if(front == rear)
        {
            time++;

            for(int i = 0; i < n; i++)
            {
                if(added[i] == 0 &&
                   p[i].arrival <= time)
                {
                    queue[rear] = i;
                    rear++;

                    added[i] = 1;
                }
            }

            continue;
        }

        
        int index = queue[front];
        front++;

        int run;

        if(p[index].remaining > quantum)
        {
            run = quantum;
        }
        else
        {
            run = p[index].remaining;
        }

        process[count] = p[index].id;
        start[count] = time;
        count++;

        for(int i = 0; i < run; i++)
        {
            time++;

            p[index].remaining--;

            
            for(int j = 0; j < n; j++)
            {
                if(added[j] == 0 &&
                   p[j].arrival <= time)
                {
                    queue[rear] = j;
                    rear++;

                    added[j] = 1;
                }
            }
        }

       
        if(p[index].remaining == 0)
        {
            p[index].completion = time;

            p[index].turnaround =
                p[index].completion - p[index].arrival;

            p[index].waiting =
                p[index].turnaround - p[index].burst;

            completed++;
        }
        else
        {
            
            queue[rear] = index;
            rear++;
        }
    }

    start[count] = time;

    ganttChart(process, start, count);

    display(p, n);
}



void PriorityNonPreemptive(Process p[], int n)
{
    int time = 0;
    int completed = 0;

    int done[50];

    int process[100];
    int start[101];
    int count = 0;

    for(int i = 0; i < n; i++)
    {
        done[i] = 0;
    }

    cout << "\n     PRIORITY NON-PREEMPTIVE     \n";

    while(completed < n)
    {
        int index = -1;
        int bestPriority = 9999;

       
        for(int i = 0; i < n; i++)
        {
            if(done[i] == 0 &&
               p[i].arrival <= time)
            {
                if(p[i].priority < bestPriority)
                {
                    bestPriority = p[i].priority;
                    index = i;
                }
            }
        }

        if(index == -1)
        {
            time++;
        }
        else
        {
            process[count] = p[index].id;
            start[count] = time;
            count++;

            time = time + p[index].burst;

            p[index].completion = time;

            p[index].turnaround =
                p[index].completion - p[index].arrival;

            p[index].waiting =
                p[index].turnaround - p[index].burst;

            done[index] = 1;

            completed++;
        }
    }

    start[count] = time;

    ganttChart(process, start, count);

    display(p, n);
}



void PriorityPreemptive(Process p[], int n)
{
    int time = 0;
    int completed = 0;

    int process[500];
    int start[501];
    int count = 0;

    int lastProcess = -1;

    cout << "\n      PRIORITY PREEMPTIVE      \n";

    for(int i = 0; i < n; i++)
    {
        p[i].remaining = p[i].burst;
    }

    while(completed < n)
    {
        int index = -1;
        int bestPriority = 9999;

      
        for(int i = 0; i < n; i++)
        {
            if(p[i].arrival <= time &&
               p[i].remaining > 0)
            {
                if(p[i].priority < bestPriority)
                {
                    bestPriority = p[i].priority;
                    index = i;
                }
            }
        }

        if(index == -1)
        {
            time++;
        }
        else
        {
            if(lastProcess != p[index].id)
            {
                process[count] = p[index].id;
                start[count] = time;
                count++;

                lastProcess = p[index].id;
            }

            p[index].remaining--;

            time++;

            if(p[index].remaining == 0)
            {
                p[index].completion = time;

                p[index].turnaround =
                    p[index].completion - p[index].arrival;

                p[index].waiting =
                    p[index].turnaround - p[index].burst;

                completed++;
            }
        }
    }

    start[count] = time;

    ganttChart(process, start, count);

    display(p, n);
}



int main()
{
    Process p[50];

    int n;
    int choice;

  
    cout << "          SMART CPU PROCESS SCHEDULER\n";
   

    cout << "\nEnter number of processes: ";
    cin >> n;

   

    for(int i = 0; i < n; i++)
    {
        p[i].id = i + 1;

        cout << "\nEnter details for P" << i + 1 << endl;

        cout << "Arrival Time : ";
        cin >> p[i].arrival;

        cout << "Burst Time   : ";
        cin >> p[i].burst;

        cout << "Priority     : ";
        cin >> p[i].priority;
    }

   

    do
    {
        
        cout<<"                                               \n";
        cout << "              CPU SCHEDULER MENU          \n";
        cout<<"                                                \n";
      

        cout << "1. FCFS\n";
        cout << "2. SJF Non-Preemptive\n";
        cout << "3. SRTF\n";
        cout << "4. Round Robin\n";
        cout << "5. Priority Non-Preemptive\n";
        cout << "6. Priority Preemptive\n";
        cout << "7. Exit\n";

        cout << "\nEnter your choice: ";
        cin >> choice;

        switch(choice)
        {
            case 1:
                FCFS(p, n);
                break;

            case 2:
                SJF(p, n);
                break;

            case 3:
                SRTF(p, n);
                break;

            case 4:
                RoundRobin(p, n);
                break;

            case 5:
                PriorityNonPreemptive(p, n);
                break;

            case 6:
                PriorityPreemptive(p, n);
                break;

            case 7:
                cout << "\nProgram Ended.\n";
                break;

            default:
                cout << "\nInvalid Choice!\n";
        }

    } while(choice != 7);

    return 0;
}
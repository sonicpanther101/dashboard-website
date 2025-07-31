import React, { useState, useEffect } from 'react';
import '../../css/dashboard/Tasks.scss'; // Global CSS import

interface TaskDefinition {
  label: string;
  subtasks?: TaskDefinition[];
  editMode?: boolean;
  subtasksShown?: boolean;
  status?: number;
}

// Plain-text secrets (to be secured later)
const GIST_ID = 'e96f2fe262b3992d7767f4f630b52e8b';
const TOKEN = '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';

async function readUpdate(setTasks: React.Dispatch<React.SetStateAction<TaskDefinition[]>>) {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    const data = await res.json();
    const content = data.files['todo.json'].content;
    setTasks(JSON.parse(content));
  } catch (err) {
    console.error('Failed to read tasks:', err);
  }
}

async function writeUpdate(tasks: TaskDefinition[]) {
  try {
    function sanitize(task: TaskDefinition): TaskDefinition {
      return {
        label: task.label,
        status: task.status,
        subtasks: task.subtasks?.map(sanitize),
      };
    }
    const payload = JSON.stringify(
      tasks.map(sanitize),
      null,
      2
    );

    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Updated Gist',
        files: { 'todo.json': { content: payload } },
      }),
    });
  } catch (err) {
    console.error('Failed to write tasks:', err);
  }
}

const TaskItem: React.FC<{ task: TaskDefinition; index: number; path: number[]; tasks: TaskDefinition[]; setTasks: React.Dispatch<React.SetStateAction<TaskDefinition[]>>; }> = ({ task, index, path, tasks, setTasks }) => {
  // Generic updater for edits/status
  const updateAtPath = (updater: (t: TaskDefinition) => void) => {
    const newTasks = JSON.parse(JSON.stringify(tasks)) as TaskDefinition[];
    let current: any = newTasks;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].subtasks!;
    }
    updater(current[path[path.length - 1]]);
    setTasks(newTasks);
    writeUpdate(newTasks);
  };

  // Handle move up/down
  const move = (dir: -1 | 1) => {
    const newTasks = JSON.parse(JSON.stringify(tasks)) as TaskDefinition[];
    let parentArr: TaskDefinition[] = newTasks;
    if (path.length > 1) {
      for (let i = 0; i < path.length - 1; i++) {
        parentArr = parentArr[path[i]].subtasks!;
      }
    }
    const idx = path[path.length - 1];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= parentArr.length) return;
    [parentArr[idx], parentArr[newIdx]] = [parentArr[newIdx], parentArr[idx]];
    setTasks(newTasks);
    writeUpdate(newTasks);
  };

  const rowClass = index % 2 === 0 ? 'even-scroll' : 'odd-scroll';

  return (
    <div className={`tasks tasks-entry ${rowClass}`} style={{ paddingLeft: path.length * 16, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Move Up */}
        <button
          className="task-up"
          disabled={index === 0}
          onClick={() => move(-1)}
        >▲</button>

        {/* Move Down */}
        <button
          className="task-down"
          disabled={(() => {
            let siblingCount = tasks.length;
            if (path.length > 1) {
              let parentArr: TaskDefinition[] = tasks;
              for (let i = 0; i < path.length - 1; i++) {
                parentArr = parentArr[path[i]].subtasks!;
              }
              siblingCount = parentArr.length;
            }
            return index === siblingCount - 1;
          })()}
          onClick={() => move(1)}
        >▼</button>

        {/* Toggle Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <button
            className="toggle-subtasks"
            onClick={() => updateAtPath((t) => { t.subtasksShown = !t.subtasksShown; })}
          >
            {task.subtasksShown ? '▼' : '▶'}
          </button>
        )}

        {/* Edit Label */}
        {task.editMode ? (
          <input
            className="task-edit edit"
            autoFocus
            value={task.label}
            onChange={(e) => updateAtPath((t) => { t.label = e.target.value; })}
            onBlur={() => updateAtPath((t) => { t.editMode = false; })}
          />
        ) : (
          <span
            className="task-edit edit"
            onDoubleClick={() => updateAtPath((t) => { t.editMode = true; })}
            style={{ margin: '0 8px' }}
          >
            {task.label}
          </span>
        )}

        {/* Status */}
        {'status' in task ? (
          <input
            className="status-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={task.status}
            onChange={(e) => updateAtPath((t) => { t.status = Number(e.target.value); })}
          />
        ) : (
          <button
            className="status-add"
            onClick={() => updateAtPath((t) => { t.status = 0; })}
          >Add Status</button>
        )}

        {/* Add Subtask */}
        <button
          className="subtask-add"
          onClick={() => updateAtPath((t) => {
            t.subtasks = t.subtasks || [];
            t.subtasks.unshift({ label: '', editMode: true });
            t.subtasksShown = true;
          })}
        >
          +
        </button>

        {/* Delete */}
        <button
        className='task-delete'
          onClick={() => {
            const newTasks = JSON.parse(JSON.stringify(tasks)) as TaskDefinition[];
            let parentArr: TaskDefinition[] = newTasks;
            if (path.length > 1) {
              for (let i = 0; i < path.length - 1; i++) {
                parentArr = parentArr[path[i]].subtasks!;
              }
            }
            parentArr.splice(path[path.length - 1], 1);
            setTasks(newTasks);
            writeUpdate(newTasks);
          }}
        >✕</button>
      </div>

      {/* Render subtasks */}
      {task.subtasksShown && task.subtasks && task.subtasks.map((sub, i) => (
        <TaskItem key={i} task={sub} index={i} path={[...path, i]} tasks={tasks} setTasks={setTasks} />
      ))}
    </div>
  );
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    readUpdate(setTasks);
  }, []);

  const addTask = () => {
    if (!inputValue.trim()) return;
    const newTasks = [{ label: inputValue, subtasks: [], status: undefined }, ...tasks];
    setTasks(newTasks);
    setInputValue('');
    writeUpdate(newTasks);
  };

  return (
    <div className="dashboard">
      <div className="tasks" style={{ padding: 24 }}>
        <div>
          {tasks.map((task, i) => (
            <TaskItem key={i} task={task} index={i} path={[i]} tasks={tasks} setTasks={setTasks} />
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <button
            className="task-refresh"
            onClick={() => readUpdate(setTasks)}
          >↻ Refresh</button>
          <input
            type="text"
            placeholder="Enter task"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
            style={{ marginLeft: 8, padding: 4, width: '60%' }}
          />
          <button onClick={addTask} style={{ marginLeft: 4 }}>Add</button>
        </div>
      </div>
    </div>
  );
};

export default Tasks;

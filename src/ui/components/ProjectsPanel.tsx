import { useEffect } from 'react';
import { Save, FilePlus, Trash2 } from 'lucide-react';
import { useStore } from '../../state/store';

export function ProjectsPanel() {
  const {
    projects,
    projectName,
    projectId,
    source,
    setProjectName,
    saveProject,
    loadProject,
    removeProject,
    newProject,
    refreshProjects,
  } = useStore();

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project name"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => void saveProject()}
          disabled={!source}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
        >
          <Save size={15} /> Save
        </button>
        <button
          onClick={newProject}
          className="flex items-center justify-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          <FilePlus size={15} /> New
        </button>
      </div>

      {projects.length > 0 && (
        <ul className="space-y-1">
          {projects.map((p) => (
            <li
              key={p.id}
              className={`flex items-center gap-2 rounded border px-2 py-1 text-sm ${
                p.id === projectId ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'
              }`}
            >
              <button
                onClick={() => void loadProject(p.id)}
                className="min-w-0 flex-1 truncate text-left hover:text-violet-700"
                title={p.name}
              >
                {p.name}
              </button>
              <button
                onClick={() => void removeProject(p.id)}
                className="text-slate-400 hover:text-red-600"
                aria-label="Delete project"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

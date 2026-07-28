import { CalendarDays, CheckCircle2, Columns3, List, ListFilter, PanelRightClose, PanelRightOpen, Search } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { taskStatuses } from './taskDomain';
import { detailLabels, dueFilterLabels, priorityLabels, statusLabels, toolbarLabels } from './taskUiText';
import type { TaskFilters } from './taskTypes';

export type TaskViewMode = 'board' | 'list' | 'today' | 'completed';

export interface TaskToolbarProps {
  viewMode: TaskViewMode;
  searchInputRef: Ref<HTMLInputElement>;
  filters: TaskFilters;
  workspaceStatus: string;
  activeFilterLabels: string[];
  activeFilterCount: number;
  hasActiveFilters: boolean;
  showDetail: boolean;
  projects: string[];
  labelOptions: string[];
  hideCompleted: boolean;
  isMobileFiltersExpanded: boolean;
  bulkActions: ReactNode;
  onViewModeChange: (viewMode: TaskViewMode) => void;
  onFiltersChange: (filters: TaskFilters) => void;
  onClearFilters: () => void;
  onShowDetailChange: (showDetail: boolean, trigger?: HTMLElement) => void;
  onHideCompletedChange: (hideCompleted: boolean) => void;
  onMobileFiltersExpandedChange: (isMobileFiltersExpanded: boolean) => void;
}

export function TaskToolbar({
  viewMode,
  searchInputRef,
  filters,
  workspaceStatus,
  activeFilterLabels,
  activeFilterCount,
  hasActiveFilters,
  showDetail,
  projects,
  labelOptions,
  hideCompleted,
  isMobileFiltersExpanded,
  bulkActions,
  onViewModeChange,
  onFiltersChange,
  onClearFilters,
  onShowDetailChange,
  onHideCompletedChange,
  onMobileFiltersExpandedChange,
}: TaskToolbarProps) {
  return (
    <>
      <header className="toolbar workband-primary">
        <div className="view-switch" aria-label={toolbarLabels.viewSwitch}>
          <button className={viewMode === 'board' ? 'active' : ''} type="button" onClick={() => onViewModeChange('board')} aria-pressed={viewMode === 'board'}>
            <Columns3 size={16} />
            {toolbarLabels.board}
          </button>
          <button className={viewMode === 'list' ? 'active' : ''} type="button" onClick={() => onViewModeChange('list')} aria-pressed={viewMode === 'list'}>
            <List size={16} />
            {toolbarLabels.list}
          </button>
          <button className={viewMode === 'today' ? 'active' : ''} type="button" onClick={() => onViewModeChange('today')} aria-pressed={viewMode === 'today'}>
            <CalendarDays size={16} />
            {toolbarLabels.today}
          </button>
          <button className={viewMode === 'completed' ? 'active' : ''} type="button" onClick={() => onViewModeChange('completed')} aria-pressed={viewMode === 'completed'}>
            <CheckCircle2 size={16} />
            {toolbarLabels.completed}
          </button>
        </div>
        <div className="search-box">
          <Search size={17} />
          <input
            ref={searchInputRef}
            aria-label={toolbarLabels.search}
            value={filters.search ?? ''}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            placeholder={toolbarLabels.searchPlaceholder}
          />
        </div>
        <div className="workspace-status" aria-label={toolbarLabels.status}>
          <strong>{workspaceStatus}</strong>
          <div className="filter-chips" aria-label={toolbarLabels.filterChips}>
            {activeFilterLabels.length ? activeFilterLabels.map((label) => <span key={label}>{label}</span>) : <span>{toolbarLabels.noFilters}</span>}
          </div>
          {hasActiveFilters && (
            <button className="clear-filter" type="button" onClick={onClearFilters}>
              {toolbarLabels.clearFilters}
            </button>
          )}
        </div>
        {showDetail ? (
          <button className="icon-button" type="button" onClick={() => onShowDetailChange(false)} aria-label={detailLabels.hide}>
            <PanelRightClose size={16} />
          </button>
        ) : (
          <button className="icon-button" type="button" onClick={(event) => onShowDetailChange(true, event.currentTarget)} aria-label={detailLabels.expand}>
            <PanelRightOpen size={16} />
          </button>
        )}
        <button
          className="mobile-filter-toggle"
          type="button"
          aria-expanded={isMobileFiltersExpanded}
          aria-controls="task-filter-strip"
          aria-label={toolbarLabels.filterToggle(isMobileFiltersExpanded, activeFilterCount)}
          onClick={() => onMobileFiltersExpandedChange(!isMobileFiltersExpanded)}
        >
          <ListFilter size={16} />
          <span>{toolbarLabels.filters}</span>
          {activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}
        </button>
      </header>

      {bulkActions}

      <div id="task-filter-strip" className={`filter-strip workband-filters ${isMobileFiltersExpanded ? 'mobile-expanded' : ''}`} aria-label={toolbarLabels.filters}>
        <select aria-label={toolbarLabels.statusFilter} value={filters.status} onChange={(event) => onFiltersChange({ ...filters, status: event.target.value as TaskFilters['status'] })}>
          <option value="all">{toolbarLabels.allStatuses}</option>
          {taskStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
        <select aria-label={toolbarLabels.priority} value={filters.priority} onChange={(event) => onFiltersChange({ ...filters, priority: event.target.value as TaskFilters['priority'] })}>
          <option value="all">{toolbarLabels.allPriorities}</option>
          {Object.entries(priorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select aria-label={toolbarLabels.due} value={filters.due} onChange={(event) => onFiltersChange({ ...filters, due: event.target.value as TaskFilters['due'] })}>
          {Object.entries(dueFilterLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select aria-label={toolbarLabels.project} value={filters.project} onChange={(event) => onFiltersChange({ ...filters, project: event.target.value })}>
          <option value="">{toolbarLabels.allProjects}</option>
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
        <select aria-label={toolbarLabels.label} value={filters.label} onChange={(event) => onFiltersChange({ ...filters, label: event.target.value })}>
          <option value="">{toolbarLabels.allLabels}</option>
          {labelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {hideCompleted ? (
          <button type="button" onClick={() => onHideCompletedChange(false)} aria-label={toolbarLabels.showCompleted}>
            {toolbarLabels.showCompleted}
          </button>
        ) : (
          <button type="button" onClick={() => onHideCompletedChange(true)} aria-label={toolbarLabels.hideCompleted}>
            {toolbarLabels.hideCompleted}
          </button>
        )}
      </div>
    </>
  );
}

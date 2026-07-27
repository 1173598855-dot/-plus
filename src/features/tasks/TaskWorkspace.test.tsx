import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { TaskWorkspace } from './TaskWorkspace';

function createDataTransfer() {
  return {
    data: new Map<string, string>(),
    effectAllowed: '',
    dropEffect: '',
    setData(type: string, value: string) {
      this.data.set(type, value);
    },
    getData(type: string) {
      return this.data.get(type) ?? '';
    },
  };
}

describe('TaskWorkspace', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filters tasks by project and label, then clears filters', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.selectOptions(screen.getByLabelText('按项目筛选'), '个人系统');
    await user.selectOptions(screen.getByLabelText('按标签筛选'), '个人');

    expect(screen.getByText('整理本周重点任务')).toBeInTheDocument();
    expect(screen.queryByText('任务管理库第一篇文档')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '清空筛选' }));

    expect(screen.getByText('整理本周重点任务')).toBeInTheDocument();
    expect(screen.getByText('任务管理库第一篇文档')).toBeInTheDocument();
  });

  it('toggles the mobile filter disclosure and reports active filter count', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const toggle = screen.getByRole('button', { name: '展开筛选（0）' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'task-filter-strip');
    expect(screen.getByLabelText('任务筛选')).not.toHaveClass('mobile-expanded');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('任务筛选')).toHaveClass('mobile-expanded');

    await user.selectOptions(screen.getByLabelText('按优先级筛选'), 'high');
    const expandedToggle = screen.getByRole('button', { name: '收起筛选（1）' });
    expect(expandedToggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(expandedToggle);
    expect(screen.getByRole('button', { name: '展开筛选（1）' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByLabelText('任务筛选')).not.toHaveClass('mobile-expanded');
  });

  it('renders one all option in the date filter', () => {
    render(<TaskWorkspace />);

    expect(within(screen.getByLabelText('按日期筛选')).getAllByRole('option', { name: '全部日期' })).toHaveLength(1);
  });

  it('creates a task and persists it to localStorage', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const quickAdd = within(screen.getByLabelText('新建任务'));

    await user.type(quickAdd.getByLabelText('任务标题'), '个人任务系统');
    await user.click(screen.getByRole('button', { name: '展开详细字段' }));
    await user.type(quickAdd.getByLabelText('预计用时（分钟）'), '45');
    await user.selectOptions(quickAdd.getByLabelText('精力类型'), 'high');
    await user.type(quickAdd.getByLabelText('项目'), '系统建设');
    await user.type(quickAdd.getByLabelText('标签'), '个人, 产品');
    await user.click(screen.getByRole('button', { name: /添加任务/ }));

    expect(screen.getByText('个人任务系统')).toBeInTheDocument();
    const createdTaskCard = screen.getByText('个人任务系统').closest('article');
    expect(createdTaskCard).not.toBeNull();
    expect(within(createdTaskCard as HTMLElement).getByText('45 分钟')).toBeInTheDocument();
    expect(within(createdTaskCard as HTMLElement).getByText('高精力')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('已创建任务“个人任务系统”。系统已持久化。');

    const stored = localStorage.getItem('personal-task-manager.tasks.v1');
    expect(stored).toContain('个人任务系统');
    expect(stored).toContain('"estimateMinutes":45');
    expect(stored).toContain('"energy":"high"');
    expect(stored).toContain('系统建设');
  });

  it('progressively discloses quick-add details', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    expect(screen.getByLabelText('任务标题')).toBeInTheDocument();
    expect(screen.queryByLabelText('任务备注')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: '展开详细字段' });
    const detailsId = 'quick-add-fields';
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', detailsId);

    await user.click(toggle);
    expect(screen.getByLabelText('任务备注')).toBeInTheDocument();
    expect(screen.getByLabelText('任务状态')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(detailsId)).toHaveAttribute('id', detailsId);

    await user.click(screen.getByRole('button', { name: '收起详细字段' }));
    expect(screen.queryByLabelText('任务备注')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps quick-add details expanded after creating a task', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '展开详细字段' }));
    await user.type(screen.getByLabelText('任务标题'), '保持展开的新任务');
    await user.click(screen.getByRole('button', { name: /添加任务/ }));

    expect(screen.getByRole('button', { name: '收起详细字段' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('任务备注')).toBeInTheDocument();
  });

  it('expands quick add and focuses its title with the n shortcut', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.keyboard('n');

    expect(await screen.findByLabelText('任务备注')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('任务标题')).toHaveFocus());
  });

  it('hides completed tasks from the working views when the toggle is enabled', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('等待反馈：下一步是否加入番茄钟'));
    await user.click(screen.getByRole('button', { name: '切换完成：等待反馈：下一步是否加入番茄钟' }));
    expect(screen.getByText('等待反馈：下一步是否加入番茄钟')).toBeInTheDocument();

    await user.click(screen.getByLabelText('隐藏已完成任务'));

    expect(screen.getByText('已筛选 2 / 3 个任务')).toBeInTheDocument();
    expect(screen.queryByText('等待反馈：下一步是否加入番茄钟')).not.toBeInTheDocument();
  });

  it('can complete selected tasks in bulk', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByLabelText('选择任务：整理本周重点任务'));
    await user.click(screen.getByLabelText('选择任务：任务管理库第一篇文档'));

    expect(screen.getByText('已选择 2 个任务')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '批量完成' }));
    await user.click(screen.getByRole('button', { name: '完成' }));

    expect(screen.getByLabelText('已完成任务')).toBeInTheDocument();
    expect(screen.getByText('整理本周重点任务')).toBeInTheDocument();
    expect(screen.queryByText('已选择 2 个任务')).not.toBeInTheDocument();
  });

  it('clears selected tasks that leave the visible task scope', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByLabelText('选择任务：整理本周重点任务'));
    expect(screen.getByText('已选择 1 个任务')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('按项目筛选'), '个人任务管理库');
    expect(screen.queryByText('已选择 1 个任务')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '清空筛选' }));
    expect(screen.queryByText('已选择 1 个任务')).not.toBeInTheDocument();
  });

  it('can delete selected tasks in bulk', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByLabelText('选择任务：整理本周重点任务'));
    await user.click(screen.getByLabelText('选择任务：任务管理库第一篇文档'));
    await user.click(screen.getByRole('button', { name: '批量删除' }));

    expect(screen.getByText('已删除 2 个任务。')).toBeInTheDocument();
    expect(screen.queryByText('整理本周重点任务')).not.toBeInTheDocument();
    expect(screen.queryByText('任务管理库第一篇文档')).not.toBeInTheDocument();
  });

  it('opens the detail drawer from a board card without squeezing the task canvas', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    expect(screen.queryByLabelText('任务详情')).not.toBeInTheDocument();
    expect(screen.getByLabelText('任务画布')).not.toHaveClass('detail-collapsed');

    await user.click(screen.getByText('任务管理库第一篇文档'));

    expect(screen.getByLabelText('任务详情')).toBeInTheDocument();
    expect(screen.getByLabelText('详情标题')).toHaveValue('任务管理库第一篇文档');
    expect(screen.getByLabelText('任务详情层')).toBeInTheDocument();
  });

  it('exposes modal drawer semantics, initial focus, and inert background', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('任务管理库第一篇文档'));

    const dialog = screen.getByRole('dialog', { name: '任务详情' });
    const headingId = dialog.getAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(headingId).toBeTruthy();
    expect(document.getElementById(headingId as string)).toHaveTextContent('任务详情');
    expect(screen.getByRole('button', { name: '关闭详情面板' })).toHaveFocus();
    expect(screen.getByLabelText('任务概览')).toHaveAttribute('inert');
    expect(screen.getByLabelText('工作台')).toHaveAttribute('inert');
    expect(dialog).not.toHaveAttribute('inert');
  });

  it('traps forward and reverse tab navigation inside the modal drawer', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('任务管理库第一篇文档'));
    const dialog = screen.getByRole('dialog', { name: '任务详情' });
    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])'),
    );
    const first = focusableElements[0];
    const last = focusableElements.at(-1);

    expect(first).toBe(screen.getByRole('button', { name: '关闭详情面板' }));
    expect(last).toBeDefined();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(last).toHaveFocus();
    last?.focus();
    await user.keyboard('{Tab}');
    expect(first).toHaveFocus();
  });

  it('blocks global shortcuts while the modal drawer is open', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('任务管理库第一篇文档'));
    const closeButton = screen.getByRole('button', { name: '关闭详情面板' });

    await user.keyboard('/n4');

    expect(closeButton).toHaveFocus();
    expect(screen.getByLabelText('状态看板')).toBeInTheDocument();
    expect(screen.queryByLabelText('任务备注')).not.toBeInTheDocument();
    expect(screen.getByLabelText('搜索任务')).not.toHaveFocus();
  });

  it('always closes an empty completed drawer', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '完成' }));
    await user.click(screen.getByRole('button', { name: '显示详情' }));
    expect(screen.getByRole('dialog', { name: '任务详情' })).toBeInTheDocument();
    expect(screen.getByText('还没有已完成的任务可查看。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '关闭详情面板' }));

    expect(screen.queryByRole('dialog', { name: '任务详情' })).not.toBeInTheDocument();
  });

  it('opens board details from the explicit keyboard control and restores its focus', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const trigger = screen.getByRole('button', { name: '查看详情：任务管理库第一篇文档' });
    const card = trigger.closest('article');

    expect(card).not.toHaveAttribute('role', 'button');
    expect(card).not.toHaveAttribute('tabindex');
    trigger.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('dialog', { name: '任务详情' })).toBeInTheDocument();
    expect(screen.getByLabelText('详情标题')).toHaveValue('任务管理库第一篇文档');
    expect(screen.getByRole('button', { name: '关闭详情面板' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: '任务详情' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('opens list details from its explicit keyboard control', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '列表' }));
    const trigger = screen.getByRole('button', { name: '查看详情：整理本周重点任务' });
    trigger.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('dialog', { name: '任务详情' })).toBeInTheDocument();
    expect(screen.getByLabelText('详情标题')).toHaveValue('整理本周重点任务');
  });

  it('keeps board selection and completion controls from opening details', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByLabelText('选择任务：整理本周重点任务'));
    expect(screen.queryByRole('dialog', { name: '任务详情' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '切换完成：整理本周重点任务' }));
    expect(screen.queryByRole('dialog', { name: '任务详情' })).not.toBeInTheDocument();
  });

  it('closes the modal drawer from its scrim', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('整理本周重点任务'));
    const dialog = screen.getByRole('dialog', { name: '任务详情' });
    await user.click(dialog.querySelector('.detail-scrim') as HTMLElement);

    expect(screen.queryByRole('dialog', { name: '任务详情' })).not.toBeInTheDocument();
  });

  it('keeps the selected task when the detail drawer is closed and reopened', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('任务管理库第一篇文档'));
    await user.click(screen.getByRole('button', { name: '关闭详情面板' }));
    await user.click(screen.getByRole('button', { name: '显示详情' }));

    expect(screen.getByLabelText('详情标题')).toHaveValue('任务管理库第一篇文档');
  });

  it('shows an empty state when all tasks are completed', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '完成' }));

    expect(screen.getByText('还没有已完成的任务。')).toBeInTheDocument();
  });

  it('shows contextual local artwork for completed and filtered empty states', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '完成' }));
    expect(screen.getByTestId('empty-artwork-completed')).toHaveAttribute('src', expect.stringContaining('the-void'));
    expect(screen.getByTestId('empty-artwork-completed')).toHaveAttribute('alt', '');

    await user.click(screen.getByRole('button', { name: '看板' }));
    await user.type(screen.getByLabelText('搜索任务'), '不存在的任务');
    expect(screen.getByTestId('empty-artwork-filtered')).toHaveAttribute('src', expect.stringContaining('search-results'));
  });

  it('hides failed empty-state artwork and allows a different variant to render', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '完成' }));
    fireEvent.error(screen.getByTestId('empty-artwork-completed'));
    expect(screen.queryByTestId('empty-artwork-completed')).not.toBeInTheDocument();
    expect(screen.getByText('还没有已完成的任务。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '看板' }));
    await user.type(screen.getByLabelText('搜索任务'), '不存在的任务');
    const filteredArtwork = screen.getByTestId('empty-artwork-filtered');
    expect(filteredArtwork).toBeInTheDocument();
    expect(within(filteredArtwork.closest('.empty-state') as HTMLElement).getByRole('button', { name: '清空筛选' })).toBeInTheDocument();
  });

  it('updates the detail panel to the first visible task after filtering', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('任务管理库第一篇文档'));
    expect(screen.getByLabelText('详情标题')).toHaveValue('任务管理库第一篇文档');

    await user.type(screen.getByLabelText('搜索任务'), '整理');

    expect(screen.getByText('整理本周重点任务')).toBeInTheDocument();
    expect(screen.queryByText('任务管理库第一篇文档')).not.toBeInTheDocument();
    expect(screen.getByLabelText('详情标题')).toHaveValue('整理本周重点任务');
  });

  it('shows column headers in the list view', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '列表' }));

    const table = screen.getByLabelText('任务列表');
    expect(within(table).getByText('任务')).toBeInTheDocument();
    expect(within(table).getByText('状态')).toBeInTheDocument();
    expect(within(table).getByText('优先级')).toBeInTheDocument();
    expect(within(table).getByText('日期')).toBeInTheDocument();
    expect(within(table).getByText('预计')).toBeInTheDocument();
  });

  it('explains when the completed view is empty', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '完成' }));

    expect(screen.getByText('还没有已完成的任务。')).toBeInTheDocument();
  });

  it('uses the current view context for the detail empty state', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '完成' }));
    await user.click(screen.getByRole('button', { name: '显示详情' }));

    const detail = screen.getByLabelText('任务详情');
    expect(within(detail).getByText('还没有已完成的任务可查看。')).toBeInTheDocument();
    expect(within(detail).queryByText('当前筛选下没有可查看的任务。')).not.toBeInTheDocument();
  });

  it('moves a task to another board column with drag and drop', () => {
    render(<TaskWorkspace />);
    const dataTransfer = createDataTransfer();
    const nextColumn = screen.getByLabelText('下一步栏');
    const doneColumn = screen.getByLabelText('已完成栏');
    const taskCard = within(nextColumn).getByText('整理本周重点任务').closest('article');

    expect(taskCard).not.toBeNull();
    fireEvent.dragStart(taskCard as HTMLElement, { dataTransfer });
    fireEvent.dragOver(doneColumn, { dataTransfer });
    fireEvent.drop(doneColumn, { dataTransfer });

    expect(within(doneColumn).getByText('整理本周重点任务')).toBeInTheDocument();
    expect(within(nextColumn).queryByText('整理本周重点任务')).not.toBeInTheDocument();
    expect(screen.getByText('已移动“整理本周重点任务”到已完成。')).toBeInTheDocument();
  });

  it('creates a trimmed board column task with Enter, retaining focus and persistence', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const nextInput = screen.getByLabelText('下一步任务标题');

    await user.type(nextInput, '  列内新任务  ');
    await user.keyboard('{Enter}');

    expect(nextInput).toHaveValue('');
    expect(nextInput).toHaveFocus();
    expect(within(screen.getByLabelText('下一步栏')).getByText('列内新任务')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('已在下一步创建任务“列内新任务”。');
    expect(screen.queryByRole('dialog', { name: '任务详情' })).not.toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem('personal-task-manager.tasks.v1')).toContain('列内新任务'));
  });

  it('keeps board column drafts independent and creates with the Plus button', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const nextInput = screen.getByLabelText('下一步任务标题');
    const scheduledInput = screen.getByLabelText('已安排任务标题');

    await user.type(nextInput, '下一步草稿');
    await user.type(scheduledInput, '已安排草稿');
    await user.click(screen.getByRole('button', { name: '添加到下一步' }));

    expect(nextInput).toHaveValue('');
    expect(scheduledInput).toHaveValue('已安排草稿');
    expect(within(screen.getByLabelText('下一步栏')).getByText('下一步草稿')).toBeInTheDocument();
  });

  it('creates a completed board column task with a completedAt timestamp in storage', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.type(screen.getByLabelText('已完成任务标题'), '完成列新任务');
    await user.click(screen.getByRole('button', { name: '添加到已完成' }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('personal-task-manager.tasks.v1') ?? '[]') as Array<{ title: string; completedAt: string }>;
      expect(stored.find((task) => task.title === '完成列新任务')?.completedAt).not.toBe('');
    });
  });

  it('does not create board column tasks from whitespace or composition Enter', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const nextInput = screen.getByLabelText('下一步任务标题');
    const submit = screen.getByRole('button', { name: '添加到下一步' });

    await user.type(nextInput, '   ');
    expect(submit).toBeDisabled();
    await user.keyboard('{Enter}');
    expect(screen.queryByText('   ')).not.toBeInTheDocument();

    await user.clear(nextInput);
    await user.type(nextInput, '组合态任务');
    fireEvent.keyDown(nextInput, { key: 'Enter', isComposing: true });
    expect(screen.queryByText('组合态任务')).not.toBeInTheDocument();
    expect(nextInput).toHaveValue('组合态任务');
  });

  it('hides board column forms while filtered and restores them after clearing filters', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    expect(screen.getByRole('form', { name: '在下一步中新建任务' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('搜索任务'), '整理');
    expect(screen.queryByRole('form', { name: '在下一步中新建任务' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '清空筛选' }));
    expect(screen.getByRole('form', { name: '在下一步中新建任务' })).toBeInTheDocument();
  });

  it('reorders tasks inside a board column with drag and drop', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const firstDrag = createDataTransfer();
    const secondDrag = createDataTransfer();
    const nextColumn = screen.getByLabelText('下一步栏');
    const waitingColumn = screen.getByLabelText('等待中栏');
    const waitingTask = within(waitingColumn).getByText('等待反馈：下一步是否加入番茄钟').closest('article');

    expect(waitingTask).not.toBeNull();
    fireEvent.dragStart(waitingTask as HTMLElement, { dataTransfer: firstDrag });
    fireEvent.dragOver(nextColumn, { dataTransfer: firstDrag });
    fireEvent.drop(nextColumn, { dataTransfer: firstDrag });
    await screen.findByText('已移动“等待反馈：下一步是否加入番茄钟”到下一步。');

    const movedTask = within(nextColumn).getByText('等待反馈：下一步是否加入番茄钟').closest('article');
    const targetTask = within(nextColumn).getByText('整理本周重点任务').closest('article');

    fireEvent.dragStart(movedTask as HTMLElement, { dataTransfer: secondDrag });
    fireEvent.dragOver(targetTask as HTMLElement, { dataTransfer: secondDrag });
    fireEvent.drop(targetTask as HTMLElement, { dataTransfer: secondDrag });

    await waitFor(() => screen.getByText('已移动“等待反馈：下一步是否加入番茄钟”到“整理本周重点任务”前。'));
    await waitFor(() => {
      const titles = within(nextColumn).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
      expect(titles.slice(0, 2)).toEqual(['等待反馈：下一步是否加入番茄钟', '整理本周重点任务']);
    });
  });

  it('switches between board, list, and today views', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    expect(screen.getByLabelText('状态看板')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '列表' }));
    expect(screen.getByLabelText('任务列表')).toBeInTheDocument();
    expect(screen.queryByLabelText('状态看板')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '今日' }));
    expect(screen.getByLabelText('今日任务')).toBeInTheDocument();
    expect(screen.getByText('整理本周重点任务')).toBeInTheDocument();
    expect(screen.queryByText('任务管理库第一篇文档')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '看板' }));
    expect(screen.getByLabelText('状态看板')).toBeInTheDocument();
  });

  it('can collapse and restore the task detail panel', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('整理本周重点任务'));
    expect(screen.getByLabelText('任务详情')).toBeInTheDocument();
    expect(screen.getByLabelText('详情标题')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '隐藏详情' }));

    expect(screen.queryByLabelText('任务详情')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('详情标题')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '显示详情' }));

    expect(screen.getByLabelText('任务详情')).toBeInTheDocument();
    expect(screen.getByLabelText('详情标题')).toBeInTheDocument();
  });

  it('can collapse the detail panel from the detail header', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('整理本周重点任务'));
    await user.click(screen.getByRole('button', { name: '关闭详情面板' }));

    expect(screen.queryByLabelText('任务详情')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '显示详情' })).toBeInTheDocument();
  });

  it('includes overdue tasks in the today execution view', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const quickAdd = within(screen.getByLabelText('新建任务'));

    await user.type(quickAdd.getByLabelText('任务标题'), '逾期发票订单');
    await user.click(screen.getByRole('button', { name: '展开详细字段' }));
    await user.type(quickAdd.getByLabelText('截止日期'), '2026-07-02');
    await user.click(screen.getByRole('button', { name: /添加任务/ }));
    await user.click(screen.getByRole('button', { name: '今日' }));

    expect(screen.getByLabelText('今日任务')).toBeInTheDocument();
    expect(screen.getByText('整理本周重点任务')).toBeInTheDocument();
    expect(screen.getByText('逾期发票订单')).toBeInTheDocument();
  });

  it('updates the detail panel to the first today task in the today view', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('任务管理库第一篇文档'));
    expect(screen.getByLabelText('详情标题')).toHaveValue('任务管理库第一篇文档');

    await user.click(screen.getByRole('button', { name: '今日' }));

    expect(screen.getByLabelText('详情标题')).toHaveValue('整理本周重点任务');
  });

  it('summarizes filters against the today view task scope', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '今日' }));
    await user.type(screen.getByLabelText('搜索任务'), '文档');

    expect(screen.getByText('已筛选 0 / 1 个任务')).toBeInTheDocument();
    expect(screen.getByText('当前筛选没有匹配的任务。')).toBeInTheDocument();
    expect(screen.queryByText('任务管理库第一篇文档')).not.toBeInTheDocument();
  });

  it('shows completed tasks in a dedicated completed view', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '切换完成：等待反馈：下一步是否加入番茄钟' }));
    await user.click(screen.getByRole('button', { name: '完成' }));

    expect(screen.getByLabelText('已完成任务')).toBeInTheDocument();
    expect(screen.getByText('等待反馈：下一步是否加入番茄钟')).toBeInTheDocument();
    expect(screen.queryByText('整理本周重点任务')).not.toBeInTheDocument();
  });

  it('filters the completed view with the workspace search', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '切换完成：等待反馈：下一步是否加入番茄钟' }));
    await user.click(screen.getByRole('button', { name: '完成' }));
    await user.type(screen.getByLabelText('搜索任务'), '整理');

    expect(screen.getByLabelText('已完成任务')).toBeInTheDocument();
    expect(screen.getByText('已筛选 0 / 1 个任务')).toBeInTheDocument();
    expect(screen.getByText('当前筛选没有匹配的任务。')).toBeInTheDocument();
    expect(screen.queryByText('等待反馈：下一步是否加入番茄钟')).not.toBeInTheDocument();
  });

  it('filters completed tasks by due date in the completed view', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '切换完成：等待反馈：下一步是否加入番茄钟' }));
    await user.click(screen.getByRole('button', { name: '完成' }));
    await user.selectOptions(screen.getByLabelText('按日期筛选'), 'today');

    expect(screen.getByText('当前筛选没有匹配的任务。')).toBeInTheDocument();
    expect(screen.getByText('已筛选 0 / 1 个任务')).toBeInTheDocument();
  });

  it('updates the detail panel to the first completed task in the completed view', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '切换完成：等待反馈：下一步是否加入番茄钟' }));
    await user.click(screen.getByRole('button', { name: '完成' }));
    await user.click(screen.getByText('等待反馈：下一步是否加入番茄钟'));

    expect(screen.getByLabelText('详情标题')).toHaveValue('等待反馈：下一步是否加入番茄钟');
  });

  it('labels toolbar filters and detail fields for assistive technology', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    expect(screen.getByLabelText('按状态筛选')).toBeInTheDocument();
    expect(screen.getByLabelText('按优先级筛选')).toBeInTheDocument();
    expect(screen.getByLabelText('按日期筛选')).toBeInTheDocument();
    await user.click(screen.getByText('整理本周重点任务'));
    expect(screen.getByLabelText('详情标题')).toBeInTheDocument();
    expect(screen.getByLabelText('详情备注')).toBeInTheDocument();
  });

  it('contains the status filter in the established filter strip', () => {
    render(<TaskWorkspace />);

    expect(screen.getByLabelText('按状态筛选').closest('.filter-strip')).not.toBeNull();
  });

  it('supports keyboard shortcuts for search, quick add, and view switching', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.keyboard('/');
    expect(screen.getByLabelText('搜索任务')).toHaveFocus();

    await user.keyboard('{Escape}n');
    await waitFor(() => expect(screen.getByLabelText('任务标题')).toHaveFocus());

    await user.keyboard('{Escape}2');
    expect(screen.getByLabelText('任务列表')).toBeInTheDocument();

    await user.keyboard('3');
    expect(screen.getByLabelText('今日任务')).toBeInTheDocument();

    await user.keyboard('1');
    expect(screen.getByLabelText('状态看板')).toBeInTheDocument();
  });

  it('does not trigger global shortcuts while typing in form fields', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const titleInput = screen.getByLabelText('任务标题');

    await user.click(titleInput);
    await user.keyboard('n/23');

    expect(titleInput).toHaveValue('n/23');
    expect(titleInput).toHaveFocus();
    expect(screen.getByLabelText('状态看板')).toBeInTheDocument();
  });

  it('exports tasks as a downloadable JSON file', async () => {
    const user = userEvent.setup();
    const createObjectUrl = vi.fn(() => 'blob:tasks');
    const revokeObjectUrl = vi.fn();
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    vi.stubGlobal('URL', { createObjectURL: createObjectUrl, revokeObjectURL: revokeObjectUrl });
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement;
      if (tagName === 'a') element.click = click;
      return element;
    });
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: /导出/ }));

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:tasks');
    expect(screen.getByRole('status')).toHaveTextContent('任务已导出。');
  });

  it('shows an import error for invalid JSON', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const file = new File(['not-json'], 'tasks.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('导入任务 JSON'), file);

    expect(await screen.findByText('导入文件不是有效的 JSON。')).toBeInTheDocument();
  });

  it('previews a valid import before replacing current tasks', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const importedTask = {
      id: 'import-1',
      title: '导入后的任务',
      notes: '',
      status: 'next',
      priority: 'medium',
      dueDate: '',
      project: '',
      labels: [],
      createdAt: '2026-07-03T09:00:00.000Z',
      updatedAt: '2026-07-03T09:00:00.000Z',
      completedAt: '',
    };
    const file = new File([JSON.stringify({ version: 1, exportedAt: '2026-07-03T09:00:00.000Z', tasks: [importedTask] })], 'tasks.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('导入任务 JSON'), file);

    expect(await screen.findByText('准备导入 1 个任务，请选择替换或合并。')).toBeInTheDocument();
    expect(screen.getByText('整理本周重点任务')).toBeInTheDocument();
    expect(screen.queryByText('导入后的任务')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '替换当前任务' }));

    expect(screen.getByText('导入后的任务')).toBeInTheDocument();
    expect(screen.queryByText('整理本周重点任务')).not.toBeInTheDocument();
  });

  it('can merge imported tasks without duplicating existing ids', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const duplicateExistingTask = {
      id: 'seed-week-plan',
      title: '导入的重复任务',
      notes: '',
      status: 'next',
      priority: 'medium',
      dueDate: '',
      project: '',
      labels: [],
      createdAt: '2026-07-03T09:00:00.000Z',
      updatedAt: '2026-07-03T09:00:00.000Z',
      completedAt: '',
    };
    const newTask = { ...duplicateExistingTask, id: 'import-2', title: '合并过来的任务' };
    const file = new File([JSON.stringify({ version: 1, exportedAt: '2026-07-03T09:00:00.000Z', tasks: [duplicateExistingTask, newTask] })], 'tasks.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('导入任务 JSON'), file);
    await user.click(await screen.findByRole('button', { name: '合并到当前任务' }));

    expect(screen.getByText('整理本周重点任务')).toBeInTheDocument();
    expect(screen.getByText('合并过来的任务')).toBeInTheDocument();
    expect(screen.queryByText('导入的重复任务')).not.toBeInTheDocument();
  });

  it('clears bulk selection when imported tasks replace the current task list', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const importedTask = {
      id: 'import-clean-selection',
      title: '替换后的干净任务',
      notes: '',
      status: 'next',
      priority: 'medium',
      dueDate: '',
      project: '',
      labels: [],
      createdAt: '2026-07-03T09:00:00.000Z',
      updatedAt: '2026-07-03T09:00:00.000Z',
      completedAt: '',
    };
    const file = new File(
      [JSON.stringify({ version: 1, exportedAt: '2026-07-03T09:00:00.000Z', tasks: [importedTask] })],
      'tasks.json',
      { type: 'application/json' },
    );

    await user.click(screen.getByLabelText('选择任务：整理本周重点任务'));
    expect(screen.getByText('已选择 1 个任务')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('导入任务 JSON'), file);
    await user.click(await screen.findByRole('button', { name: '替换当前任务' }));

    expect(screen.queryByText('已选择 1 个任务')).not.toBeInTheDocument();
    expect(screen.getByText('替换后的干净任务')).toBeInTheDocument();
  });

  it('does not restore bulk selection when a replaced task id is merged later', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const replacementTask = {
      id: 'import-clean-selection',
      title: '替换后的干净任务',
      notes: '',
      status: 'next',
      priority: 'medium',
      dueDate: '',
      project: '',
      labels: [],
      createdAt: '2026-07-03T09:00:00.000Z',
      updatedAt: '2026-07-03T09:00:00.000Z',
      completedAt: '',
    };
    const restoredTask = { ...replacementTask, id: 'seed-week-plan', title: '重新合并的旧任务' };
    const replacementFile = new File(
      [JSON.stringify({ version: 1, exportedAt: '2026-07-03T09:00:00.000Z', tasks: [replacementTask] })],
      'replacement.json',
      { type: 'application/json' },
    );
    const restorationFile = new File(
      [JSON.stringify({ version: 1, exportedAt: '2026-07-03T09:00:00.000Z', tasks: [restoredTask] })],
      'restoration.json',
      { type: 'application/json' },
    );

    await user.click(screen.getByLabelText('选择任务：整理本周重点任务'));
    await user.upload(screen.getByLabelText('导入任务 JSON'), replacementFile);
    await user.click(await screen.findByRole('button', { name: '替换当前任务' }));
    await user.upload(screen.getByLabelText('导入任务 JSON'), restorationFile);
    await user.click(await screen.findByRole('button', { name: '合并到当前任务' }));

    expect(screen.getByText('重新合并的旧任务')).toBeInTheDocument();
    expect(screen.queryByText('已选择 1 个任务')).not.toBeInTheDocument();
  });
});

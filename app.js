/**
 * TASKFLOW: SMART MULTI-LIST & CHECKLIST MANAGER — Gamility Tools
 * Pure Vanilla JavaScript Client-Side Engine with 100% Local Persistence
 * Copyright © 2026 Gamility (All Rights Reserved)
 */

(function () {
  'use strict';

  /* ==========================================================================
     STORAGE KEYS & DEFAULT SEED DATA
     ========================================================================== */
  const STORAGE_KEY = 'gamility_todolist_data_v1';

  const DEFAULT_LISTS = [
    {
      id: 'list_shopping_starter',
      title: 'Grocery & Shopping',
      desc: 'Products, ingredients, and everyday household essentials',
      emoji: '🛒',
      color: '#10b981',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
      items: [
        { id: 'item_1', text: 'Organic Whole Milk', completed: true, priority: 'normal', createdAt: Date.now() - 50000, completedAt: Date.now() },
        { id: 'item_2', text: 'Artisan Sourdough Bread', completed: false, priority: 'high', createdAt: Date.now() - 40000, completedAt: null },
        { id: 'item_3', text: 'Ripe Hass Avocados (x4)', completed: false, priority: 'normal', createdAt: Date.now() - 30000, completedAt: null },
        { id: 'item_4', text: 'Free-Range Brown Eggs', completed: true, priority: 'medium', createdAt: Date.now() - 20000, completedAt: Date.now() },
        { id: 'item_5', text: 'Cold-Pressed Olive Oil', completed: false, priority: 'normal', createdAt: Date.now() - 10000, completedAt: null },
        { id: 'item_6', text: 'Plain Greek Yogurt', completed: false, priority: 'normal', createdAt: Date.now(), completedAt: null }
      ]
    },
    {
      id: 'list_daily_starter',
      title: 'Daily Priorities',
      desc: 'Top daily tasks, wellness, and focus routines',
      emoji: '🎯',
      color: '#6366f1',
      createdAt: Date.now() - 43200000,
      updatedAt: Date.now(),
      items: [
        { id: 'item_d1', text: 'Review today’s key priorities and schedule', completed: true, priority: 'high', createdAt: Date.now() - 60000, completedAt: Date.now() },
        { id: 'item_d2', text: 'Drink 2 liters of fresh water throughout day', completed: false, priority: 'normal', createdAt: Date.now() - 50000, completedAt: null },
        { id: 'item_d3', text: '30-minute brisk walk or cardio session', completed: false, priority: 'medium', createdAt: Date.now() - 40000, completedAt: null },
        { id: 'item_d4', text: 'Read 15 pages of non-fiction book', completed: false, priority: 'normal', createdAt: Date.now() - 30000, completedAt: null }
      ]
    }
  ];

  /* ==========================================================================
     APP STATE
     ========================================================================== */
  let STATE = {
    activeListId: 'list_shopping_starter',
    activeFilter: 'all', // 'all' | 'active' | 'completed'
    searchQuery: '',
    lists: []
  };

  // Undo stack for item deletion
  let lastDeletedItem = null;
  let undoTimeoutId = null;

  /* ==========================================================================
     DOM SELECTORS CACHE
     ========================================================================== */
  const DOM = {
    // Sidebar
    sidebarLists: document.getElementById('sidebarLists'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    btnToggleSidebar: document.getElementById('btnToggleSidebar'),
    listsNavContainer: document.getElementById('listsNavContainer'),
    listsTotalBadge: document.getElementById('listsTotalBadge'),
    btnOpenCreateListModal: document.getElementById('btnOpenCreateListModal'),
    btnExportData: document.getElementById('btnExportData'),
    btnImportData: document.getElementById('btnImportData'),

    // Active List Header
    activeListEmoji: document.getElementById('activeListEmoji'),
    activeListTitle: document.getElementById('activeListTitle'),
    activeListDesc: document.getElementById('activeListDesc'),
    btnListOptions: document.getElementById('btnListOptions'),
    listOptionsMenu: document.getElementById('listOptionsMenu'),
    btnActionEditList: document.getElementById('btnActionEditList'),
    btnActionDuplicateList: document.getElementById('btnActionDuplicateList'),
    btnActionCopyAsText: document.getElementById('btnActionCopyAsText'),
    btnActionClearCompleted: document.getElementById('btnActionClearCompleted'),
    btnActionDeleteList: document.getElementById('btnActionDeleteList'),

    // Progress Bar
    progressStatsText: document.getElementById('progressStatsText'),
    progressPercentText: document.getElementById('progressPercentText'),
    progressFill: document.getElementById('progressFill'),

    // Quick Add Form
    quickAddForm: document.getElementById('quickAddForm'),
    quickAddInput: document.getElementById('quickAddInput'),
    quickAddPriority: document.getElementById('quickAddPriority'),

    // Toolbar
    filterBtns: document.querySelectorAll('.filter-btn'),
    checklistSearchInput: document.getElementById('checklistSearchInput'),
    countAll: document.getElementById('countAll'),
    countActive: document.getElementById('countActive'),
    countCompleted: document.getElementById('countCompleted'),

    // Items Section
    checklistItemsList: document.getElementById('checklistItemsList'),
    checklistEmptyState: document.getElementById('checklistEmptyState'),
    emptyStateIcon: document.getElementById('emptyStateIcon'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),

    // Bulk Actions Footer
    btnBulkCheckAll: document.getElementById('btnBulkCheckAll'),
    btnBulkUncheckAll: document.getElementById('btnBulkUncheckAll'),
    btnBulkClearDone: document.getElementById('btnBulkClearDone'),
    bulkDoneCount: document.getElementById('bulkDoneCount'),

    // List Modal
    listModalOverlay: document.getElementById('listModalOverlay'),
    btnCloseListModal: document.getElementById('btnCloseListModal'),
    btnCancelListModal: document.getElementById('btnCancelListModal'),
    formListModal: document.getElementById('formListModal'),
    modalListTitle: document.getElementById('modalListTitle'),
    modalListId: document.getElementById('modalListId'),
    modalListTitleInput: document.getElementById('modalListTitleInput'),
    modalListDescInput: document.getElementById('modalListDescInput'),
    emojiChips: document.querySelectorAll('.emoji-chip'),
    colorChips: document.querySelectorAll('.color-chip'),

    // Backup Modal
    backupModalOverlay: document.getElementById('backupModalOverlay'),
    btnCloseBackupModal: document.getElementById('btnCloseBackupModal'),
    btnDownloadJsonBackup: document.getElementById('btnDownloadJsonBackup'),
    fileImportInput: document.getElementById('fileImportInput'),
    pasteJsonTextarea: document.getElementById('pasteJsonTextarea'),
    btnApplyPastedJson: document.getElementById('btnApplyPastedJson'),

    // Toast
    toastStack: document.getElementById('toastStack')
  };

  /* ==========================================================================
     WEB AUDIO SYNTHESIZER (PROCEDURAL COMPLETION CHIME)
     ========================================================================== */
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playCompleteChime(isAllCompleted = false) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isAllCompleted) {
        // High celebratory arpeggio
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      } else {
        // Subtle crisp double-tone
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.09); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio autoplay gracefully silenced
    }
  }

  /* ==========================================================================
     LOCAL STORAGE MANAGER
     ========================================================================== */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.lists) && parsed.lists.length > 0) {
          STATE.lists = parsed.lists;
          STATE.activeListId = parsed.activeListId || parsed.lists[0].id;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved checklists, fallback to default seed data:', e);
    }

    // Default seed
    STATE.lists = JSON.parse(JSON.stringify(DEFAULT_LISTS));
    STATE.activeListId = DEFAULT_LISTS[0].id;
    saveState();
  }

  function saveState() {
    try {
      const data = {
        activeListId: STATE.activeListId,
        lists: STATE.lists,
        lastSaved: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      showToast('⚠️ Storage limit reached or localStorage disabled.');
    }
  }

  function getActiveList() {
    let list = STATE.lists.find(l => l.id === STATE.activeListId);
    if (!list) {
      if (STATE.lists.length > 0) {
        STATE.activeListId = STATE.lists[0].id;
        list = STATE.lists[0];
      } else {
        // Ensure at least one default list exists
        list = {
          id: 'list_' + Date.now(),
          title: 'My Checklist',
          desc: 'Tasks and to-do items',
          emoji: '📝',
          color: '#10b981',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          items: []
        };
        STATE.lists.push(list);
        STATE.activeListId = list.id;
        saveState();
      }
    }
    return list;
  }

  /* ==========================================================================
     RENDERERS
     ========================================================================== */
  function renderAll() {
    renderSidebarLists();
    renderActiveListHeader();
    renderChecklistItems();
  }

  function renderSidebarLists() {
    if (!DOM.listsNavContainer) return;

    DOM.listsTotalBadge.textContent = STATE.lists.length;
    DOM.listsNavContainer.innerHTML = '';

    STATE.lists.forEach(list => {
      const completedCount = list.items.filter(i => i.completed).length;
      const totalCount = list.items.length;
      const isActive = list.id === STATE.activeListId;

      const itemEl = document.createElement('div');
      itemEl.className = `list-nav-item ${isActive ? 'active' : ''}`;
      itemEl.setAttribute('data-list-id', list.id);
      itemEl.setAttribute('role', 'button');
      itemEl.setAttribute('tabindex', '0');

      itemEl.innerHTML = `
        <div class="list-item-left">
          <span class="list-item-emoji">${escapeHtml(list.emoji || '📝')}</span>
          <span class="list-item-title">${escapeHtml(list.title)}</span>
        </div>
        <div class="list-item-right">
          <span class="list-count-badge">${completedCount}/${totalCount}</span>
        </div>
      `;

      itemEl.addEventListener('click', () => {
        if (STATE.activeListId !== list.id) {
          STATE.activeListId = list.id;
          STATE.searchQuery = '';
          if (DOM.checklistSearchInput) DOM.checklistSearchInput.value = '';
          saveState();
          renderAll();
          closeSidebarOnMobile();
        }
      });

      DOM.listsNavContainer.appendChild(itemEl);
    });
  }

  function renderActiveListHeader() {
    const list = getActiveList();
    if (!list) return;

    DOM.activeListEmoji.textContent = list.emoji || '📝';
    DOM.activeListTitle.textContent = list.title;
    DOM.activeListDesc.textContent = list.desc || 'Checklist items and tasks';

    // Calculate progress
    const total = list.items.length;
    const completed = list.items.filter(i => i.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    DOM.progressStatsText.textContent = `${completed} of ${total} completed`;
    DOM.progressPercentText.textContent = `${percent}%`;
    DOM.progressFill.style.width = `${percent}%`;

    // Counters on Toolbar
    if (DOM.countAll) DOM.countAll.textContent = total;
    if (DOM.countActive) DOM.countActive.textContent = total - completed;
    if (DOM.countCompleted) DOM.countCompleted.textContent = completed;
    if (DOM.bulkDoneCount) DOM.bulkDoneCount.textContent = completed;
  }

  function renderChecklistItems() {
    const list = getActiveList();
    if (!list) return;

    DOM.checklistItemsList.innerHTML = '';

    // Apply Filter
    let filteredItems = list.items;
    if (STATE.activeFilter === 'active') {
      filteredItems = filteredItems.filter(i => !i.completed);
    } else if (STATE.activeFilter === 'completed') {
      filteredItems = filteredItems.filter(i => i.completed);
    }

    // Apply Search
    if (STATE.searchQuery.trim()) {
      const q = STATE.searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(i => i.text.toLowerCase().includes(q));
    }

    // Empty State Check
    if (filteredItems.length === 0) {
      DOM.checklistEmptyState.style.display = 'block';
      if (list.items.length === 0) {
        DOM.emptyStateIcon.textContent = list.emoji || '📝';
        DOM.emptyStateTitle.textContent = 'This list is empty';
        DOM.emptyStateDesc.textContent = 'Add your first item above using the input box or press Enter.';
      } else if (STATE.activeFilter === 'completed') {
        DOM.emptyStateIcon.textContent = '⏳';
        DOM.emptyStateTitle.textContent = 'No completed items yet';
        DOM.emptyStateDesc.textContent = 'Check off items as you finish them to see them here.';
      } else if (STATE.activeFilter === 'active') {
        DOM.emptyStateIcon.textContent = '🎉';
        DOM.emptyStateTitle.textContent = 'All tasks completed!';
        DOM.emptyStateDesc.textContent = 'Outstanding work! Every item in this checklist is finished.';
      } else {
        DOM.emptyStateIcon.textContent = '🔍';
        DOM.emptyStateTitle.textContent = 'No matching items';
        DOM.emptyStateDesc.textContent = `No items matched your search "${escapeHtml(STATE.searchQuery)}".`;
      }
      return;
    }

    DOM.checklistEmptyState.style.display = 'none';

    filteredItems.forEach((item, index) => {
      const itemEl = document.createElement('li');
      itemEl.className = `task-item-card ${item.completed ? 'completed' : ''}`;
      itemEl.setAttribute('data-item-id', item.id);

      const priorityClass = `priority-${item.priority || 'normal'}`;
      const priorityLabel = item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Medium' : '';

      itemEl.innerHTML = `
        <div class="task-content-group">
          <button 
            type="button" 
            class="custom-checkbox" 
            aria-label="${item.completed ? 'Mark incomplete' : 'Mark completed'}"
            data-action="toggle-item"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          
          <div class="task-text-wrap" data-action="edit-item">
            <span class="task-title" title="Click to edit">${escapeHtml(item.text)}</span>
            ${priorityLabel ? `<span class="priority-pill ${priorityClass}">${priorityLabel}</span>` : ''}
          </div>
        </div>

        <div class="task-actions-group">
          <button type="button" class="btn-task-action" data-action="move-up" title="Move Up" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </button>
          <button type="button" class="btn-task-action" data-action="move-down" title="Move Down" ${index === filteredItems.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <button type="button" class="btn-task-action" data-action="edit-item" title="Edit text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="btn-task-action btn-delete" data-action="delete-item" title="Delete item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      DOM.checklistItemsList.appendChild(itemEl);
    });
  }

  /* ==========================================================================
     ITEM ACTIONS (ADD, TOGGLE, EDIT, DELETE, MOVE)
     ========================================================================== */
  function addItem(text, priority = 'normal') {
    const cleanText = text.trim();
    if (!cleanText) return;

    const list = getActiveList();
    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: cleanText,
      completed: false,
      priority: priority,
      createdAt: Date.now(),
      completedAt: null
    };

    // Prepend to top of list
    list.items.unshift(newItem);
    list.updatedAt = Date.now();
    saveState();
    renderAll();

    // Auto-focus input for next item
    if (DOM.quickAddInput) {
      DOM.quickAddInput.value = '';
      DOM.quickAddInput.focus();
    }
  }

  function toggleItem(itemId) {
    const list = getActiveList();
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    item.completed = !item.completed;
    item.completedAt = item.completed ? Date.now() : null;
    list.updatedAt = Date.now();

    saveState();
    renderAll();

    // Sound effect
    if (item.completed) {
      const isAllDone = list.items.length > 0 && list.items.every(i => i.completed);
      playCompleteChime(isAllDone);
      if (isAllDone) {
        showToast(`🎉 Fantastic! All ${list.items.length} items in "${list.title}" are completed!`);
      }
    }
  }

  function editItemText(itemId) {
    const list = getActiveList();
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    const currentCard = DOM.checklistItemsList.querySelector(`[data-item-id="${itemId}"]`);
    if (!currentCard) return;

    const textWrap = currentCard.querySelector('.task-text-wrap');
    if (!textWrap) return;

    const originalHtml = textWrap.innerHTML;
    textWrap.innerHTML = `
      <form class="inline-edit-form" style="display:flex; width:100%; gap:0.5rem;" onsubmit="return false;">
        <input 
          type="text" 
          class="form-input inline-edit-input" 
          value="${escapeHtml(item.text)}" 
          style="padding:0.3rem 0.5rem; font-size:0.95rem; width:100%;"
        >
        <button type="button" class="btn btn-primary btn-sm btn-save-inline" style="padding:0.25rem 0.75rem; font-size:0.8rem;">Save</button>
      </form>
    `;

    const input = textWrap.querySelector('.inline-edit-input');
    const saveBtn = textWrap.querySelector('.btn-save-inline');
    input.focus();
    input.select();

    function commit() {
      const newText = input.value.trim();
      if (newText && newText !== item.text) {
        item.text = newText;
        list.updatedAt = Date.now();
        saveState();
      }
      renderChecklistItems();
    }

    saveBtn.addEventListener('click', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        textWrap.innerHTML = originalHtml;
      }
    });

    input.addEventListener('blur', (e) => {
      // Allow clicking save button without blur preemption
      setTimeout(() => {
        if (textWrap.contains(input)) commit();
      }, 150);
    });
  }

  function deleteItem(itemId) {
    const list = getActiveList();
    const itemIndex = list.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const [deletedItem] = list.items.splice(itemIndex, 1);
    list.updatedAt = Date.now();
    saveState();
    renderAll();

    // Cache for undo
    lastDeletedItem = {
      listId: list.id,
      index: itemIndex,
      item: deletedItem
    };

    showUndoToast(`Deleted "${deletedItem.text.slice(0, 22)}${deletedItem.text.length > 22 ? '...' : ''}"`, () => {
      // Undo callback
      if (lastDeletedItem && lastDeletedItem.listId === list.id) {
        list.items.splice(lastDeletedItem.index, 0, lastDeletedItem.item);
        list.updatedAt = Date.now();
        saveState();
        renderAll();
        showToast('Restored task!');
        lastDeletedItem = null;
      }
    });
  }

  function moveItem(itemId, direction) {
    const list = getActiveList();
    const index = list.items.findIndex(i => i.id === itemId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.items.length) return;

    const [item] = list.items.splice(index, 1);
    list.items.splice(targetIndex, 0, item);
    list.updatedAt = Date.now();

    saveState();
    renderChecklistItems();
  }

  /* ==========================================================================
     BULK ACTIONS
     ========================================================================== */
  function markAllCompleted(completedState) {
    const list = getActiveList();
    if (!list || list.items.length === 0) return;

    list.items.forEach(i => {
      i.completed = completedState;
      i.completedAt = completedState ? Date.now() : null;
    });
    list.updatedAt = Date.now();

    saveState();
    renderAll();

    if (completedState) {
      playCompleteChime(true);
      showToast(`Marked all ${list.items.length} items as completed!`);
    } else {
      showToast('Unchecked all items.');
    }
  }

  function clearCompletedItems() {
    const list = getActiveList();
    if (!list) return;

    const initialCount = list.items.length;
    list.items = list.items.filter(i => !i.completed);
    const removedCount = initialCount - list.items.length;

    if (removedCount > 0) {
      list.updatedAt = Date.now();
      saveState();
      renderAll();
      showToast(`Cleared ${removedCount} completed ${removedCount === 1 ? 'item' : 'items'}.`);
    } else {
      showToast('No completed items to clear.');
    }
  }

  function copyListAsText() {
    const list = getActiveList();
    if (!list) return;

    let text = `# ${list.emoji || '📝'} ${list.title}\n`;
    if (list.desc) text += `${list.desc}\n\n`;

    if (list.items.length === 0) {
      text += `(No items in list)\n`;
    } else {
      list.items.forEach(item => {
        const checkbox = item.completed ? '[x]' : '[ ]';
        const prio = item.priority === 'high' ? ' (!)' : '';
        text += `- ${checkbox} ${item.text}${prio}\n`;
      });
    }

    text += `\n— Shared from Gamility TaskFlow (https://mahesh-yennam.github.io/Gamility/tools/todo-list/)`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Copied checklist to clipboard as text!');
    }).catch(() => {
      showToast('⚠️ Could not access clipboard.');
    });
  }

  /* ==========================================================================
     LIST MODAL (CREATE & EDIT LISTS)
     ========================================================================== */
  function openCreateListModal() {
    DOM.modalListTitle.textContent = 'Create New List';
    DOM.modalListId.value = '';
    DOM.modalListTitleInput.value = '';
    DOM.modalListDescInput.value = '';

    // Reset emojis & colors to first
    selectEmoji('🛒');
    selectColor('#10b981');

    openModal(DOM.listModalOverlay);
    DOM.modalListTitleInput.focus();
  }

  function openEditListModal() {
    const list = getActiveList();
    if (!list) return;

    DOM.modalListTitle.textContent = 'Edit List Details';
    DOM.modalListId.value = list.id;
    DOM.modalListTitleInput.value = list.title;
    DOM.modalListDescInput.value = list.desc || '';

    selectEmoji(list.emoji || '🛒');
    selectColor(list.color || '#10b981');

    openModal(DOM.listModalOverlay);
    DOM.modalListTitleInput.focus();
  }

  function selectEmoji(emoji) {
    DOM.emojiChips.forEach(chip => {
      if (chip.getAttribute('data-emoji') === emoji) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function selectColor(color) {
    DOM.colorChips.forEach(chip => {
      if (chip.getAttribute('data-color') === color) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function handleSaveListModal(e) {
    e.preventDefault();
    const title = DOM.modalListTitleInput.value.trim();
    if (!title) return;

    const desc = DOM.modalListDescInput.value.trim();
    const activeEmojiChip = document.querySelector('.emoji-chip.active');
    const emoji = activeEmojiChip ? activeEmojiChip.getAttribute('data-emoji') : '📝';

    const activeColorChip = document.querySelector('.color-chip.active');
    const color = activeColorChip ? activeColorChip.getAttribute('data-color') : '#10b981';

    const editId = DOM.modalListId.value;

    if (editId) {
      // Edit existing
      const list = STATE.lists.find(l => l.id === editId);
      if (list) {
        list.title = title;
        list.desc = desc;
        list.emoji = emoji;
        list.color = color;
        list.updatedAt = Date.now();
        showToast(`Updated "${title}"`);
      }
    } else {
      // Create new
      const newList = {
        id: 'list_' + Date.now(),
        title: title,
        desc: desc,
        emoji: emoji,
        color: color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        items: []
      };
      STATE.lists.push(newList);
      STATE.activeListId = newList.id;
      showToast(`Created new list: "${title}"`);
    }

    saveState();
    closeModal(DOM.listModalOverlay);
    renderAll();
  }

  function duplicateActiveList() {
    const list = getActiveList();
    if (!list) return;

    const copyList = {
      id: 'list_' + Date.now(),
      title: `${list.title} (Copy)`,
      desc: list.desc,
      emoji: list.emoji,
      color: list.color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: list.items.map(item => ({
        ...item,
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
      }))
    };

    STATE.lists.push(copyList);
    STATE.activeListId = copyList.id;
    saveState();
    renderAll();
    showToast(`Duplicated list as "${copyList.title}"`);
  }

  function deleteActiveList() {
    const list = getActiveList();
    if (!list) return;

    if (STATE.lists.length <= 1) {
      showToast('⚠️ You must have at least one active list.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the list "${list.title}" and all its ${list.items.length} items?`)) {
      return;
    }

    const index = STATE.lists.findIndex(l => l.id === list.id);
    if (index !== -1) {
      STATE.lists.splice(index, 1);
      STATE.activeListId = STATE.lists[0].id;
      saveState();
      renderAll();
      showToast(`Deleted list "${list.title}".`);
    }
  }

  /* ==========================================================================
     BACKUP & RESTORE (EXPORT / IMPORT JSON)
     ========================================================================== */
  function exportJsonBackup() {
    const backupData = {
      app: 'Gamility TaskFlow',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      lists: STATE.lists
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamility-checklists-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾 Backup JSON downloaded successfully!');
  }

  function importJsonData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.lists) || data.lists.length === 0) {
        showToast('⚠️ Invalid backup format: No lists found.');
        return false;
      }

      // Merge or Replace validation
      const validLists = data.lists.filter(l => l && typeof l.title === 'string');
      if (validLists.length === 0) {
        showToast('⚠️ No valid checklist structures found in file.');
        return false;
      }

      STATE.lists = validLists;
      STATE.activeListId = validLists[0].id;
      saveState();
      renderAll();
      closeModal(DOM.backupModalOverlay);
      showToast(`📥 Successfully restored ${validLists.length} lists!`);
      return true;
    } catch (e) {
      showToast('⚠️ Failed to parse JSON file.');
      return false;
    }
  }

  /* ==========================================================================
     MODAL & DRAWER UTILITIES
     ========================================================================== */
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
  }

  function closeSidebarOnMobile() {
    if (window.innerWidth <= 900) {
      DOM.sidebarLists.classList.remove('open');
      DOM.sidebarBackdrop.classList.remove('open');
    }
  }

  function toggleSidebar() {
    DOM.sidebarLists.classList.toggle('open');
    DOM.sidebarBackdrop.classList.toggle('open');
  }

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(message) {
    if (!DOM.toastStack) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    DOM.toastStack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function showUndoToast(message, onUndo) {
    if (!DOM.toastStack) return;

    clearTimeout(undoTimeoutId);
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      <button type="button" class="toast-undo-btn">Undo</button>
    `;

    const undoBtn = toast.querySelector('.toast-undo-btn');
    undoBtn.addEventListener('click', () => {
      if (onUndo) onUndo();
      toast.remove();
    });

    DOM.toastStack.appendChild(toast);

    undoTimeoutId = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 4500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     EVENT LISTENERS & BINDINGS
     ========================================================================== */
  function bindEvents() {
    // Mobile Drawer Toggle
    if (DOM.btnToggleSidebar) {
      DOM.btnToggleSidebar.addEventListener('click', toggleSidebar);
    }
    if (DOM.sidebarBackdrop) {
      DOM.sidebarBackdrop.addEventListener('click', closeSidebarOnMobile);
    }

    // Quick Add Form
    DOM.quickAddForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = DOM.quickAddInput.value;
      const priority = DOM.quickAddPriority.value;
      addItem(text, priority);
    });

    // Item Delegated Clicks (Toggle, Edit, Delete, Move)
    DOM.checklistItemsList.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const itemCard = target.closest('[data-item-id]');
      if (!itemCard) return;

      const itemId = itemCard.getAttribute('data-item-id');
      const action = target.getAttribute('data-action');

      if (action === 'toggle-item') {
        toggleItem(itemId);
      } else if (action === 'edit-item') {
        editItemText(itemId);
      } else if (action === 'delete-item') {
        deleteItem(itemId);
      } else if (action === 'move-up') {
        moveItem(itemId, 'up');
      } else if (action === 'move-down') {
        moveItem(itemId, 'down');
      }
    });

    // Toolbar Filters
    DOM.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        STATE.activeFilter = btn.getAttribute('data-filter');
        renderChecklistItems();
      });
    });

    // Toolbar Search
    if (DOM.checklistSearchInput) {
      DOM.checklistSearchInput.addEventListener('input', (e) => {
        STATE.searchQuery = e.target.value;
        renderChecklistItems();
      });
    }

    // Bulk Actions
    DOM.btnBulkCheckAll.addEventListener('click', () => markAllCompleted(true));
    DOM.btnBulkUncheckAll.addEventListener('click', () => markAllCompleted(false));
    DOM.btnBulkClearDone.addEventListener('click', clearCompletedItems);

    // List Options Dropdown
    DOM.btnListOptions.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.listOptionsMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!DOM.btnListOptions.contains(e.target) && !DOM.listOptionsMenu.contains(e.target)) {
        DOM.listOptionsMenu.classList.remove('open');
      }
    });

    DOM.btnActionEditList.addEventListener('click', () => {
      DOM.listOptionsMenu.classList.remove('open');
      openEditListModal();
    });

    DOM.btnActionDuplicateList.addEventListener('click', () => {
      DOM.listOptionsMenu.classList.remove('open');
      duplicateActiveList();
    });

    DOM.btnActionCopyAsText.addEventListener('click', () => {
      DOM.listOptionsMenu.classList.remove('open');
      copyListAsText();
    });

    DOM.btnActionClearCompleted.addEventListener('click', () => {
      DOM.listOptionsMenu.classList.remove('open');
      clearCompletedItems();
    });

    DOM.btnActionDeleteList.addEventListener('click', () => {
      DOM.listOptionsMenu.classList.remove('open');
      deleteActiveList();
    });

    // Create / Edit Modal Events
    DOM.btnOpenCreateListModal.addEventListener('click', openCreateListModal);
    DOM.btnCloseListModal.addEventListener('click', () => closeModal(DOM.listModalOverlay));
    DOM.btnCancelListModal.addEventListener('click', () => closeModal(DOM.listModalOverlay));
    DOM.formListModal.addEventListener('submit', handleSaveListModal);

    DOM.emojiChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.emojiChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    DOM.colorChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.colorChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // Backup & Restore Modal Events
    DOM.btnExportData.addEventListener('click', () => openModal(DOM.backupModalOverlay));
    DOM.btnImportData.addEventListener('click', () => openModal(DOM.backupModalOverlay));
    DOM.btnCloseBackupModal.addEventListener('click', () => closeModal(DOM.backupModalOverlay));
    DOM.btnDownloadJsonBackup.addEventListener('click', exportJsonBackup);

    DOM.fileImportInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        importJsonData(event.target.result);
      };
      reader.readAsText(file);
    });

    DOM.btnApplyPastedJson.addEventListener('click', () => {
      const val = DOM.pasteJsonTextarea.value.trim();
      if (!val) {
        showToast('Please paste valid JSON text first.');
        return;
      }
      importJsonData(val);
    });

    // Close Modals on Backdrop Click
    [DOM.listModalOverlay, DOM.backupModalOverlay].forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(DOM.listModalOverlay);
        closeModal(DOM.backupModalOverlay);
        DOM.listOptionsMenu.classList.remove('open');
        closeSidebarOnMobile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        // Focus quick add
        e.preventDefault();
        DOM.quickAddInput.focus();
      }
    });
  }

  /* ==========================================================================
     INITIALIZATION ENTRYPOINT
     ========================================================================== */
  function init() {
    loadState();
    bindEvents();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

const participantList = document.querySelector('#participant-list');
const participantForm = document.querySelector('#add-participant');
const participantSearch = document.querySelector('#participant-search');
const participantCount = document.querySelector('#participant-count');
const participantMessage = document.querySelector('#participant-message');
const hackathonList = document.querySelector('#hackathon-list');
const hackathonForm = document.querySelector('#add-hackathon');
const hackathonSearch = document.querySelector('#hackathon-search');
const hackathonCount = document.querySelector('#hackathon-count');
const hackathonMessage = document.querySelector('#hackathon-message');
const teamList = document.querySelector('#team-list');
const teamForm = document.querySelector('#add-team');
const teamSearch = document.querySelector('#team-search');
const teamCount = document.querySelector('#team-count');
const teamMessage = document.querySelector('#team-message');
const submissionList = document.querySelector('#submission-list');
const submissionForm = document.querySelector('#add-submission');
const submissionSearch = document.querySelector('#submission-search');
const submissionCount = document.querySelector('#submission-count');
const submissionMessage = document.querySelector('#submission-message');
const announcementList = document.querySelector('#announcement-list');
const announcementForm = document.querySelector('#add-announcement');
const announcementSearch = document.querySelector('#announcement-search');
const announcementCount = document.querySelector('#announcement-count');
const announcementMessage = document.querySelector('#announcement-message');
const dashboardHackathonCount = document.querySelector('#dashboard-hackathon-count');
const dashboardParticipantCount = document.querySelector('#dashboard-participant-count');
const dashboardTeamCount = document.querySelector('#dashboard-team-count');
const dashboardSubmissionCount = document.querySelector('#dashboard-submission-count');
const dashboardHackathonList = document.querySelector('#dashboard-hackathon-list');
const dashboardActivityList = document.querySelector('#dashboard-activity-list');

const createCell = (value) => {
    const cell = document.createElement('td');
    cell.textContent = value ?? '';
    return cell;
};
const normalize = (value) => String(value || '').trim().toLowerCase();
const hackathons = HackTrackAPI.hackathons.list();
const teams = HackTrackAPI.teams.list();
const participants = HackTrackAPI.participants.list();
const submissions = HackTrackAPI.submissions.list();
const announcements = HackTrackAPI.announcements.list();
const now = () => new Date().toISOString();

window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('hacktrack.')) window.location.reload();
});

const findHackathon = (idOrName) => hackathons.find((item) => (
    item.id === idOrName || normalize(item.name) === normalize(idOrName)
));
const findTeam = (idOrName) => teams.find((item) => (
    item.id === idOrName || normalize(item.name) === normalize(idOrName)
));
const displayHackathon = (item) => (
    findHackathon(item.hackathonId || item.hackathon)?.name || item.hackathon || 'Unlinked'
);
const displayTeam = (item) => (
    findTeam(item.teamId || item.team)?.name || item.team || 'Unlinked'
);
const isLinkedRecord = (record, idField, nameField, id, name) => (
    record[idField] === id || (Boolean(name) && normalize(record[nameField]) === normalize(name))
);
const migrateLegacyRelationships = (records, idField, nameField, id, oldName, newName) => {
    let changed = false;
    const migrated = records.map((record) => {
        if (!isLinkedRecord(record, idField, nameField, id, oldName)) return record;
        changed = true;
        const next = { ...record, [idField]: id };
        if (Object.prototype.hasOwnProperty.call(record, nameField)) next[nameField] = newName;
        return next;
    });
    return { items: migrated, changed };
};
const saveRelationshipMigration = (migration, save) => (
    !migration.changed || save(migration.items)
);
const isSafeUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};
const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value || 'Date unavailable' : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};
const inputDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value || '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
};
const confirmDeletion = (label, detail = '') => window.confirm(
    `Delete ${label}?${detail ? `\n\n${detail}` : ''}\n\nThis cannot be undone.`
);
const setFormMode = (form, noun, editing) => {
    form.dataset.editingId = editing ? editing.id : '';
    const heading = form.querySelector('h2');
    const description = form.querySelector('.section-heading p');
    const button = form.querySelector('button[type="submit"]');
    let cancelButton = form.querySelector('.cancel-edit-btn');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'cancel-edit-btn';
        cancelButton.textContent = 'Cancel Edit';
        cancelButton.addEventListener('click', () => cancelEdit(form, noun));
        button?.after(cancelButton);
    }
    if (description && !description.dataset.default) description.dataset.default = description.textContent;
    if (heading) heading.textContent = editing ? `Edit ${noun}` : `Add ${noun}`;
    if (description) description.textContent = editing ? `Update this ${noun.toLowerCase()}.` : description.dataset.default || description.textContent;
    if (button) button.textContent = editing ? `Save ${noun}` : `Add ${noun}`;
    cancelButton.hidden = !editing;
};
const cancelEdit = (form, noun) => {
    form.reset();
    refreshRelationshipSelects();
    const msg = form.querySelector('.form-message');
    if (msg) msg.textContent = '';
    setFormMode(form, noun, null);
};
const addActions = (row, item, onEdit, className = 'delete-workspace-item') => {
    const cell = document.createElement('td');
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'edit-workspace-item';
    edit.dataset.id = item.id;
    edit.textContent = 'Edit';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = className;
    remove.dataset.id = item.id;
    remove.textContent = 'Delete';
    edit.addEventListener('click', () => onEdit(item));
    cell.append(edit, remove);
    row.append(cell);
};
const addEmptyRow = (list, columns, message) => {
    if (list.tagName !== 'TBODY') {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = message;
        list.append(empty);
        return;
    }
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = columns;
    cell.className = 'empty-state';
    cell.textContent = message;
    row.append(cell);
    list.append(row);
};

const populateSelect = (select, records, emptyText, selectedValue = '') => {
    if (!select) return;
    select.replaceChildren();
    if (!records.length) {
        const option = new Option(emptyText, '');
        option.disabled = true;
        option.selected = true;
        select.append(option);
        return;
    }
    records.forEach((record) => select.append(new Option(record.name, record.id, false, record.id === selectedValue)));
    if (!records.some((record) => record.id === selectedValue)) select.options[0].selected = true;
};
const refreshRelationshipSelects = () => {
    const participantSelect = document.querySelector('#participant-hackathon');
    const values = [
        [document.querySelector('#team-hackathon'), hackathons, 'No hackathons available'],
        [document.querySelector('#announcement-hackathon'), hackathons, 'No hackathons available'],
        [document.querySelector('#submission-team'), teams, 'No teams available'],
        [participantSelect, hackathons, 'No hackathons available']
    ];
    values.forEach(([select, records, emptyText]) => {
        if (!select) return;
        const current = select.value;
        populateSelect(select, records, emptyText, current);
        if (select === participantSelect) select.insertBefore(new Option('No specific hackathon', '', false, !current), select.firstChild);
    });
};
refreshRelationshipSelects();

const updateDashboard = () => {
    if (dashboardHackathonCount) dashboardHackathonCount.textContent = String(hackathons.length).padStart(2, '0');
    if (dashboardParticipantCount) dashboardParticipantCount.textContent = participants.length;
    if (dashboardTeamCount) dashboardTeamCount.textContent = teams.length;
    if (dashboardSubmissionCount) dashboardSubmissionCount.textContent = submissions.length;
};
updateDashboard();

const resetDemoButton = document.querySelector('#reset-demo-btn');
resetDemoButton?.addEventListener('click', () => {
    if (!window.confirm('Reset all HackTrack demo data? This cannot be undone.')) return;
    Object.keys(localStorage)
        .filter((key) => key.startsWith('hacktrack.'))
        .forEach((key) => localStorage.removeItem(key));
    window.location.reload();
});

if (dashboardHackathonList && dashboardActivityList) {
    dashboardHackathonList.replaceChildren();
    if (!hackathons.length) addEmptyRow(dashboardHackathonList, 1, 'No hackathons have been created yet.');
    hackathons.forEach((hackathon) => {
        const card = document.createElement('article');
        card.className = 'hackathon-card';
        const info = document.createElement('div');
        info.className = 'hackathon-info';
        const status = document.createElement('span');
        status.className = `status-badge${hackathon.status === 'Upcoming' ? ' upcoming' : ''}`;
        status.textContent = hackathon.status;
        const title = document.createElement('h3');
        title.textContent = hackathon.name;
        const description = document.createElement('p');
        description.textContent = hackathon.description;
        const meta = document.createElement('div');
        meta.className = 'hackathon-meta';
        const teamCount = teams.filter((team) => displayHackathon(team) === hackathon.name).length;
        const participantCount = participants.filter((participant) => findHackathon(participant.hackathonId || participant.hackathon)?.id === hackathon.id).length;
        meta.append(
            Object.assign(document.createElement('span'), { textContent: `${teamCount} ${teamCount === 1 ? 'Team' : 'Teams'}` }),
            Object.assign(document.createElement('span'), { textContent: `${participantCount} ${participantCount === 1 ? 'Linked Participant' : 'Linked Participants'}` })
        );
        info.append(status, title, description, meta);
        const manage = document.createElement('a');
        manage.className = 'manage-link';
        manage.href = 'hackathons.html';
        manage.textContent = 'Manage →';
        card.append(info, manage);
        dashboardHackathonList.append(card);
    });

    const events = [
        ...teams.map((item) => ({ text: `Team ${item.name} is linked to ${displayHackathon(item)}.`, createdAt: item.createdAt })),
        ...submissions.map((item) => ({ text: `${item.project} was submitted by ${displayTeam(item)}.`, createdAt: item.createdAt || item.submitted })),
        ...announcements.filter((item) => item.status === 'Published')
            .map((item) => ({ text: `Announcement published: ${item.title}.`, createdAt: item.createdAt }))
    ];
    events.sort((a, b) => {
        const aTime = Date.parse(a.createdAt || '');
        const bTime = Date.parse(b.createdAt || '');
        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;
        return bTime - aTime;
    });
    dashboardActivityList.replaceChildren();
    if (!events.length) addEmptyRow(dashboardActivityList, 1, 'No recent activity yet.');
    events.slice(0, 5).forEach((event) => {
        const item = document.createElement('p');
        const dot = document.createElement('span');
        dot.className = 'activity-dot';
        item.append(dot, document.createTextNode(event.text));
        dashboardActivityList.append(item);
    });
}

const renderFilter = (list, search, count, noun, emptyText) => {
    const rows = [...list.querySelectorAll('tr')];
    const query = search.value.trim().toLowerCase();
    const dataRows = rows.filter((row) => !row.querySelector('.empty-state'));
    const visible = dataRows.filter((row) => {
        const matches = row.textContent.toLowerCase().includes(query);
        row.hidden = !matches;
        return matches;
    });
    if (!dataRows.length) {
        if (!list.querySelector('.empty-state')) addEmptyRow(list, rows[0]?.children.length || 1, emptyText);
        count.textContent = `0 ${noun}s`;
    } else {
        count.textContent = query && !visible.length
            ? `No ${noun}s match your search.`
            : `${visible.length} ${noun}${visible.length === 1 ? '' : 's'}`;
    }
};

const setupParticipantList = () => {
    if (!participantList || !participantForm || !participantSearch) return;
    const render = () => {
        participantList.replaceChildren();
        participants.forEach((participant) => {
            const row = document.createElement('tr');
            row.append(createCell(participant.name), createCell(participant.email), createCell(participant.college), createCell(displayHackathon(participant)), createCell(participant.status || 'Active'));
            addActions(row, participant, (item) => {
                participantForm.querySelector('[name="name"]').value = item.name;
                participantForm.querySelector('[name="email"]').value = item.email;
                participantForm.querySelector('[name="college"]').value = item.college;
                participantForm.querySelector('[name="hackathonId"]').value = findHackathon(item.hackathonId || item.hackathon)?.id || '';
                setFormMode(participantForm, 'Participant', item);
                participantForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 'delete-participant');
            participantList.append(row);
        });
        renderFilter(participantList, participantSearch, participantCount, 'participant', 'No participants have been added yet.');
    };
    participantSearch.addEventListener('input', render);
    participantForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(participantForm));
        const editingId = participantForm.dataset.editingId;
        const existing = participants.find((record) => record.id === editingId);
        const item = { ...(existing || {}), ...data, status: data.status || existing?.status || 'Active', createdAt: existing?.createdAt || now() };
        if ('hackathonId' in data) delete item.hackathon;
        if (!item.name.trim() || !item.email.trim() || !item.college.trim()) return void (participantMessage.textContent = 'Please complete all participant fields.');
        if (participants.some((record) => record.id !== editingId && normalize(record.email) === normalize(item.email))) return void (participantMessage.textContent = 'A participant with this email already exists.');
        const next = editingId ? participants.map((record) => record.id === editingId ? item : record) : [...participants, item];
        if (!HackTrackAPI.participants.save(next)) return void (participantMessage.textContent = 'Could not save participant. Please try again.');
        cancelEdit(participantForm, 'Participant');
        participantMessage.textContent = `Participant ${editingId ? 'updated' : 'added'} successfully.`;
        render();
    });
    participantList.addEventListener('click', (event) => {
        if (!event.target.classList.contains('delete-participant')) return;
        if (!confirmDeletion('this participant')) return;
        const next = participants.filter((item) => item.id !== event.target.dataset.id);
        if (!HackTrackAPI.participants.save(next)) return void (participantMessage.textContent = 'Could not delete participant. Please try again.');
        render();
    });
    render();
};

const setupHackathonList = () => {
    if (!hackathonList || !hackathonForm || !hackathonSearch) return;
    const render = () => {
        hackathonList.replaceChildren();
        hackathons.forEach((item) => {
            const row = document.createElement('tr');
            row.append(createCell(item.name), createCell(item.description), createCell(item.status));
            addActions(row, item, (record) => {
                hackathonForm.querySelector('[name="name"]').value = record.name;
                hackathonForm.querySelector('[name="description"]').value = record.description;
                hackathonForm.querySelector('[name="status"]').value = record.status;
                setFormMode(hackathonForm, 'Hackathon', record);
                hackathonForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 'delete-participant');
            hackathonList.append(row);
        });
        renderFilter(hackathonList, hackathonSearch, hackathonCount, 'hackathon', 'No hackathons have been created yet.');
    };
    hackathonSearch.addEventListener('input', render);
    hackathonForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(hackathonForm));
        const editingId = hackathonForm.dataset.editingId;
        const item = { ...(hackathons.find((record) => record.id === editingId) || {}), ...data, createdAt: hackathons.find((record) => record.id === editingId)?.createdAt || now() };
        if (!item.name.trim() || !item.description.trim()) return void (hackathonMessage.textContent = 'Please complete all hackathon fields.');
        if (hackathons.some((record) => record.id !== editingId && normalize(record.name) === normalize(item.name))) return void (hackathonMessage.textContent = 'A hackathon with this name already exists.');
        const existing = hackathons.find((record) => record.id === editingId);
        const participantMigration = existing
            ? migrateLegacyRelationships(participants, 'hackathonId', 'hackathon', editingId, existing.name, item.name)
            : { items: participants, changed: false };
        const teamMigration = existing
            ? migrateLegacyRelationships(teams, 'hackathonId', 'hackathon', editingId, existing.name, item.name)
            : { items: teams, changed: false };
        const announcementMigration = existing
            ? migrateLegacyRelationships(announcements, 'hackathonId', 'hackathon', editingId, existing.name, item.name)
            : { items: announcements, changed: false };
        if (!saveRelationshipMigration(participantMigration, HackTrackAPI.participants.save)
            || !saveRelationshipMigration(teamMigration, HackTrackAPI.teams.save)
            || !saveRelationshipMigration(announcementMigration, HackTrackAPI.announcements.save)) {
            return void (hackathonMessage.textContent = 'Could not migrate linked records. Please try again.');
        }
        const next = editingId ? hackathons.map((record) => record.id === editingId ? item : record) : [...hackathons, item];
        if (!HackTrackAPI.hackathons.save(next)) return void (hackathonMessage.textContent = 'Could not save hackathon. Please try again.');
        cancelEdit(hackathonForm, 'Hackathon');
        hackathonMessage.textContent = `Hackathon ${editingId ? 'updated' : 'added'} successfully.`;
        refreshRelationshipSelects();
        render();
    });
    hackathonList.addEventListener('click', (event) => {
        if (!event.target.classList.contains('delete-participant')) return;
        const id = event.target.dataset.id;
        const linked = [
            ...participants.filter((item) => isLinkedRecord(item, 'hackathonId', 'hackathon', id, findHackathon(id)?.name)),
            ...teams.filter((item) => isLinkedRecord(item, 'hackathonId', 'hackathon', id, findHackathon(id)?.name)),
            ...announcements.filter((item) => isLinkedRecord(item, 'hackathonId', 'hackathon', id, findHackathon(id)?.name))
        ];
        if (linked.length) return void (hackathonMessage.textContent = `Cannot delete this hackathon: ${linked.length} linked record${linked.length === 1 ? '' : 's'} exist. Reassign or remove those records first.`);
        if (!confirmDeletion('this hackathon')) return;
        if (!HackTrackAPI.hackathons.save(hackathons.filter((item) => item.id !== id))) return void (hackathonMessage.textContent = 'Could not delete hackathon. Please try again.');
        refreshRelationshipSelects();
        render();
    });
    render();
};

const createWorkspaceRow = (item, values, linkFields = [], dateFields = []) => {
    const row = document.createElement('tr');
    values.forEach((value, index) => {
        const cell = document.createElement('td');
        if (index === values.length - 1) {
            const status = document.createElement('span');
            const statusClasses = ['participant-status'];
            if (['Pending', 'Draft', 'Needs changes'].includes(value)) statusClasses.push('upcoming-status');
            if (['Disqualified', 'Rejected'].includes(value)) statusClasses.push('danger-status');
            status.className = statusClasses.join(' ');
            status.textContent = value;
            cell.append(status);
        } else if (dateFields.includes(index)) cell.textContent = formatDate(value);
        else if (linkFields.includes(index) && isSafeUrl(value)) {
            const link = document.createElement('a');
            link.href = value;
            link.target = '_blank';
            link.rel = 'noreferrer';
            link.textContent = value.replace(/^https?:\/\//, '');
            cell.append(link);
        } else cell.textContent = value ?? '';
        row.append(cell);
    });
    return row;
};

const setupWorkspaceList = ({ list, form, search, count, message, items, save, noun, renderRow, prepareItem, urlFields = [], onDelete, onEdit, beforeSave }) => {
    if (!list || !form || !search) return;
    const render = () => {
        list.replaceChildren();
        items.forEach((item) => {
            const row = renderRow(item);
            addActions(row, item, () => onEdit(item));
            list.append(row);
        });
        renderFilter(list, search, count, noun, `No ${noun}s have been added yet.`);
    };
    search.addEventListener('input', render);
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = prepareItem(new FormData(form));
        const editingId = form.dataset.editingId;
        const existing = items.find((item) => item.id === editingId);
        const item = { ...(existing || {}), ...data, createdAt: existing?.createdAt || now() };
        if ('hackathonId' in data) delete item.hackathon;
        if ('teamId' in data) delete item.team;
        if (Object.values(data).some((value) => !String(value || '').trim())) return void (message.textContent = `Please complete all ${noun} fields.`);
        if (urlFields.some((field) => !isSafeUrl(item[field]))) return void (message.textContent = 'Enter valid http:// or https:// links.');
        const saveError = beforeSave?.(existing, item);
        if (saveError) return void (message.textContent = saveError);
        const next = editingId ? items.map((record) => record.id === editingId ? item : record) : [...items, item];
        if (!save(next)) return void (message.textContent = `Could not save ${noun}. Please try again.`);
        cancelEdit(form, noun[0].toUpperCase() + noun.slice(1));
        message.textContent = `${noun[0].toUpperCase() + noun.slice(1)} ${editingId ? 'updated' : 'added'} successfully.`;
        refreshRelationshipSelects();
        render();
    });
    list.addEventListener('click', (event) => {
        if (!event.target.classList.contains('delete-workspace-item')) return;
        const item = items.find((record) => record.id === event.target.dataset.id);
        const warning = onDelete ? onDelete(item) : '';
        if (warning) return void (message.textContent = warning);
        if (!confirmDeletion(`this ${noun}`)) return;
        if (!save(items.filter((record) => record.id !== item.id))) return void (message.textContent = `Could not delete ${noun}. Please try again.`);
        refreshRelationshipSelects();
        render();
    });
    items.forEach((item) => {
        if (onEdit) onEdit(item, true);
    });
    render();
};

setupParticipantList();
setupHackathonList();
setupWorkspaceList({
    list: teamList, form: teamForm, search: teamSearch, count: teamCount, message: teamMessage,
    items: teams, save: HackTrackAPI.teams.save, noun: 'team',
    renderRow: (item) => createWorkspaceRow(item, [item.name, item.members, displayHackathon(item), item.status]),
    prepareItem: (data) => ({ name: data.get('name'), members: data.get('members'), hackathonId: data.get('hackathonId'), status: data.get('status') }),
    onEdit: (item, initialiseOnly) => {
        if (initialiseOnly) return;
        teamForm.querySelector('[name="name"]').value = item.name;
        teamForm.querySelector('[name="members"]').value = item.members;
        teamForm.querySelector('[name="hackathonId"]').value = findHackathon(item.hackathonId || item.hackathon)?.id || '';
        teamForm.querySelector('[name="status"]').value = item.status;
        setFormMode(teamForm, 'Team', item);
        teamForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    onDelete: (item) => {
        const linked = submissions.filter((record) => isLinkedRecord(record, 'teamId', 'team', item.id, item.name));
        return linked.length ? `Cannot delete this team: ${linked.length} linked submission${linked.length === 1 ? '' : 's'} exist. Reassign or remove them first.` : '';
    },
    beforeSave: (existing, item) => {
        if (teams.some((record) => record.id !== existing?.id && normalize(record.name) === normalize(item.name))) {
            return 'A team with this name already exists.';
        }
        if (!existing) return '';
        const migration = migrateLegacyRelationships(submissions, 'teamId', 'team', existing.id, existing.name, item.name);
        return saveRelationshipMigration(migration, HackTrackAPI.submissions.save)
            ? ''
            : 'Could not migrate linked submissions. Please try again.';
    }
});
setupWorkspaceList({
    list: submissionList, form: submissionForm, search: submissionSearch, count: submissionCount, message: submissionMessage,
    items: submissions, save: HackTrackAPI.submissions.save, noun: 'submission',
    renderRow: (item) => createWorkspaceRow(item, [item.project, displayTeam(item), item.repository, item.demo, item.submitted, item.status], [2, 3], [4]),
    prepareItem: (data) => ({ project: data.get('project'), teamId: data.get('teamId'), repository: data.get('repository'), demo: data.get('demo'), submitted: data.get('submitted'), status: data.get('status') }),
    urlFields: ['repository', 'demo'],
    onEdit: (item, initialiseOnly) => {
        if (initialiseOnly) return;
        ['project', 'teamId', 'repository', 'demo', 'status'].forEach((field) => { submissionForm.querySelector(`[name="${field}"]`).value = item[field] || ''; });
        submissionForm.querySelector('[name="teamId"]').value = findTeam(item.teamId || item.team)?.id || '';
        submissionForm.querySelector('[name="submitted"]').value = inputDate(item.submitted);
        setFormMode(submissionForm, 'Submission', item);
        submissionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
setupWorkspaceList({
    list: announcementList, form: announcementForm, search: announcementSearch, count: announcementCount, message: announcementMessage,
    items: announcements, save: HackTrackAPI.announcements.save, noun: 'announcement',
    renderRow: (item) => createWorkspaceRow(item, [item.title, item.message, displayHackathon(item), item.status]),
    prepareItem: (data) => ({ title: data.get('title'), message: data.get('message'), hackathonId: data.get('hackathonId'), status: data.get('status') }),
    onEdit: (item, initialiseOnly) => {
        if (initialiseOnly) return;
        ['title', 'message', 'hackathonId', 'status'].forEach((field) => { announcementForm.querySelector(`[name="${field}"]`).value = item[field] || ''; });
        announcementForm.querySelector('[name="hackathonId"]').value = findHackathon(item.hackathonId || item.hackathon)?.id || '';
        setFormMode(announcementForm, 'Announcement', item);
        announcementForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

const demoParticipants = [
    { name: 'Rahul Sharma', email: 'rahul@example.com', college: 'ABC College', status: 'Active' },
    { name: 'Priya Singh', email: 'priya@example.com', college: 'XYZ College', status: 'Active' }
];

const demoHackathons = [
    {
        name: 'Innovation Hackathon 2026',
        description: 'Build innovative solutions to real-world problems.',
        status: 'Ongoing'
    },
    {
        name: 'CodeSprint 2026',
        description: 'A coding challenge focused on software innovation.',
        status: 'Upcoming'
    }
];

const demoTeams = [
    {
        name: 'Pixel Pioneers',
        members: 'Aarav Mehta, Diya Shah, Karan Patel',
        hackathon: 'Innovation Hackathon 2026',
        status: 'Active'
    },
    {
        name: 'Binary Builders',
        members: 'Isha Rao, Neel Joshi',
        hackathon: 'CodeSprint 2026',
        status: 'Pending'
    }
];

const demoSubmissions = [
    {
        project: 'EcoRoute',
        team: 'Pixel Pioneers',
        repository: 'https://github.com/pixel-pioneers/ecoroute',
        demo: 'https://ecoroute.demo.app',
        submitted: '2026-10-18T10:42:00',
        status: 'Under review'
    },
    {
        project: 'TaskFlow',
        team: 'Binary Builders',
        repository: 'https://github.com/binary-builders/taskflow',
        demo: 'https://taskflow.demo.app',
        submitted: '2026-10-17T18:15:00',
        status: 'Accepted'
    }
];

const demoAnnouncements = [
    {
        title: 'Submission deadline reminder',
        message: 'Final submissions close tomorrow at 6:00 PM. Please review your project links before submitting.',
        hackathon: 'Innovation Hackathon 2026',
        status: 'Published'
    },
    {
        title: 'Welcome to CodeSprint',
        message: 'The event workspace is now open. Team formation and project ideation can begin.',
        hackathon: 'CodeSprint 2026',
        status: 'Draft'
    }
];

const createId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createLocalStore = (key, defaults) => {
    const normalizeItems = (items) => items.map((item) => {
        const normalized = {
            ...item,
            id: item.id || createId()
        };
        if (key === 'hacktrack.submissions') {
            ['repository', 'demo'].forEach((field) => {
                if (normalized[field] && !/^https?:\/\//i.test(normalized[field])) {
                    normalized[field] = `https://${normalized[field]}`;
                }
            });
        }
        return normalized;
    });
    let items = normalizeItems(defaults);

    try {
        const storedItems = localStorage.getItem(key);
        if (storedItems !== null) {
            const parsedItems = JSON.parse(storedItems);
            if (!Array.isArray(parsedItems)) {
                throw new Error(`Stored value for ${key} is not an array.`);
            }
            items = normalizeItems(parsedItems);
            localStorage.setItem(key, JSON.stringify(items));
        }
    } catch (error) {
        console.error(`HackTrackAPI could not load ${key} from localStorage.`, error);
        try {
            localStorage.setItem(key, JSON.stringify(items));
        } catch (repairError) {
            console.error(`HackTrackAPI could not repair ${key} in localStorage.`, repairError);
        }
    }

    return {
        list() {
            return items;
        },

        save(nextItems) {
            const itemsWithIds = normalizeItems(nextItems);

            try {
                localStorage.setItem(key, JSON.stringify(itemsWithIds));
                items.splice(0, items.length, ...itemsWithIds);
                return true;
            } catch (error) {
                console.error(`HackTrackAPI could not save ${key} to localStorage.`, error);
                return false;
            }
        }
    };
};

const participantStore = createLocalStore('hacktrack.participants', demoParticipants);
const hackathonStore = createLocalStore('hacktrack.hackathons', demoHackathons);
const teamStore = createLocalStore('hacktrack.teams', demoTeams);
const submissionStore = createLocalStore('hacktrack.submissions', demoSubmissions);
const announcementStore = createLocalStore('hacktrack.announcements', demoAnnouncements);

const HackTrackAPI = {
    participants: {
        list() {
            return participantStore.list();
        },

        save(items) {
            return participantStore.save(items);
        }
    },

    hackathons: {
        list() {
            return hackathonStore.list();
        },

        save(items) {
            return hackathonStore.save(items);
        }
    },

    teams: {
        list() {
            return teamStore.list();
        },

        save(items) {
            return teamStore.save(items);
        }
    },

    submissions: {
        list() {
            return submissionStore.list();
        },

        save(items) {
            return submissionStore.save(items);
        }
    },

    announcements: {
        list() {
            return announcementStore.list();
        },

        save(items) {
            return announcementStore.save(items);
        }
    }
};

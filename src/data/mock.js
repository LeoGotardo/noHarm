export const ME = {
  id: 'me',
  username: 'alex_recovery',
  email: 'alex@noharm.app',
  avatar: null,
  joined: 'March 2025',
  color: 154,
};

export const START_DATE = new Date('2025-04-16T08:00:00');
export const STREAK_START_LABEL = 'April 16, 2025';

export const STREAK_HISTORY = [
  { id: 's4', days: 21, start: 'Mar 19, 2025', end: 'Apr 9, 2025',  record: false },
  { id: 's3', days: 12, start: 'Mar 4, 2025',  end: 'Mar 16, 2025', record: false },
  { id: 's2', days: 89, start: 'Nov 28, 2024', end: 'Feb 25, 2025', record: true },
  { id: 's1', days: 6,  start: 'Nov 19, 2024', end: 'Nov 25, 2024', record: false },
];

export const PERSONAL_RECORD = 89;
export const TOTAL_STREAKS = 5;

const HUES = { maya: 12, theo: 250, grace: 320, daniel: 95, river: 200, noor: 40, sam: 285 };

export const FRIENDS = [
  { id: 'maya',  username: 'maya_rivera', online: true,  hue: HUES.maya,  streak: 63,  avatar: null },
  { id: 'theo',  username: 'theo_k',      online: true,  hue: HUES.theo,  streak: 14,  avatar: null },
  { id: 'grace', username: 'grace_lin',   online: false, hue: HUES.grace, streak: 211, avatar: null, lastSeen: '2h ago' },
];

export const REQUESTS_RECEIVED = [
  { id: 'daniel', username: 'daniel_p', hue: HUES.daniel, streak: 9,  avatar: null, when: '1d ago' },
];
export const REQUESTS_SENT = [
  { id: 'river', username: 'river.b',  hue: HUES.river,  streak: 33, avatar: null, when: '3d ago' },
];

export const SEARCH_POOL = [
  { id: 'noor',  username: 'noor_h',      hue: HUES.noor,  streak: 5,  avatar: null, rel: 'none' },
  { id: 'sam',   username: 'sam_99',      hue: HUES.sam,   streak: 41, avatar: null, rel: 'none' },
  { id: 'maya',  username: 'maya_rivera', hue: HUES.maya,  streak: 63, avatar: null, rel: 'friend' },
  { id: 'river', username: 'river.b',     hue: HUES.river, streak: 33, avatar: null, rel: 'pending' },
];

export const BADGES = [
  { id: 'b1',   name: 'Day One',        milestone: 1,   earned: 'Apr 16, 2025', desc: 'The bravest step is the first. You showed up.' },
  { id: 'b7',   name: 'First Week',     milestone: 7,   earned: 'Apr 23, 2025', desc: 'Seven days clean. A full week of choosing yourself.' },
  { id: 'b30',  name: 'One Month',      milestone: 30,  earned: 'May 16, 2025', desc: 'Thirty days. A new rhythm is taking root.' },
  { id: 'b90',  name: '90 Days Strong', milestone: 90,  earned: null,           desc: 'Ninety days rewires the brain. You are getting close.' },
  { id: 'b180', name: 'Six Months',     milestone: 180, earned: null,           desc: 'Half a year of clean days. A different life.' },
  { id: 'b365', name: 'One Year',       milestone: 365, earned: null,           desc: 'A full year. Proof that change is possible.' },
];

export const CHATS = [
  {
    id: 'c_maya', with: 'maya', status: 'active', unread: 2,
    last: "That's huge, Alex. Proud of you 💚", lastTime: '9:24 AM',
    messages: [
      { id: 'm1', from: 'maya', text: "Hey, how are you holding up today?",         time: '9:02 AM', day: 'Today' },
      { id: 'm2', from: 'me',   text: "Honestly a rough morning, but I checked in.", time: '9:05 AM', day: 'Today', read: true },
      { id: 'm3', from: 'maya', text: "Checking in on a hard day is the whole game.", time: '9:06 AM', day: 'Today' },
      { id: 'm4', from: 'me',   text: "Hit 47 days 🙂",                              time: '9:23 AM', day: 'Today', read: true },
      { id: 'm5', from: 'maya', text: "That's huge, Alex. Proud of you 💚",          time: '9:24 AM', day: 'Today' },
    ],
  },
  {
    id: 'c_theo', with: 'theo', status: 'active', unread: 0,
    last: "Same time tomorrow for the walk?", lastTime: 'Yesterday',
    messages: [
      { id: 'm1', from: 'theo', text: "The meeting last night helped a lot.",        time: '7:40 PM', day: 'Yesterday' },
      { id: 'm2', from: 'me',   text: "So glad. Same time tomorrow for the walk?",  time: '7:52 PM', day: 'Yesterday', read: true },
      { id: 'm3', from: 'theo', text: "Same time tomorrow for the walk?",           time: '7:55 PM', day: 'Yesterday' },
    ],
  },
  {
    id: 'c_grace', with: 'grace', status: 'pending', unread: 0,
    last: "Wants to start a conversation", lastTime: '2d ago',
    messages: [
      { id: 'm1', from: 'grace', text: "Hi Alex — saw we both hit big milestones. Would love to swap notes if you're open to it.", time: 'Mon', day: 'Monday' },
    ],
  },
  {
    id: 'c_old', with: 'sam', status: 'ended', unread: 0,
    last: "This conversation has ended.", lastTime: 'Apr 2',
    messages: [
      { id: 'm1', from: 'sam', text: "Thanks for the accountability these weeks.",  time: '4:10 PM', day: 'Apr 2' },
      { id: 'm2', from: 'me',  text: "Anytime. Take good care of yourself.",        time: '4:18 PM', day: 'Apr 2', read: true },
    ],
  },
];

export const PEOPLE = {};
[...FRIENDS, ...REQUESTS_RECEIVED, ...REQUESTS_SENT, ...SEARCH_POOL,
 { id: 'sam', username: 'sam_99', hue: HUES.sam, streak: 41, avatar: null }
].forEach(p => { if (!PEOPLE[p.id]) PEOPLE[p.id] = p; });

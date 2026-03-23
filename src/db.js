import Dexie from 'dexie';

const db = new Dexie('DebtQuestDB');

db.version(1).stores({
  // Single-row store for app state (xp, streak, profile, etc.)
  appState: 'id',
  accounts: 'id, type, isPaidOff, createdAt',
  payments: 'id, accountId, paymentDate',
  rewards: 'id',
  redeemedRewards: 'id, date',
});

export const DEFAULT_REWARDS = [
  { id: 'r1', name: 'Kitchen Duty Free', desc: 'Other player cleans the kitchen', emoji: '🧹', cost: 1000, createdBy: '' },
  { id: 'r2', name: 'Couch Commander', desc: 'Pick what we watch tonight', emoji: '🎬', cost: 500, createdBy: '' },
  { id: 'r3', name: 'Sleep In Pass', desc: 'Other player handles the morning', emoji: '😴', cost: 750, createdBy: '' },
  { id: 'r4', name: 'Dinner Date', desc: 'Other player plans & pays for date night', emoji: '🍽️', cost: 2000, createdBy: '' },
  { id: 'r5', name: 'Spa Day', desc: 'Full spa day — you earned it', emoji: '💆', cost: 5000, createdBy: '' },
  { id: 'r6', name: 'Quality Time', desc: 'You know what this means 😏', emoji: '🍆', cost: 2500, createdBy: '' },
  { id: 'r7', name: 'No Chores Weekend', desc: 'Full weekend off from all chores', emoji: '🏖️', cost: 3000, createdBy: '' },
  { id: 'r8', name: 'Treat Yourself', desc: '$50 guilt-free spending money', emoji: '🛍️', cost: 4000, createdBy: '' },
];

export const DEFAULT_STATE = {
  id: 'main',
  xp: 0,
  streak: 0,
  lastPaymentMonth: null,
  achievements: [],
  profile: { name1: 'Player 1', name2: 'Player 2' },
};

// Initialize DB with defaults on first run
export async function initDB() {
  const state = await db.appState.get('main');
  if (!state) {
    await db.appState.put(DEFAULT_STATE);
    await db.rewards.bulkPut(DEFAULT_REWARDS);
  }
}

// ─── Helpers to read full app data as a single object (matches existing component API) ───
export async function loadAllData() {
  const [state, accounts, payments, rewards, redeemedRewards] = await Promise.all([
    db.appState.get('main'),
    db.accounts.toArray(),
    db.payments.toArray(),
    db.rewards.toArray(),
    db.redeemedRewards.toArray(),
  ]);
  return {
    ...(state || DEFAULT_STATE),
    accounts: accounts || [],
    payments: payments || [],
    rewards: rewards || [],
    redeemedRewards: redeemedRewards || [],
  };
}

export async function saveAllData(data) {
  const { accounts, payments, rewards, redeemedRewards, ...state } = data;
  state.id = 'main';
  await db.transaction('rw', db.appState, db.accounts, db.payments, db.rewards, db.redeemedRewards, async () => {
    await db.appState.put(state);
    await db.accounts.clear();
    if (accounts?.length) await db.accounts.bulkPut(accounts);
    await db.payments.clear();
    if (payments?.length) await db.payments.bulkPut(payments);
    await db.rewards.clear();
    if (rewards?.length) await db.rewards.bulkPut(rewards);
    await db.redeemedRewards.clear();
    if (redeemedRewards?.length) await db.redeemedRewards.bulkPut(redeemedRewards);
  });
}

export default db;

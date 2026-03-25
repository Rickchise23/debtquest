import Dexie from "dexie";
import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const db = new Dexie("DebtQuestDB");

db.version(1).stores({
  appState: "id",
  accounts: "id, type, isPaidOff, createdAt",
  payments: "id, accountId, paymentDate",
  rewards: "id",
  redeemedRewards: "id, date",
});

export const DEFAULT_REWARDS = [
  { id: "r1", name: "Kitchen Duty Free", desc: "Other player cleans the kitchen", emoji: "🧹", cost: 1000, createdBy: "" },
  { id: "r2", name: "Couch Commander", desc: "Pick what we watch tonight", emoji: "🎬", cost: 500, createdBy: "" },
  { id: "r3", name: "Sleep In Pass", desc: "Other player handles the morning", emoji: "😴", cost: 750, createdBy: "" },
  { id: "r4", name: "Dinner Date", desc: "Other player plans & pays for date night", emoji: "🍽️", cost: 2000, createdBy: "" },
  { id: "r5", name: "Spa Day", desc: "Full spa day — you earned it", emoji: "💆", cost: 5000, createdBy: "" },
  { id: "r6", name: "Quality Time", desc: "You know what this means 😏", emoji: "🍆", cost: 2500, createdBy: "" },
  { id: "r7", name: "No Chores Weekend", desc: "Full weekend off from all chores", emoji: "🏖️", cost: 3000, createdBy: "" },
  { id: "r8", name: "Treat Yourself", desc: "$50 guilt-free spending money", emoji: "🛍️", cost: 4000, createdBy: "" },
];

export const DEFAULT_STATE = {
  id: "main",
  xp: 0,
  streak: 0,
  lastPaymentMonth: null,
  achievements: [],
  profile: { name1: "Player 1", name2: "Player 2" },
};

export { isSupabaseConfigured };

function mergeLoaded(state, accounts, payments, rewards, redeemedRewards) {
  return {
    ...(state || DEFAULT_STATE),
    accounts: accounts || [],
    payments: payments || [],
    rewards: rewards || [],
    redeemedRewards: redeemedRewards || [],
  };
}

async function initDexie() {
  const state = await db.appState.get("main");
  if (!state) {
    await db.appState.put(DEFAULT_STATE);
    await db.rewards.bulkPut(DEFAULT_REWARDS);
  }
}

async function loadDexieMerged() {
  const [state, accounts, payments, rewards, redeemedRewards] = await Promise.all([
    db.appState.get("main"),
    db.accounts.toArray(),
    db.payments.toArray(),
    db.rewards.toArray(),
    db.redeemedRewards.toArray(),
  ]);
  return mergeLoaded(state, accounts, payments, rewards, redeemedRewards);
}

async function saveDexie(data) {
  const { accounts, payments, rewards, redeemedRewards, ...state } = data;
  state.id = "main";
  await db.transaction("rw", db.appState, db.accounts, db.payments, db.rewards, db.redeemedRewards, async () => {
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

function hasMeaningfulLocalData(d) {
  if (!d) return false;
  if ((d.accounts?.length || 0) > 0) return true;
  if ((d.payments?.length || 0) > 0) return true;
  if ((d.xp || 0) > 0) return true;
  if ((d.streak || 0) > 0) return true;
  if ((d.achievements?.length || 0) > 0) return true;
  return false;
}

async function clearDexieUserData() {
  await db.transaction("rw", db.appState, db.accounts, db.payments, db.rewards, db.redeemedRewards, async () => {
    await db.appState.clear();
    await db.accounts.clear();
    await db.payments.clear();
    await db.rewards.clear();
    await db.redeemedRewards.clear();
  });
  await initDexie();
}

async function loadCloud(userId) {
  const { data: row, error } = await supabase
    .from("debtquest_data")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const payload = row?.payload;
  if (payload && typeof payload === "object" && Object.keys(payload).length > 0) {
    const { accounts, payments, rewards, redeemedRewards, ...stateFields } = payload;
    return mergeLoaded(
      { ...DEFAULT_STATE, ...stateFields, id: "main" },
      accounts,
      payments,
      rewards,
      redeemedRewards,
    );
  }

  await initDexie();
  const local = await loadDexieMerged();
  if (hasMeaningfulLocalData(local)) {
    await saveCloud(userId, local);
    await clearDexieUserData();
    return local;
  }

  return mergeLoaded(DEFAULT_STATE, [], [], [], []);
}

async function saveCloud(userId, data) {
  const { accounts, payments, rewards, redeemedRewards, ...rest } = data;
  const payload = {
    ...rest,
    accounts,
    payments,
    rewards,
    redeemedRewards,
  };
  delete payload.id;

  const { error } = await supabase.from("debtquest_data").upsert(
    {
      user_id: userId,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}

/** IndexedDB only — no-op when using Supabase-only mode. */
export async function initDB() {
  if (!isSupabaseConfigured) await initDexie();
}

export async function loadAllData() {
  if (!isSupabaseConfigured) {
    await initDexie();
    return loadDexieMerged();
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not signed in");
  return loadCloud(session.user.id);
}

export async function saveAllData(data) {
  if (!isSupabaseConfigured) {
    await saveDexie(data);
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not signed in");
  await saveCloud(session.user.id, data);
}

export async function signInWithPassword(email, password) {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email, password) {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export default db;

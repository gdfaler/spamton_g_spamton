// Loads and types public/data/dialogue.json (see ASSETS.md). Per the same
// "never crash on missing/bad content" rule as the sprite/audio loaders:
// a fetch failure or malformed JSON falls back to a tiny built-in
// placeholder script rather than throwing.

export type SpeakerId = 'kris' | 'susie' | 'ralsei' | 'spamton' | 'system';

export interface DialoguePage {
  speaker: SpeakerId;
  text: string;
}

export interface DialogueData {
  intro: {
    phone_call: DialoguePage[];
    neo_declaration: DialoguePage[];
  };
  battle: {
    check_neo: string;
    act_snap: DialoguePage[];
    act_s_action: DialoguePage[];
    act_r_action: DialoguePage[];
    snap_all: DialoguePage[];
    taunts: DialoguePage[];
    hurt_lines: DialoguePage[];
    low_hp_lines: DialoguePage[];
    free_turn_call: DialoguePage[];
  };
  wires: {
    almost_done: DialoguePage[];
    all_cut_ending: DialoguePage[];
  };
  endings: {
    victory_fight: DialoguePage[];
    victory_wires: DialoguePage[];
    game_over: DialoguePage[];
  };
}

const EMERGENCY_FALLBACK: DialogueData = {
  intro: {
    phone_call: [{ speaker: 'system', text: '(dialogue.json missing/invalid — using emergency fallback text)' }],
    neo_declaration: [{ speaker: 'spamton', text: '[ERROR LOADING DIALOGUE] ...but the show must go on!' }]
  },
  battle: {
    check_neo: '* SPAMTON NEO - ??? / ???',
    act_snap: [{ speaker: 'system', text: '...' }],
    act_s_action: [{ speaker: 'susie', text: '...' }],
    act_r_action: [{ speaker: 'ralsei', text: '...' }],
    snap_all: [{ speaker: 'system', text: '...' }],
    taunts: [{ speaker: 'spamton', text: '...' }],
    hurt_lines: [{ speaker: 'spamton', text: '...' }],
    low_hp_lines: [{ speaker: 'spamton', text: '...' }],
    free_turn_call: [{ speaker: 'spamton', text: '...' }]
  },
  wires: {
    almost_done: [{ speaker: 'spamton', text: '...' }],
    all_cut_ending: [{ speaker: 'spamton', text: '...' }]
  },
  endings: {
    victory_fight: [{ speaker: 'spamton', text: '...' }],
    victory_wires: [{ speaker: 'spamton', text: '...' }],
    game_over: [{ speaker: 'spamton', text: '...' }]
  }
};

export async function loadDialogueData(path = 'data/dialogue.json'): Promise<DialogueData> {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as unknown;
    if (!isPlausibleDialogueData(json)) throw new Error('malformed dialogue.json shape');
    return json;
  } catch (err) {
    console.warn(`[dialogue] failed to load ${path}, using emergency fallback:`, err);
    return EMERGENCY_FALLBACK;
  }
}

function isPlausibleDialogueData(v: unknown): v is DialogueData {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return 'intro' in obj && 'battle' in obj && 'wires' in obj && 'endings' in obj;
}

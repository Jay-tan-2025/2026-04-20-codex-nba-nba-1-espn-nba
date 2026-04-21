const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(path, options = {}) {
  if (!hasSupabaseConfig()) {
    throw new Error("缺少 Supabase 环境变量。");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase 请求失败: ${response.status} ${text}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

async function insertPrediction(payload) {
  return supabaseRequest("predictions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function listPredictions() {
  return supabaseRequest(
    "predictions?select=*&order=created_at.desc&limit=50",
    { method: "GET" }
  );
}

async function upsertVerifiedPrediction(payload) {
  return supabaseRequest("predictions?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload)
  });
}

module.exports = {
  hasSupabaseConfig,
  insertPrediction,
  listPredictions,
  upsertVerifiedPrediction
};

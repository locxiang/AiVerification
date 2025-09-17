import { getPlansDb, DB_NAMES, idbGetAll, idbGet } from "@/utils/indexedDb";

/**
 * 读取本地 IndexedDB 的方案列表并本地分页
 * @param {{ q?: string, status?: string, page?: number, pageSize?: number, startDate?: string, endDate?: string }} params
 * @returns {Promise<{ data: { list: any[], total: number, page: number, pageSize: number } }>}
 */
export async function getPlans(params = {}) {
  const { q = "", status = "", page = 1, pageSize = 10, startDate = "", endDate = "" } = params;
  const db = await getPlansDb();
  const all = await idbGetAll(db, DB_NAMES.plans);

  const keyword = String(q || "").toLowerCase();
  const filtered = (all || []).filter((p) => {
    const matchKeyword = keyword
      ? String(p.name || "").toLowerCase().includes(keyword) || String(p.id).includes(keyword)
      : true;
    const matchStatus = status ? p.status === status : true;
    let matchDate = true;
    if (startDate || endDate) {
      const createdAtTime = new Date(p.createdAt || 0).getTime();
      const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : -Infinity;
      const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Infinity;
      matchDate = createdAtTime >= start && createdAtTime <= end;
    }
    return matchKeyword && matchStatus && matchDate;
  });

  // 简单按创建时间降序
  filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageList = filtered.slice(start, end);

  // 与原接口结构保持一致
  const list = pageList.map((p) => ({
    id: p.id,
    name: p.name,
    template: p.template?.name || "",
    owner: p.owner,
    status: p.status,
    createdAt: p.createdAt,
    lastRunAt: p.lastRunAt || null,
  }));

  return Promise.resolve({
    data: { list, total: filtered.length, page, pageSize },
  });
}

/**
 * 读取本地 IndexedDB 的方案详情
 * @param {{ id: string|number, planId?: string|number }} params
 * @returns {Promise<{ data: any|null }>}
 */
export async function getPlanDetail(params = {}) {
  const rawId = params.id ?? params.planId;
  const id = String(rawId);
  const db = await getPlansDb();
  const plan = await idbGet(db, DB_NAMES.plans, id);
  return { data: plan || null };
}



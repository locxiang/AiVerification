const DB_NAME = "ai-verification-db"
const DB_VERSION = 1
const STORE = "pump"

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGet(...args) {
  // 兼容两种用法：
  // 1) idbGet(key) => 读取默认 STORE("pump")
  // 2) idbGet(db, storeName, key) => 使用传入的 db 与仓库名
  if (args.length === 1) {
    const [key] = args
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly")
      const store = tx.objectStore(STORE)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  if (args.length >= 3) {
    const [db, storeName, key] = args
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly")
      const store = tx.objectStore(storeName)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  }
  return Promise.reject(new TypeError("idbGet 参数不合法。期望 1 个参数(key) 或 3 个参数(db, storeName, key)"))
}

export async function idbSet(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    const store = tx.objectStore(STORE)
    const req = store.put(value, key)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

export async function idbDel(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    const store = tx.objectStore(STORE)
    const req = store.delete(key)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

export function makeIncrementalState(prev) {
  const now = new Date()
  const base = prev || {
    connections: 5,
    backlog: 12,
    heartbeat: now.toISOString(),
    errorsLastHour: Array.from({ length: 12 }).map(() => 0),
    runningTasks: [],
    datasets: [],
    logs: [],
  }
  // 误差曲线右移追加
  const nextErrors = base.errorsLastHour.slice(1)
  nextErrors.push(Math.max(0, Math.min(9, (base.errorsLastHour[base.errorsLastHour.length-1] || 0) + (Math.random() < 0.5 ? 0 : 1))))

  // 任务进度递增，完成后置 0.99 保持进行中视觉
  const runningTasks = (base.runningTasks.length ? base.runningTasks : [
    { id: 101, name: "任务-101", planId: 7, planName: "方案-7", progress: 0.2, status: "running" },
    { id: 102, name: "任务-102", planId: 8, planName: "方案-8", progress: 0.6, status: "running" },
  ]).map(t => {
    const inc = 0.01 + Math.random() * 0.03
    let p = t.progress + inc
    if (p >= 1) p = 0.99
    return { ...t, progress: Number(p.toFixed(2)) }
  })

  // 数据集文档数递增
  const datasets = (base.datasets.length ? base.datasets : [
    { id: "ds_news", name: "新闻数据集", source: "crawler", docs: 120000 },
    { id: "ds_forum", name: "论坛数据集", source: "social-bot", docs: 80000 },
  ]).map(d => ({ ...d, docs: d.docs + Math.floor(Math.random() * 200) }))

  // 日志追加（保留 100 条）
  const samples = [
    "心跳正常",
    "拉取批次完成",
    "解析文档成功",
    "等待新批次",
  ]
  const newLog = { ts: now.toISOString(), level: Math.random() < 0.1 ? "warn" : "info", msg: samples[Math.floor(Math.random()*samples.length)] }
  const logs = base.logs.concat(newLog).slice(-100)

  return {
    connections: base.connections,
    backlog: Math.max(0, base.backlog - Math.floor(Math.random()*2) + 1),
    heartbeat: now.toISOString(),
    errorsLastHour: nextErrors,
    runningTasks,
    datasets,
    logs,
  }
}

// 轻量 IndexedDB 工具：封装打开数据库、建表、CRUD
// 注意：本工具属于前端依赖（浏览器端），不涉及 Node 后端依赖。

const DEFAULT_DB_NAME = 'ai_verification_db';
const DEFAULT_DB_VERSION = 1;

/**
 * 打开数据库并在需要时初始化对象仓库
 * @param {string} dbName
 * @param {number} version
 * @param {(db: IDBDatabase) => void} onUpgrade
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase(dbName = DEFAULT_DB_NAME, version = DEFAULT_DB_VERSION, onUpgrade) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      try {
        if (typeof onUpgrade === 'function') {
          onUpgrade(db, event.oldVersion, event.newVersion);
        }
      } catch (e) {
        reject(e);
      }
    };
  });
}

/**
 * 确保对象仓库存在
 */
export function ensureObjectStore(db, storeName, options = { keyPath: 'id', autoIncrement: false }, indexes = []) {
  if (!db.objectStoreNames.contains(storeName)) {
    const store = db.createObjectStore(storeName, options);
    indexes.forEach((idx) => {
      const { name, keyPath, options: idxOptions } = idx;
      if (name && keyPath) store.createIndex(name, keyPath, idxOptions || { unique: false });
    });
  }
}

/**
 * 通用写入（put：有则更新，无则新增）
 */
export function idbPutRecord(db, storeName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 读取单条
 */
export function idbGetRecord(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 按索引查询第一条
 */
export function idbGetByIndexRecord(db, storeName, indexName, query) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.get(query);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 删除
 */
export function idbDeleteRecord(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 读取全部
 */
export function idbGetAllRecords(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// 兼容旧导出命名（提供别名以避免改动其他模块）
export const idbPut = idbPutRecord;
export const idbDelete = idbDeleteRecord;
export const idbGetAll = idbGetAllRecords;

/**
 * 生成简单 ID
 */
export function generateLocalId(prefix = 'local_') {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}${ts}_${rnd}`;
}

export const DB_NAMES = {
  plans: 'plans',
  drafts: 'plan_drafts'
};

export async function getPlansDb() {
  const db = await openDatabase(DEFAULT_DB_NAME, DEFAULT_DB_VERSION, (db) => {
    ensureObjectStore(db, DB_NAMES.plans, { keyPath: 'id', autoIncrement: false }, [
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'status', keyPath: 'status' }
    ]);
    ensureObjectStore(db, DB_NAMES.drafts, { keyPath: 'id', autoIncrement: false }, [
      { name: 'updatedAt', keyPath: 'updatedAt' }
    ]);
  });
  return db;
}



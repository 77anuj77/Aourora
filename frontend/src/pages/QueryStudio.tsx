import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dbApi } from '../services/database';
import SoftCard from '../components/ui/SoftCard';
import Button from '../components/ui/Button';
import Editor from '@monaco-editor/react';
import { Play, RefreshCw, Download } from 'lucide-react';
import CategorySelect from '../components/ui/CategorySelect';


function parseVal(v: any) {
  if (v === '' || v === null || v === undefined) return v;
  if (!isNaN(v) && v.trim() !== '') return Number(v);
  return v;
}

export default function QueryStudio() {
  const qc = useQueryClient();
  const [dbType, setDbType] = useState<'sqlite' | 'mongodb'>('sqlite');
  const [dataset, setDataset] = useState('');
  const [operation, setOperation] = useState('select');

  // sqlite
  const [columns, setColumns] = useState<string[]>([]);
  const [pk, setPk] = useState('id');
  const [insertVals, setInsertVals] = useState<Record<string, string>>({});
  const [selectCols, setSelectCols] = useState<string[]>(['*']);
  const [conditions, setConditions] = useState<{ column: string; operator: string; value: string }[]>([]);
  const [orderBy, setOrderBy] = useState('');
  const [orderDir, setOrderDir] = useState('DESC');
  const [limit, setLimit] = useState<number | ''>('');
  const [updateId, setUpdateId] = useState('');
  const [setVals, setSetVals] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState('');
  const [joinTable, setJoinTable] = useState('');
  const [joinType, setJoinType] = useState('INNER');
  const [aggFunc, setAggFunc] = useState('COUNT');
  const [aggCol, setAggCol] = useState('*');
  const [groupBy, setGroupBy] = useState('');

  // mongo
  const [mongoDoc, setMongoDoc] = useState('{\n  "category": "Food",\n  "monthly_total": 100,\n  "month": "2026-10"\n}');
  const [mongoFilter, setMongoFilter] = useState('{}');
  const [mongoUpdate, setMongoUpdate] = useState('{"$set": {"monthly_total": 200}}');
  const [mongoPipeline, setMongoPipeline] = useState('[{"$match": {}}, {"$group": {"_id": "$category", "total": {"$sum": "$monthly_total"}}}, {"$sort": {"total": -1}}]');
  const [mongoLimit, setMongoLimit] = useState(50);

  const [preview, setPreview] = useState('');
  const [params, setParams] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [liveRows, setLiveRows] = useState<any>(null);

  // datasets
  const { data: tablesData } = useQuery({ queryKey: ['db-tables'], queryFn: () => dbApi.tables(), enabled: dbType === 'sqlite' });
  const { data: mongoCols } = useQuery({ queryKey: ['mongo-cols'], queryFn: () => dbApi.mongoCollections(), enabled: dbType === 'mongodb' });

  const tables = tablesData?.tables || [];
  const collections = mongoCols?.collections?.map((c: any) => c.collection) || [];

  useEffect(() => {
    if (dbType === 'sqlite' && tables.length && !dataset) setDataset(tables.includes('transactions') ? 'transactions' : tables[0]);
    if (dbType === 'mongodb' && collections.length && !dataset) setDataset(collections[0]);
  }, [tables, collections, dbType]);

  useEffect(() => {
    // fetch schema for selected table
    if (dbType === 'sqlite' && dataset) {
      dbApi.tableSchema(dataset).then((s: any) => {
        setColumns(s.columns.map((c: any) => c.name));
        const pkcol = s.columns.find((c: any) => c.pk)?.name;
        if (pkcol) setPk(pkcol);
      }).catch(() => {});
    }
  }, [dataset, dbType]);

  useEffect(() => {
    buildPreview();
  }, [dbType, dataset, operation, insertVals, selectCols, conditions, orderBy, orderDir, limit, updateId, setVals, deleteId, joinTable, joinType, aggFunc, aggCol, groupBy, mongoDoc, mongoFilter, mongoUpdate, mongoPipeline, mongoLimit, columns, pk]);

  function buildPreview() {
    if (dbType === 'mongodb') {
      let p = '';
      if (operation === 'insertOne') p = `db.${dataset}.insertOne(${mongoDoc})`;
      else if (operation === 'find') p = `db.${dataset}.find(${mongoFilter}).limit(${mongoLimit})`;
      else if (operation === 'updateOne') p = `db.${dataset}.updateOne(${mongoFilter}, ${mongoUpdate})`;
      else if (operation === 'deleteOne') p = `db.${dataset}.deleteOne(${mongoFilter})`;
      else if (operation === 'aggregate') p = `db.${dataset}.aggregate(${mongoPipeline})`;
      setPreview(p);
      setParams([]);
      return;
    }
    // sqlite
    if (operation === 'insert') {
      const cols = Object.keys(insertVals).filter(k => insertVals[k] !== '');
      setPreview(`INSERT INTO ${dataset} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')});`);
      setParams(cols.map(c => parseVal(insertVals[c])));
    } else if (operation === 'select') {
      const colsStr = (selectCols.length && !selectCols.includes('*')) ? selectCols.join(', ') : '*';
      const where = conditions.filter(c => c.column && c.value !== '').map(c => `${c.column} ${c.operator} ?`).join(' AND ');
      let sql = `SELECT ${colsStr} FROM ${dataset}`;
      if (where) sql += ` WHERE ${where}`;
      if (orderBy) sql += ` ORDER BY ${orderBy} ${orderDir}`;
      if (limit !== '' && limit !== null) sql += ` LIMIT ${limit}`;
      sql += ';';
      setPreview(sql);
      setParams(conditions.filter(c => c.column && c.value !== '').map(c => parseVal(c.value)));
    } else if (operation === 'update') {
      const cols = Object.keys(setVals).filter(k => setVals[k] !== '');
      const sets = cols.map(c => `${c} = ?`).join(', ');
      let sql = `UPDATE ${dataset} SET ${sets}`;
      const ps = cols.map(c => parseVal(setVals[c]));
      if (updateId) { sql += ` WHERE ${pk} = ?`; ps.push(parseVal(updateId)); }
      sql += ';';
      setPreview(sql);
      setParams(ps);
    } else if (operation === 'delete') {
      let sql = `DELETE FROM ${dataset}`;
      const ps: any[] = [];
      if (deleteId) { sql += ` WHERE ${pk} = ?`; ps.push(parseVal(deleteId)); }
      sql += ';';
      setPreview(sql);
      setParams(ps);
    } else if (operation === 'join') {
      setPreview(`SELECT * FROM ${dataset} ${joinType} JOIN ${joinTable} ON ${dataset}.${pk} = ${joinTable}.${pk};`);
      setParams([]);
    } else if (operation === 'aggregate') {
      const where = conditions.filter(c => c.column && c.value !== '').map(c => `${c.column} ${c.operator} ?`).join(' AND ');
      const sel = groupBy ? `${groupBy}, ${aggFunc}(${aggCol}) AS result` : `${aggFunc}(${aggCol}) AS result`;
      let sql = `SELECT ${sel} FROM ${dataset}`;
      const ps = conditions.filter(c => c.column && c.value !== '').map(c => parseVal(c.value));
      if (where) sql += ` WHERE ${where}`;
      if (groupBy) sql += ` GROUP BY ${groupBy}`;
      sql += ';';
      setPreview(sql);
      setParams(ps);
    }
  }

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      let payload: any;
      if (dbType === 'mongodb') {
        let filter = {}; let update = {}; let pipeline = [];
        try { filter = JSON.parse(mongoFilter || '{}'); } catch {}
        try { update = JSON.parse(mongoUpdate || '{}'); } catch {}
        try { pipeline = JSON.parse(mongoPipeline || '[]'); } catch {}
        let doc = {};
        try { doc = JSON.parse(mongoDoc || '{}'); } catch {}
        payload = { collection: dataset, operation, document: doc, filter, update, pipeline, limit: mongoLimit };
        const res = await dbApi.executeMongo(payload);
        setResult(res);
      } else {
        // build structured request based on operation
        payload = { database: 'sqlite', table: dataset, operation };
        if (operation === 'insert') {
          const cols = Object.keys(insertVals).filter(k => insertVals[k] !== '');
          const values: Record<string, any> = {};
          cols.forEach(c => { values[c] = parseVal(insertVals[c]); });
          payload.values = values;
        } else if (operation === 'select') {
          payload.columns = (selectCols.length && !selectCols.includes('*')) ? selectCols : undefined;
          payload.conditions = conditions.filter(c => c.column && c.value !== '').map(c => ({ column: c.column, operator: c.operator, value: parseVal(c.value) }));
          if (orderBy) payload.order_by = orderBy;
          payload.order_dir = orderDir;
          if (limit !== '') payload.limit = Number(limit);
        } else if (operation === 'update') {
          const cols = Object.keys(setVals).filter(k => setVals[k] !== '');
          const sv: Record<string, any> = {};
          cols.forEach(c => { sv[c] = parseVal(setVals[c]); });
          payload.set_values = sv;
          if (updateId) payload.record_id = Number(updateId);
        } else if (operation === 'delete') {
          if (deleteId) payload.record_id = Number(deleteId);
        } else if (operation === 'join') {
          payload.join_table = joinTable;
          payload.join_type = joinType;
        } else if (operation === 'aggregate') {
          payload.aggregate_func = aggFunc;
          payload.aggregate_column = aggCol;
          payload.group_by = groupBy || undefined;
          payload.conditions = conditions.filter(c => c.column && c.value !== '').map(c => ({ column: c.column, operator: c.operator, value: parseVal(c.value) }));
        }
        const res = await dbApi.executeSql(payload);
        setResult(res);
      }
      // refresh live rows
      await refreshRows();
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (e: any) {
      setResult({ success: false, error: e?.message || String(e), database: dbType, operation, preview, duration_ms: 0 });
    } finally {
      setRunning(false);
    }
  }

  async function refreshRows() {
    try {
      if (dbType === 'sqlite' && dataset) {
        const r = await dbApi.tableRows(dataset, 20, 0);
        setLiveRows(r);
      } else if (dbType === 'mongodb' && dataset) {
        const r = await dbApi.mongoRows(dataset, 20);
        setLiveRows({ rows: r.rows, total: r.rows.length });
      }
    } catch {}
  }

  const exportLiveCsv = () => {
    const rows = liveRows?.rows || [];
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r: any) => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${dataset}_live.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => { refreshRows(); }, [dataset, dbType]);

  const opsSql = ['insert', 'select', 'update', 'delete', 'join', 'aggregate'];
  const opsMongo = ['insertOne', 'find', 'updateOne', 'deleteOne', 'aggregate'];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Live Query Studio</h1>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Builder */}
        <SoftCard className="space-y-3">
          <h2 className="font-semibold">Operation Builder</h2>
          <div>
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Database</label>
            <select className="soft-input w-full px-3 py-2" value={dbType} onChange={e => { setDbType(e.target.value as any); setDataset(''); }}>
              <option value="sqlite">SQLite</option>
              <option value="mongodb">MongoDB</option>
            </select>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Dataset</label>
            <select className="soft-input w-full px-3 py-2" value={dataset} onChange={e => setDataset(e.target.value)}>
              {(dbType === 'sqlite' ? tables : collections).map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Operation</label>
            <select className="soft-input w-full px-3 py-2" value={operation} onChange={e => setOperation(e.target.value)}>
              {(dbType === 'sqlite' ? opsSql : opsMongo).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Dynamic forms */}
          {dbType === 'sqlite' && operation === 'insert' && (
            <div className="space-y-2">
              {columns.filter(c => c !== pk).map(col => (
                <div key={col}>
                  <label className="text-xs" style={{ color: 'var(--muted)' }}>{col}</label>
                  {col === 'category' ? (
                    <CategorySelect type={(insertVals.type === 'income' ? 'income' : 'expense')} value={insertVals[col] || ''} onChange={(v) => setInsertVals({ ...insertVals, [col]: v })} />
                  ) : (
                    <input className="soft-input w-full px-3 py-2" value={insertVals[col] || ''} onChange={e => setInsertVals({ ...insertVals, [col]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
          )}
          {dbType === 'sqlite' && operation === 'select' && (
            <div className="space-y-2">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Columns</label>
              <select multiple className="soft-input w-full px-3 py-2" value={selectCols} onChange={e => setSelectCols(Array.from(e.target.selectedOptions, o => o.value))}>
                <option value="*">*</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Conditions</label>
              {conditions.map((c, i) => (
                <div key={i} className="flex gap-1">
                  <select className="soft-input px-2 py-1" value={c.column} onChange={e => { const n = [...conditions]; n[i].column = e.target.value; setConditions(n); }}>
                    <option value="">col</option>{columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <select className="soft-input px-2 py-1" value={c.operator} onChange={e => { const n = [...conditions]; n[i].operator = e.target.value; setConditions(n); }}>
                    {['=', '!=', '>', '<', '>=', '<=', 'LIKE'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input className="soft-input px-2 py-1 flex-1" value={c.value} onChange={e => { const n = [...conditions]; n[i].value = e.target.value; setConditions(n); }} />
                  <button onClick={() => setConditions(conditions.filter((_, j) => j !== i))}>x</button>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setConditions([...conditions, { column: '', operator: '=', value: '' }])}>+ Condition</Button>
              <div className="flex gap-2">
                <select className="soft-input px-2 py-1 flex-1" value={orderBy} onChange={e => setOrderBy(e.target.value)}>
                  <option value="">Order by</option>{columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="soft-input px-2 py-1" value={orderDir} onChange={e => setOrderDir(e.target.value)}>
                  <option value="DESC">DESC</option><option value="ASC">ASC</option>
                </select>
              </div>
              <input className="soft-input w-full px-3 py-2" type="number" placeholder="Limit" value={limit} onChange={e => setLimit(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          )}
          {dbType === 'sqlite' && operation === 'update' && (
            <div className="space-y-2">
              <input className="soft-input w-full px-3 py-2" placeholder={`Record ${pk}`} value={updateId} onChange={e => setUpdateId(e.target.value)} />
              {columns.filter(c => c !== pk).map(col => (
                <div key={col}>
                  <label className="text-xs" style={{ color: 'var(--muted)' }}>{col}</label>
                  <input className="soft-input w-full px-3 py-2" value={setVals[col] || ''} onChange={e => setSetVals({ ...setVals, [col]: e.target.value })} />
                </div>
              ))}
            </div>
          )}
          {dbType === 'sqlite' && operation === 'delete' && (
            <div className="space-y-2">
              <input className="soft-input w-full px-3 py-2" placeholder={`Record ${pk} (or leave empty and use conditions)`} value={deleteId} onChange={e => setDeleteId(e.target.value)} />
            </div>
          )}
          {dbType === 'sqlite' && operation === 'join' && (
            <div className="space-y-2">
              <select className="soft-input w-full px-3 py-2" value={joinTable} onChange={e => setJoinTable(e.target.value)}>
                <option value="">Join table</option>
                {tables.filter((t: string) => t !== dataset).map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="soft-input w-full px-3 py-2" value={joinType} onChange={e => setJoinType(e.target.value)}>
                <option>INNER</option><option>LEFT</option>
              </select>
            </div>
          )}
          {dbType === 'sqlite' && operation === 'aggregate' && (
            <div className="space-y-2">
              <select className="soft-input w-full px-3 py-2" value={aggFunc} onChange={e => setAggFunc(e.target.value)}>
                {['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].map(f => <option key={f}>{f}</option>)}
              </select>
              <select className="soft-input w-full px-3 py-2" value={aggCol} onChange={e => setAggCol(e.target.value)}>
                <option value="*">*</option>{columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="soft-input w-full px-3 py-2" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                <option value="">Group by (none)</option>{columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {dbType === 'mongodb' && operation === 'insertOne' && (
            <textarea className="soft-input w-full px-3 py-2 font-mono text-xs" rows={6} value={mongoDoc} onChange={e => setMongoDoc(e.target.value)} />
          )}
          {dbType === 'mongodb' && (operation === 'find' || operation === 'updateOne' || operation === 'deleteOne') && (
            <div className="space-y-2">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Filter (JSON)</label>
              <textarea className="soft-input w-full px-3 py-2 font-mono text-xs" rows={3} value={mongoFilter} onChange={e => setMongoFilter(e.target.value)} />
              {operation === 'find' && <input className="soft-input w-full px-3 py-2" type="number" placeholder="Limit" value={mongoLimit} onChange={e => setMongoLimit(Number(e.target.value))} />}
              {operation === 'updateOne' && (
                <>
                  <label className="text-xs" style={{ color: 'var(--muted)' }}>Update (JSON)</label>
                  <textarea className="soft-input w-full px-3 py-2 font-mono text-xs" rows={3} value={mongoUpdate} onChange={e => setMongoUpdate(e.target.value)} />
                </>
              )}
            </div>
          )}
          {dbType === 'mongodb' && operation === 'aggregate' && (
            <textarea className="soft-input w-full px-3 py-2 font-mono text-xs" rows={8} value={mongoPipeline} onChange={e => setMongoPipeline(e.target.value)} />
          )}
        </SoftCard>

        {/* Preview */}
        <SoftCard className="space-y-3">
          <h2 className="font-semibold">Query Preview</h2>
          <Editor
            height="220px"
            defaultLanguage={dbType === 'sqlite' ? 'sql' : 'javascript'}
            value={preview}
            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
            theme="vs"
          />
          {params && params.length > 0 && (
            <div className="text-xs">
              <span style={{ color: 'var(--muted)' }}>Parameters: </span>
              <code className="font-mono">{JSON.stringify(params)}</code>
            </div>
          )}
          <Button onClick={run} disabled={running}><Play size={16} /> {running ? 'Running...' : 'Execute Query'}</Button>
          {result && (
            <div className={`text-sm p-2 rounded-xl ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div><strong>{result.success ? 'Success' : 'Error'}</strong> · {result.duration_ms} ms · affected: {result.affected_rows}</div>
              {result.error && <div className="text-red-600">{result.error}</div>}
              {result.history_id && <div className="text-xs" style={{ color: 'var(--muted)' }}>History #{result.history_id}</div>}
            </div>
          )}
        </SoftCard>

        {/* Results */}
        <SoftCard className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Live Data / Results</h2>
            <div className="flex gap-2">
              <button onClick={exportLiveCsv} title="Export CSV"><Download size={16} /></button>
              <button onClick={refreshRows}><RefreshCw size={16} /></button>
            </div>
          </div>
          {result?.rows && result.rows.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Execution result</p>
              <table className="w-full text-xs">
                <thead><tr>{Object.keys(result.rows[0]).map(k => <th key={k} className="text-left py-1">{k}</th>)}</tr></thead>
                <tbody>{result.rows.map((r: any, i: number) => (
                  <tr key={i} className="border-t" style={{ borderColor: '#cbd3df' }}>{Object.keys(r).map(k => <td key={k} className="py-1">{String(r[k])}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="overflow-x-auto">
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Persisted rows</p>
            {liveRows?.rows?.length ? (
              <table className="w-full text-xs">
                <thead><tr>{Object.keys(liveRows.rows[0]).map((k: string) => <th key={k} className="text-left py-1">{k}</th>)}</tr></thead>
                <tbody>{liveRows.rows.map((r: any, i: number) => (
                  <tr key={i} className="border-t" style={{ borderColor: '#cbd3df' }}>{Object.keys(r).map((k: string) => <td key={k} className="py-1">{String(r[k])}</td>)}</tr>
                ))}</tbody>
              </table>
            ) : <p className="text-sm" style={{ color: 'var(--muted)' }}>No rows</p>}
          </div>
        </SoftCard>
      </div>
    </div>
  );
}

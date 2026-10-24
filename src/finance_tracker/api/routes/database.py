from fastapi import APIRouter, HTTPException, Query
from ... import crud, nosql

router = APIRouter(prefix="/database", tags=["database"])


@router.get("/schema")
def schema():
    sql_schema = crud.full_schema()
    # mongo
    mongo_cols = []
    try:
        cols = nosql.list_collections()
        for c in cols:
            mongo_cols.append(nosql.collection_stats(c))
    except Exception as e:
        mongo_cols = [{"error": str(e)}]
    return {"sqlite": sql_schema, "mongodb": {"collections": mongo_cols}}


@router.get("/tables")
def tables():
    return {"tables": crud.list_tables()}


@router.get("/tables/{table}/rows")
def table_rows(table: str, limit: int = Query(50), offset: int = Query(0)):
    if table not in crud.ALLOWED_TABLES:
        raise HTTPException(400, "Table not allowed")
    return crud.table_rows(table, limit, offset)


@router.get("/tables/{table}/schema")
def table_schema(table: str):
    if table not in crud.ALLOWED_TABLES:
        raise HTTPException(400, "Table not allowed")
    return crud.table_schema(table)


@router.get("/triggers")
def triggers():
    return {"triggers": crud.list_triggers()}


@router.get("/views")
def views():
    return {"views": crud.list_views()}


@router.get("/indexes")
def indexes():
    return {"indexes": crud.list_indexes()}


@router.get("/mongo/collections")
def mongo_collections():
    try:
        cols = nosql.list_collections()
        return {"collections": [nosql.collection_stats(c) for c in cols]}
    except Exception as e:
        return {"error": str(e), "collections": []}


@router.get("/mongo/collections/{collection}/rows")
def mongo_rows(collection: str, limit: int = Query(50)):
    if collection not in nosql.ALLOWED_COLLECTIONS:
        raise HTTPException(400, "Collection not allowed")
    return {"rows": nosql.find(collection, None, limit)}

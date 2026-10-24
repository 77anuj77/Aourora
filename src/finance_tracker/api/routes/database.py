from fastapi import APIRouter, HTTPException, Query
from ... import crud, nosql
from ...auth import get_current_user
from fastapi import Depends

router = APIRouter(prefix="/database", tags=["database"])


@router.get("/schema")
def schema(user=Depends(get_current_user)):
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
def tables(user=Depends(get_current_user)):
    return {"tables": crud.list_tables()}


@router.get("/tables/{table}/rows")
def table_rows(table: str, limit: int = Query(50), offset: int = Query(0), user=Depends(get_current_user)):
    if table not in crud.ALLOWED_TABLES:
        raise HTTPException(400, "Table not allowed")
    return crud.table_rows(table, limit, offset)


@router.get("/tables/{table}/schema")
def table_schema(table: str, user=Depends(get_current_user)):
    if table not in crud.ALLOWED_TABLES:
        raise HTTPException(400, "Table not allowed")
    return crud.table_schema(table)


@router.get("/triggers")
def triggers(user=Depends(get_current_user)):
    return {"triggers": crud.list_triggers()}


@router.get("/views")
def views(user=Depends(get_current_user)):
    return {"views": crud.list_views()}


@router.get("/indexes")
def indexes(user=Depends(get_current_user)):
    return {"indexes": crud.list_indexes()}


@router.get("/mongo/collections")
def mongo_collections(user=Depends(get_current_user)):
    try:
        cols = nosql.list_collections()
        return {"collections": [nosql.collection_stats(c) for c in cols]}
    except Exception as e:
        return {"error": str(e), "collections": []}


@router.get("/mongo/collections/{collection}/rows")
def mongo_rows(collection: str, limit: int = Query(50), user=Depends(get_current_user)):
    if collection not in nosql.ALLOWED_COLLECTIONS:
        raise HTTPException(400, "Collection not allowed")
    return {"rows": nosql.find(collection, None, limit)}

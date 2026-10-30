from datetime import date
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, EmailStr

# This file contains validation models for pydantic

class UserCreate(BaseModel):
    name: str
    email: str


class UserOut(BaseModel):
    user_id: int
    name: str
    email: str


class TransactionCreate(BaseModel):
    user_id: int
    type: str = Field(pattern="^(income|expense)$")
    amount: float = Field(gt=0)
    category: str
    description: Optional[str] = None
    date: str


class TransactionUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None


class TransactionOut(BaseModel):
    transaction_id: int
    user_id: int
    type: str
    amount: float
    category: str
    description: Optional[str] = None
    date: str


class BudgetCreate(BaseModel):
    user_id: int
    category: str
    limit_amount: float = Field(ge=0)
    month: str


class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    limit_amount: Optional[float] = Field(None, ge=0)
    month: Optional[str] = None


class BudgetOut(BaseModel):
    budget_id: int
    user_id: int
    category: str
    limit_amount: float
    month: str


class BudgetVsActual(BaseModel):
    category: str
    month: str
    limit_amount: float
    spent: float
    remaining: float
    utilization: float


class DashboardSummary(BaseModel):
    user_id: int
    total_income: float
    total_expense: float
    balance: float
    budget_remaining: float
    monthly_income: float
    monthly_expense: float


# Query Studio
class SqlExecuteRequest(BaseModel):
    database: str = "sqlite"
    table: str
    operation: str  # insert/select/update/delete/join/aggregate
    values: Optional[Dict[str, Any]] = None
    columns: Optional[List[str]] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    order_by: Optional[str] = None
    order_dir: Optional[str] = "DESC"
    limit: Optional[int] = None
    join_table: Optional[str] = None
    join_type: Optional[str] = "INNER"
    join_on: Optional[str] = None
    aggregate_func: Optional[str] = None
    aggregate_column: Optional[str] = None
    group_by: Optional[str] = None
    record_id: Optional[int] = None
    set_values: Optional[Dict[str, Any]] = None
    where_id_column: Optional[str] = None


class MongoExecuteRequest(BaseModel):
    collection: str
    operation: str  # insertOne/find/updateOne/deleteOne/aggregate
    document: Optional[Dict[str, Any]] = None
    filter: Optional[Dict[str, Any]] = None
    update: Optional[Dict[str, Any]] = None
    pipeline: Optional[List[Dict[str, Any]]] = None
    limit: Optional[int] = None


class QueryResult(BaseModel):
    success: bool
    database: str
    operation: str
    preview: str
    parameters: Optional[List[Any]] = None
    affected_rows: Optional[int] = None
    duration_ms: float
    rows: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    history_id: Optional[int] = None


class HistoryOut(BaseModel):
    history_id: int
    database_name: str
    operation: str
    preview: Optional[str] = None
    parameters: Optional[str] = None
    status: str
    affected_rows: Optional[int] = None
    duration_ms: Optional[float] = None
    created_at: str

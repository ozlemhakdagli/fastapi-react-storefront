# E-commerce Starter (React + FastAPI + PostgreSQL)

A starter template for a small online shop: a React storefront, an admin panel and a FastAPI
backend on PostgreSQL. It is a modern rewrite of an old PHP/CodeIgniter student project, which is
kept in `legacy/` as a reference.

## Prerequisites

- [Miniconda or Anaconda](https://docs.conda.io/) and Git. Nothing is installed system-wide.

## Environment

```bash
conda create -n ecommerce -c conda-forge python=3.14 nodejs=24 -y
conda create -n pg18 -c conda-forge postgresql=18 -y
conda run -n ecommerce pip install -r backend/requirements-dev.txt
```

## Database

```bash
cp backend/.env.example backend/.env
scripts/db.sh init      # first time only: creates .pgdata/, the role and the database
scripts/db.sh start     # also: stop | status | psql | drop-test-dbs
```
